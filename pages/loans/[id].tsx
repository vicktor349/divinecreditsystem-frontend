import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { useLoan, useLoanSchedule, useLoanRepayments } from '@/hooks/useLoans';
import { loanService } from '@/services/loan.service';
import { useToast } from '@/context/ToastContext';
import {
  MdArrowBack,
  MdCalendarToday,
  MdPayment,
  MdHistory,
  MdTableChart,
  MdWarning,
  MdPerson,
  MdAccountBalance,
  MdBolt,
  MdDownload,
  MdPrint,
  MdAccessTime,
} from 'react-icons/md';
import { formatNumberInput, parseFormattedNumber, numberToDisplay } from '@/lib/numberInput';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Avoids ₦ → ¦ in jsPDF Helvetica
const fmtPDF = (n: number) =>
  new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

async function loadLogoBase64(url: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d')!.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

async function exportScheduleToPDF(loan: any, schedule: any) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new (jsPDF as any)({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usable = pageW - margin * 2;

  const logo = await loadLogoBase64('/images/logo.png');

  // ── Green header bar ──
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, pageW, 30, 'F');
  if (logo) doc.addImage(logo, 'PNG', margin, 8, 13, 13);
  const textX = logo ? margin + 17 : margin;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Divine Credit System', textX, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Loan Repayment Schedule', textX, 23);
  doc.setFontSize(8);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageW - margin, 23, { align: 'right' },
  );

  let y = 38;

  // ── Customer + account row ──
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(loan.customer?.name ?? '—', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  y += 5;
  doc.text(`Phone: ${loan.customer?.phone ?? '—'}`, margin, y);
  doc.text(`Account No: ${loan.accountNumber}`, margin + 55, y);
  doc.text(`Status: ${loan.status?.toUpperCase() ?? '—'}`, margin + 120, y);
  y += 8;

  // ── Loan details box ──
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, usable, 16, 2, 2, 'FD');

  const cols = [
    { label: 'Principal',     value: `NGN ${fmtPDF(Number(loan.principalAmount))}` },
    { label: 'Interest Rate', value: `${loan.interestRate}% p.a.` },
    { label: 'Tenure',        value: `${loan.tenureMonths} months` },
    { label: 'Type',          value: (loan.loanType ?? '—').toUpperCase() },
    { label: 'Start Date',    value: loan.startDate ? new Date(loan.startDate).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
    { label: 'End Date',      value: loan.endDate   ? new Date(loan.endDate).toLocaleDateString('en-NG',   { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
  ];
  const colW = usable / cols.length;
  cols.forEach((col, i) => {
    const cx = margin + i * colW + 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(col.label, cx, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(col.value, cx, y + 12);
  });
  y += 22;

  // ── Summary pills ──
  const pillData = [
    { label: 'Total Payable',  value: `NGN ${fmtPDF(schedule.summary.totalPayable)}`,      fill: [240, 253, 244] as [number, number, number], color: [22, 101, 52] as [number, number, number] },
    { label: 'Total Interest', value: `NGN ${fmtPDF(schedule.summary.totalInterest)}`,     fill: [239, 246, 255] as [number, number, number], color: [29, 78, 216] as [number, number, number] },
    { label: 'Amount Paid',    value: `NGN ${fmtPDF(schedule.summary.totalPaid)}`,         fill: [240, 253, 244] as [number, number, number], color: [22, 101, 52] as [number, number, number] },
    { label: 'Remaining',      value: `NGN ${fmtPDF(schedule.summary.remainingBalance)}`,  fill: [255, 251, 235] as [number, number, number], color: [180, 83, 9]  as [number, number, number] },
  ];
  const pillW = (usable - 9) / 4;
  pillData.forEach((p, i) => {
    const px = margin + i * (pillW + 3);
    doc.setFillColor(...p.fill);
    doc.roundedRect(px, y, pillW, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(p.label, px + 2, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...p.color);
    doc.text(p.value, px + 2, y + 11);
  });
  y += 20;

  // ── Schedule table ──
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Due Date', 'Status', 'Principal (NGN)', 'Interest (NGN)', 'Amount Due (NGN)', 'Balance (NGN)']],
    body: schedule.schedule.map((row: any) => [
      row.month,
      row.date ? new Date(row.date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      row.status === 'disbursed' ? 'Disbursement' :
      row.status === 'paid'     ? 'Paid' :
      row.status === 'next'     ? 'Next Due' : 'Upcoming',
      row.status === 'disbursed' ? '—' : fmtPDF(row.principalRepayment),
      row.status === 'disbursed' ? '—' : fmtPDF(row.interestAmount),
      row.status === 'disbursed' ? fmtPDF(Number(loan.principalAmount)) : fmtPDF(row.amountPayable),
      fmtPDF(row.loanBalance),
    ]),
    headStyles: {
      fillColor: [22, 101, 52] as [number, number, number],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold' as const,
    },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] as [number, number, number] },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' as const },
      1: { cellWidth: 28 },
      2: { cellWidth: 26 },
      3: { cellWidth: 28, halign: 'right' as const },
      4: { cellWidth: 28, halign: 'right' as const },
      5: { cellWidth: 30, halign: 'right' as const },
      6: { cellWidth: 'auto' as const, halign: 'right' as const, fontStyle: 'bold' as const },
    },
    didParseCell(data: any) {
      // Align numeric headers to the right
      if (data.section === 'head' && data.column.index >= 3) {
        data.cell.styles.halign = 'right';
      }
      if (data.section === 'body') {
        const row = schedule.schedule[data.row.index];
        if (!row) return;
        if (row.status === 'disbursed') {
          data.cell.styles.fillColor = [240, 253, 244];
          data.cell.styles.textColor = [22, 101, 52];
        } else if (row.status === 'paid') {
          data.cell.styles.textColor = [148, 163, 184];
        } else if (row.status === 'next') {
          data.cell.styles.fillColor = [239, 246, 255];
          if (data.column.index >= 3) data.cell.styles.textColor = [29, 78, 216];
        }
      }
    },
  });

  // ── Footer on every page ──
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Divine Credit System  •  Repayment Schedule  •  ${loan.accountNumber}  •  Page ${i} of ${pageCount}`,
      pageW / 2, doc.internal.pageSize.getHeight() - 6,
      { align: 'center' },
    );
  }

  doc.save(`repayment-schedule-${loan.accountNumber}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function exportReceiptToPDF(
  loan: any,
  repayment: {
    amount: number;
    narration: string;
    outstandingBalance: number | null;
    status?: string;
    date?: Date | string;
  },
) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new (jsPDF as any)({ orientation: 'portrait', unit: 'mm', format: [80, 140] });
  const logo = await loadLogoBase64('/images/logo.png');
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 8;

  // Header
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, pageW, 24, 'F');
  if (logo) doc.addImage(logo, 'PNG', margin, 5, 10, 10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Divine Credit System', margin + 14, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Repayment Receipt', margin + 14, 17);

  let y = 30;

  // Receipt title
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PAYMENT RECEIPT', pageW / 2, y, { align: 'center' });
  y += 3;
  doc.setDrawColor(22, 101, 52);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // Use the repayment's actual date if provided, otherwise now
  const receiptDate = repayment.date ? new Date(repayment.date) : new Date();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Date: ${receiptDate.toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    margin, y,
  );
  doc.text(
    `Time: ${receiptDate.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`,
    pageW - margin, y, { align: 'right' },
  );
  y += 8;

  // Info rows
  const infoRows = [
    { label: 'Customer',     value: loan.customer?.name ?? '—' },
    { label: 'Phone',        value: loan.customer?.phone ?? '—' },
    { label: 'Loan Account', value: loan.accountNumber ?? '—' },
    { label: 'Narration',    value: repayment.narration },
  ];
  for (const row of infoRows) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(row.label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    // Truncate long values so they don't overflow
    const val = row.value.length > 28 ? row.value.slice(0, 27) + '…' : row.value;
    doc.text(val, pageW - margin, y, { align: 'right' });
    y += 5;
  }
  y += 3;

  // Amount box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(134, 239, 172);
  doc.roundedRect(margin, y, pageW - margin * 2, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Amount Paid', pageW / 2, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(22, 101, 52);
  doc.text(`NGN ${fmtPDF(repayment.amount)}`, pageW / 2, y + 13, { align: 'center' });
  y += 23;

  // Outstanding balance (only if we know it)
  if (repayment.outstandingBalance !== null && repayment.outstandingBalance !== undefined) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Outstanding Balance', margin, y);
    const isRepaid = repayment.status === 'repaid' || repayment.outstandingBalance === 0;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(isRepaid ? 22 : 180, isRepaid ? 101 : 83, isRepaid ? 52 : 9);
    doc.text(`NGN ${fmtPDF(repayment.outstandingBalance)}`, pageW - margin, y, { align: 'right' });
    y += 5;

    if (isRepaid) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(22, 101, 52);
      doc.text('LOAN FULLY REPAID', pageW / 2, y + 4, { align: 'center' });
      y += 8;
    }
  }

  // Footer
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated receipt and requires no signature.', pageW / 2, y, { align: 'center' });
  y += 4;
  doc.text('Divine Credit System — Thank you for your payment.', pageW / 2, y, { align: 'center' });

  const dateStr = receiptDate.toISOString().slice(0, 10);
  doc.save(`receipt-${loan.accountNumber}-${dateStr}.pdf`);
}

const fmtDatetime = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

type Tab = 'schedule' | 'repayments';

export default function LoanDetailPage() {
  const { isLoading: authLoading, isAuthenticated } = useUser();
  const router = useRouter();
  const id = router.query.id ? Number(router.query.id) : null;

  const { loan, isLoading: loanLoading, isError: loanError, mutate: mutateLoan } = useLoan(id);
  const { schedule, isLoading: scheduleLoading } = useLoanSchedule(id);
  const { repayments, isLoading: repaymentsLoading, mutate: mutateRepayments } = useLoanRepayments(id);

  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('schedule');
  const [repayModal, setRepayModal] = useState(false);
  const [repayForm, setRepayForm] = useState({ amount: '', narration: '' });
  const [repaySubmitting, setRepaySubmitting] = useState(false);
  const [repayError, setRepayError] = useState('');
  const [repaySuccess, setRepaySuccess] = useState('');
  const [defaultConfirm, setDefaultConfirm] = useState(false);
  const [defaulting, setDefaulting] = useState(false);

  // Pay from balance — fixed (next due amount)
  const [payBalanceConfirm, setPayBalanceConfirm] = useState(false);
  const [payingBalance, setPayingBalance] = useState(false);

  // Pay custom amount from balance
  const [payCustomModal, setPayCustomModal] = useState(false);
  const [payCustomAmount, setPayCustomAmount] = useState('');
  const [payCustomSubmitting, setPayCustomSubmitting] = useState(false);
  const [payCustomError, setPayCustomError] = useState('');
  const [exportingSchedule, setExportingSchedule] = useState(false);

  // Receipt
  const [lastReceipt, setLastReceipt] = useState<{ amount: number; narration: string; outstandingBalance: number | null; status: string } | null>(null);
  const [printingReceiptId, setPrintingReceiptId] = useState<number | 'modal' | null>(null);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated && !authLoading) { router.push('/'); return null; }

  function openRepayModal() {
    setRepayError('');
    setRepaySuccess('');
    const outstanding = Number(loan?.outstandingBalance ?? 0);
    const nextPayment = Number(loan?.nextPaymentAmount ?? 0);
    // Cap suggested amount at outstanding balance so user never sees a value they can't submit
    const suggested = nextPayment > 0 ? Math.min(nextPayment, outstanding) : outstanding;
    setRepayForm({
      amount: suggested > 0 ? numberToDisplay(suggested) : '',
      narration: '',
    });
    setRepayModal(true);
  }

  async function handleRepayment(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setRepayError('');
    setRepaySuccess('');
    setRepaySubmitting(true);
    try {
      const amount = parseFormattedNumber(repayForm.amount);
      const res: any = await loanService.recordRepayment(id, {
        amount,
        narration: repayForm.narration,
      });
      const msg = res.message ?? 'Repayment recorded';
      setRepaySuccess(msg);
      setLastReceipt({
        amount,
        narration: repayForm.narration,
        outstandingBalance: res.outstandingBalance ?? 0,
        status: res.status ?? 'active',
        date: new Date(),
      } as any);
      mutateLoan();
      mutateRepayments();
      showToast(msg, 'success');
      setTimeout(() => { setRepayModal(false); setTab('repayments'); }, 2000);
    } catch (err: any) {
      setRepayError(err?.response?.data?.message ?? 'Repayment failed');
    } finally {
      setRepaySubmitting(false);
    }
  }

  async function handleMarkDefaulted() {
    if (!id) return;
    setDefaulting(true);
    try {
      await loanService.markDefaulted(id);
      mutateLoan();
      setDefaultConfirm(false);
      showToast('Loan marked as defaulted', 'info');
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Failed to mark defaulted', 'error');
    } finally {
      setDefaulting(false);
    }
  }

  async function handlePayFromBalance() {
    if (!id) return;
    setPayingBalance(true);
    try {
      const res: any = await loanService.repayFromBalance(id);
      mutateLoan();
      mutateRepayments();
      setPayBalanceConfirm(false);
      showToast(res.message ?? 'Repayment deducted from balance', 'success');
      setTab('repayments');
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Failed to deduct from balance', 'error');
    } finally {
      setPayingBalance(false);
    }
  }

  async function handlePayCustomFromBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setPayCustomError('');
    setPayCustomSubmitting(true);
    try {
      const res: any = await loanService.repayFromBalance(id, parseFormattedNumber(payCustomAmount));
      mutateLoan();
      mutateRepayments();
      setPayCustomModal(false);
      setPayCustomAmount('');
      showToast(res.message ?? 'Repayment deducted from balance', 'success');
      setTab('repayments');
    } catch (err: any) {
      setPayCustomError(err?.response?.data?.message ?? 'Failed to deduct from balance');
    } finally {
      setPayCustomSubmitting(false);
    }
  }

  const totalPayable = schedule?.summary.totalPayable ?? Number(loan?.principalAmount ?? 0);
  const progressPct = loan && totalPayable > 0
    ? Math.min(100, Math.max(0, ((totalPayable - Number(loan.outstandingBalance)) / totalPayable) * 100))
    : 0;

  return (
    <DashboardLayout>
      <Head><title>Divine Credit System | Loan Detail</title></Head>

      <div className="max-w-5xl mx-auto space-y-6 bg-[#f8fafc] min-h-full px-1 py-1">
        <Link href="/loans" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors animate-fade-in">
          <MdArrowBack size={16} /> Back to Loans
        </Link>

        {loanLoading && (
          <div className="space-y-4 animate-fade-in">
            <div className="skeleton h-36 rounded-2xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        )}

        {loanError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm animate-fade-in">
            Loan not found or an error occurred.
          </div>
        )}

        {loan && !loanLoading && (
          <>
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-slide-up shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm shadow-green-600/25">
                    {loan.customer?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-[17px] font-bold text-slate-900">{loan.customer?.name}</h1>
                      <Badge variant={loan.status} />
                      <Badge variant={loan.loanType} />
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{loan.customer?.phone}</p>
                    <p className="font-mono text-[11px] text-slate-400 mt-0.5">{loan.accountNumber}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/customers/${loan.customerId}`}
                    className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                  >
                    <MdPerson size={15} /> View Customer
                  </Link>
                  {loan.status === 'pending' && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <MdAccessTime size={16} className="text-amber-600 flex-shrink-0" />
                      <p className="text-sm text-amber-700 font-medium">Awaiting admin approval</p>
                    </div>
                  )}
                  {(loan.status === 'active' || loan.status === 'defaulted') && (
                    <>
                      <button
                        onClick={openRepayModal}
                        className="flex items-center gap-1.5 bg-green-600 text-white px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-600/25"
                      >
                        <MdPayment size={15} /> Record Repayment
                      </button>
                      {/* One-click: deduct exact next-due amount from deposit */}
                      <button
                        onClick={() => setPayBalanceConfirm(true)}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-600/25"
                        title="Deduct next payment amount directly from deposit balance"
                      >
                        <MdBolt size={15} /> Pay Due from Balance
                      </button>
                      {/* Custom amount deducted from deposit */}
                      <button
                        onClick={() => { setPayCustomAmount(''); setPayCustomError(''); setPayCustomModal(true); }}
                        className="flex items-center gap-1.5 border border-blue-200 text-blue-600 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-blue-50 active:scale-95 transition-all"
                        title="Deduct a custom amount from deposit balance"
                      >
                        <MdAccountBalance size={15} /> Deduct from Balance
                      </button>
                      {loan.status === 'active' && (
                        <button
                          onClick={() => setDefaultConfirm(true)}
                          className="flex items-center gap-1.5 border border-red-200 text-red-600 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-red-50 active:scale-95 transition-all"
                        >
                          <MdWarning size={15} /> Mark Defaulted
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Repayment progress */}
              {(loan.status === 'active' || loan.status === 'defaulted') && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span className="font-medium">Repayment Progress</span>
                    <span className="font-semibold text-slate-700">{progressPct.toFixed(1)}% repaid</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        loan.status === 'defaulted'
                          ? 'bg-gradient-to-r from-red-400 to-red-600'
                          : 'bg-gradient-to-r from-green-400 to-green-600'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up" style={{ animationDelay: '80ms' }}>
              {[
                { label: 'Principal', value: fmt(Number(loan.principalAmount)), color: 'text-slate-800' },
                { label: 'Outstanding', value: fmt(Number(loan.outstandingBalance)), color: 'text-amber-700' },
                { label: 'Interest Rate', value: `${loan.interestRate}% p.a.`, color: 'text-blue-700' },
                { label: 'Tenure', value: `${loan.tenureMonths} months`, color: 'text-violet-700' },
              ].map((s, i) => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <p className="text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-[17px] font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '160ms' }}>
              {[
                { label: 'Start Date', value: fmtDate(loan.startDate), icon: <MdCalendarToday size={15} /> },
                { label: 'End Date', value: fmtDate(loan.endDate), icon: <MdCalendarToday size={15} /> },
                {
                  label: 'Next Payment',
                  value: loan.nextPaymentDate
                    ? `${fmtDate(loan.nextPaymentDate)} · ${fmt(loan.nextPaymentAmount ?? 0)}`
                    : '—',
                  icon: <MdPayment size={15} />,
                },
              ].map(d => (
                <div key={d.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
                  <span className="text-slate-400 flex-shrink-0">{d.icon}</span>
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{d.label}</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{d.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="animate-slide-up" style={{ animationDelay: '220ms' }}>
              <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit mb-4 shadow-sm">
                {([
                  ['schedule', 'Repayment Schedule', <MdTableChart key="t" size={15} />],
                  ['repayments', 'Repayment History', <MdHistory key="h" size={15} />],
                ] as const).map(([t, label, icon]) => (
                  <button
                    key={t}
                    onClick={() => setTab(t as Tab)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                      tab === t
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Schedule tab */}
              {tab === 'schedule' && (
                scheduleLoading ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10" style={{ animationDelay: `${i * 60}ms` }} />)}
                  </div>
                ) : schedule ? (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Summary header */}
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                        <span className="text-[12px] text-slate-500">Total Payable: <span className="font-bold text-slate-800">{fmt(schedule.summary.totalPayable)}</span></span>
                        <span className="text-[12px] text-slate-500">Paid: <span className="font-bold text-green-700">{fmt(schedule.summary.totalPaid)}</span></span>
                        <span className="text-[12px] text-slate-500">Remaining: <span className="font-bold text-amber-700">{fmt(schedule.summary.remainingBalance)}</span></span>
                        <span className="text-[12px] text-slate-500">Interest: <span className="font-bold text-blue-700">{fmt(schedule.summary.totalInterest)}</span></span>
                      </div>
                      <button
                        onClick={async () => {
                          setExportingSchedule(true);
                          try { await exportScheduleToPDF(loan, schedule); }
                          finally { setExportingSchedule(false); }
                        }}
                        disabled={exportingSchedule}
                        className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 shadow-sm"
                      >
                        <MdDownload size={14} />
                        {exportingSchedule ? 'Generating…' : 'Export PDF'}
                      </button>
                    </div>
                    <div className="overflow-auto max-h-[480px]">
                      <table className="w-full text-[13px] min-w-[640px]">
                        <thead className="sticky top-0 z-10">
                          <tr className="border-b border-slate-100">
                            <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">#</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Date</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Status</th>
                            <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Principal</th>
                            <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Interest</th>
                            <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Amount Due</th>
                            <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Balance After</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {schedule.schedule.map((row, i) => {
                            const isDisbursed = row.status === 'disbursed';
                            const isPaid = row.status === 'paid';
                            const isNext = row.status === 'next';
                            return (
                              <tr
                                key={i}
                                className={`transition-colors animate-slide-up ${
                                  isDisbursed ? 'bg-emerald-50/60' :
                                  isPaid ? 'bg-slate-50/70' :
                                  isNext ? 'bg-blue-50/40' :
                                  'hover:bg-slate-50/60'
                                }`}
                                style={{ animationDelay: `${i * 20}ms` }}
                              >
                                <td className="px-5 py-3 text-slate-400 text-[11px] font-mono">{row.month}</td>
                                <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{fmtDate(row.date as any)}</td>
                                <td className="px-5 py-3">
                                  {isDisbursed && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />Disbursed
                                    </span>
                                  )}
                                  {isPaid && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />Paid
                                    </span>
                                  )}
                                  {isNext && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full ring-1 ring-blue-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />Next Due
                                    </span>
                                  )}
                                  {row.status === 'upcoming' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />Upcoming
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3 text-right text-slate-600">{isDisbursed ? '—' : fmt(row.principalRepayment)}</td>
                                <td className="px-5 py-3 text-right text-amber-700">{isDisbursed ? '—' : fmt(row.interestAmount)}</td>
                                <td className={`px-5 py-3 text-right font-semibold ${
                                  isNext ? 'text-blue-700' :
                                  isDisbursed ? 'text-emerald-700' :
                                  isPaid ? 'text-slate-400' :
                                  'text-slate-700'
                                }`}>
                                  {isDisbursed ? fmt(Number(loan.principalAmount)) : fmt(row.amountPayable)}
                                </td>
                                <td className="px-5 py-3 text-right text-slate-700">{fmt(row.loanBalance)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null
              )}

              {/* Repayments tab */}
              {tab === 'repayments' && (
                repaymentsLoading ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10" style={{ animationDelay: `${i * 60}ms` }} />)}
                  </div>
                ) : repayments.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <EmptyState
                      icon={<MdHistory />}
                      title="No repayments yet"
                      description="Record the first repayment to see history here."
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-auto max-h-[480px]">
                      <table className="w-full text-[13px] min-w-[680px]">
                        <thead className="sticky top-0 z-10">
                          <tr className="border-b border-slate-100">
                            <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Date</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Narration</th>
                            <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Amount Paid</th>
                            <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Expected</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Method</th>
                            <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Recorded By</th>
                            <th className="px-5 py-3.5 bg-slate-50/70" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {repayments.map((r, i) => (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition-colors animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                              <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">{fmtDatetime(r.createdAt)}</td>
                              <td className="px-5 py-3.5 text-slate-700">{r.narration}</td>
                              <td className="px-5 py-3.5 text-right font-bold text-green-700">{fmt(Number(r.amount))}</td>
                              <td className="px-5 py-3.5 text-right text-slate-500">{fmt(Number(r.expectedAmount))}</td>
                              <td className="px-5 py-3.5"><Badge variant={r.method as any} /></td>
                              <td className="px-5 py-3.5 text-slate-500 text-[12px]">{r.createdBy?.name}</td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  onClick={async () => {
                                    if (!loan) return;
                                    setPrintingReceiptId(r.id);
                                    try {
                                      await exportReceiptToPDF(loan, {
                                        amount: Number(r.amount),
                                        narration: r.narration,
                                        outstandingBalance: null,
                                        date: r.createdAt,
                                      });
                                    } finally {
                                      setPrintingReceiptId(null);
                                    }
                                  }}
                                  disabled={printingReceiptId === r.id}
                                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-green-700 hover:bg-green-50 disabled:opacity-40 border border-slate-200 hover:border-green-200 px-2.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap"
                                  title="Print receipt for this payment"
                                >
                                  <MdPrint size={13} />
                                  {printingReceiptId === r.id ? 'Printing…' : 'Receipt'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Mark Defaulted confirmation modal */}
      <Modal isOpen={defaultConfirm} onClose={() => setDefaultConfirm(false)} title="Mark Loan as Defaulted" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3.5">
            <MdWarning className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
            <p className="text-sm text-red-700">
              This will mark the loan as <strong>defaulted</strong>. You can still record repayments afterwards. This action cannot be easily undone.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleMarkDefaulted}
              disabled={defaulting}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 active:scale-95 transition-all"
            >
              {defaulting ? 'Processing...' : 'Yes, Mark Defaulted'}
            </button>
            <button
              onClick={() => setDefaultConfirm(false)}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Pay due amount from balance — confirmation */}
      <Modal isOpen={payBalanceConfirm} onClose={() => setPayBalanceConfirm(false)} title="Pay Due Amount from Balance" size="sm">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5 space-y-2 text-sm text-blue-800">
            <p>This will deduct <span className="font-bold">{fmt(Math.min(Number(loan?.nextPaymentAmount ?? 0), Number(loan?.outstandingBalance ?? 0)))}</span> directly from the customer's deposit account.</p>
            <p className="text-[12px] text-blue-600">The deposit account must have sufficient balance. A withdrawal transaction will be recorded automatically.</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handlePayFromBalance}
              disabled={payingBalance}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-blue-600/25"
            >
              {payingBalance ? 'Processing...' : 'Confirm Deduction'}
            </button>
            <button
              onClick={() => setPayBalanceConfirm(false)}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Deduct custom amount from balance */}
      <Modal isOpen={payCustomModal} onClose={() => setPayCustomModal(false)} title="Deduct from Deposit Balance" size="sm">
        <form onSubmit={handlePayCustomFromBalance} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[12px] text-slate-500">
            Specify an amount to deduct from the customer's deposit account as a loan repayment. The deposit balance must be sufficient.
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Amount to Deduct (₦)
              {loan?.outstandingBalance && (
                <span className="text-[11px] text-slate-400 ml-2">Max: {fmt(Number(loan.outstandingBalance))}</span>
              )}
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="0.00"
              value={payCustomAmount}
              onChange={e => setPayCustomAmount(formatNumberInput(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          {payCustomError && (
            <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{payCustomError}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={payCustomSubmitting}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-blue-600/25"
            >
              {payCustomSubmitting ? 'Processing...' : 'Deduct from Balance'}
            </button>
            <button type="button" onClick={() => setPayCustomModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Repayment modal */}
      <Modal isOpen={repayModal} onClose={() => setRepayModal(false)} title="Record Repayment" size="sm">
        <form onSubmit={handleRepayment} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Amount (₦)
              {loan?.nextPaymentAmount && (
                <span className="text-[11px] text-slate-400 ml-2">
                  Suggested: {fmt(Math.min(Number(loan.nextPaymentAmount), Number(loan.outstandingBalance)))}
                </span>
              )}
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="0.00"
              value={repayForm.amount}
              onChange={e => setRepayForm(f => ({ ...f, amount: formatNumberInput(e.target.value) }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Narration</label>
            <input
              type="text" required placeholder="e.g. January repayment"
              value={repayForm.narration}
              onChange={e => setRepayForm(f => ({ ...f, narration: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          {repayError && <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{repayError}</p>}
          {repaySuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 space-y-3">
              <p className="text-green-700 text-sm font-medium">{repaySuccess}</p>
              {lastReceipt && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!loan) return;
                    setPrintingReceiptId('modal');
                    try { await exportReceiptToPDF(loan, lastReceipt); }
                    finally { setPrintingReceiptId(null); }
                  }}
                  disabled={printingReceiptId === 'modal'}
                  className="flex items-center gap-1.5 text-green-700 bg-white border border-green-200 hover:bg-green-50 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  <MdPrint size={13} /> {printingReceiptId === 'modal' ? 'Generating...' : 'Print Receipt'}
                </button>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={repaySubmitting || !!repaySuccess}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-green-600/25"
            >
              {repaySubmitting ? 'Recording...' : 'Record Repayment'}
            </button>
            <button type="button" onClick={() => setRepayModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              {repaySuccess ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
