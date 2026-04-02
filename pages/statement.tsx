import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import { useUser } from '@/context/UserContext';
import { depositService, StatementResponse } from '@/services/deposit.service';
import {
  MdSearch,
  MdTrendingUp,
  MdTrendingDown,
  MdSwapHoriz,
  MdCalendarToday,
  MdPrint,
  MdDownload,
  MdTableView,
} from 'react-icons/md';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateLong = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

// Plain number formatter for PDF (avoids ₦ which jsPDF can't render)
const fmtPDF = (n: number) =>
  new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

async function loadImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function exportToPDF(statement: StatementResponse) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  // Landscape A4: usable width ~267mm (297 - 2x15 margins)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const customer = statement.customer;
  const period =
    statement.period.startDate || statement.period.endDate
      ? `${fmtDateLong(statement.period.startDate) ?? 'Beginning'} - ${fmtDateLong(statement.period.endDate) ?? 'Today'}`
      : 'All time';

  // ── Load logo ──
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadImageAsBase64('/images/logo.png');
  } catch {
    // logo missing — continue without it
  }

  // ── Header bar ──
  const headerH = 16;
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, pageW, headerH, 'F');

  // Logo (square, vertically centred in header bar)
  const logoSize = 10;
  const logoY = (headerH - logoSize) / 2;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, logoY, logoSize, logoSize);
  }

  // Company name next to logo
  const textX = logoDataUrl ? margin + logoSize + 3 : margin;
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Divine Credit System', textX, headerH / 2 + 1.5);

  // "Statement of Account" on the right
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Statement of Account', pageW - margin, headerH / 2 + 1.5, { align: 'right' });

  // ── Customer info block ──
  const infoTop = headerH + 6;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.name, margin, infoTop);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Phone: ${customer.phone}`, margin, infoTop + 6);
  doc.text(`Period: ${period}`, margin, infoTop + 12);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, infoTop + 18);

  // ── Summary pills (right side) ──
  const summaryX = pageW / 2 + 10;
  const summaryTop = headerH + 4;
  doc.setFontSize(8);

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(summaryX, summaryTop, 70, 10, 2, 2, 'F');
  doc.setTextColor(22, 101, 52);
  doc.text('Total Deposits', summaryX + 4, summaryTop + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`NGN ${fmtPDF(statement.summary.totalDeposits)}`, summaryX + 66, summaryTop + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(summaryX, summaryTop + 12, 70, 10, 2, 2, 'F');
  doc.setTextColor(185, 28, 28);
  doc.text('Total Withdrawals', summaryX + 4, summaryTop + 18.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`NGN ${fmtPDF(statement.summary.totalWithdrawals)}`, summaryX + 66, summaryTop + 18.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(summaryX, summaryTop + 24, 70, 8, 2, 2, 'F');
  doc.setTextColor(29, 78, 216);
  doc.text(`${statement.summary.totalTransactions} transaction${statement.summary.totalTransactions !== 1 ? 's' : ''}`, summaryX + 4, summaryTop + 29.5);

  // ── Separator ──
  const separatorY = headerH + 38;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, separatorY, pageW - margin, separatorY);

  // ── Transactions table ──
  autoTable(doc, {
    startY: separatorY + 4,
    margin: { left: margin, right: margin },
    head: [['Date', 'Account No.', 'Narration', 'Type', 'Debit (NGN)', 'Credit (NGN)', 'Balance (NGN)']],
    body: statement.transactions.map(txn => [
      fmtDate(txn.date),
      txn.accountNumber,
      txn.narration,
      txn.type === 'loan_repayment' ? 'Loan Repayment' : txn.type.charAt(0).toUpperCase() + txn.type.slice(1),
      txn.type === 'withdrawal' ? fmtPDF(Number(txn.amount)) : '',
      txn.type === 'deposit' || txn.type === 'loan_repayment' ? fmtPDF(Number(txn.amount)) : '',
      txn.balanceAfter != null ? fmtPDF(Number(txn.balanceAfter)) : '',
    ]),
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 30, font: 'courier' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 26 },
      4: { cellWidth: 34, halign: 'right' },
      5: { cellWidth: 34, halign: 'right' },
      6: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(data) {
      // Force right-align on numeric column headers to match body cells
      if (data.section === 'head' && [4, 5, 6].includes(data.column.index)) {
        data.cell.styles.halign = 'right';
      }
      // Colour debit cells red, credit cells green
      if (data.section === 'body') {
        if (data.column.index === 4 && data.cell.raw !== '') {
          data.cell.styles.textColor = [185, 28, 28];
        }
        if (data.column.index === 5 && data.cell.raw !== '') {
          data.cell.styles.textColor = [22, 101, 52];
        }
      }
    },
  });

  // ── Footer on each page ──
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(
      `Divine Credit System  |  Confidential  |  Page ${i} of ${pageCount}`,
      pageW / 2, doc.internal.pageSize.getHeight() - 6,
      { align: 'center' },
    );
  }

  doc.save(`statement_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function exportToExcel(statement: StatementResponse) {
  import('xlsx').then(XLSX => {
    const customer = statement.customer;

    // Metadata rows
    const meta = [
      ['Divine Credit System — Statement of Account'],
      [`Customer: ${customer.name}`, '', `Phone: ${customer.phone}`],
      [`Generated: ${new Date().toLocaleString('en-NG')}`],
      [],
      [`Total Deposits`, fmt(statement.summary.totalDeposits), `Total Withdrawals`, fmt(statement.summary.totalWithdrawals), `Entries`, statement.summary.totalTransactions],
      [],
      ['Date', 'Account No.', 'Narration', 'Type', 'Debit (₦)', 'Credit (₦)', 'Balance (₦)'],
    ];

    // Transaction rows
    const rows = statement.transactions.map(txn => [
      fmtDate(txn.date),
      txn.accountNumber,
      txn.narration,
      txn.type === 'loan_repayment' ? 'Loan Repayment' : txn.type.charAt(0).toUpperCase() + txn.type.slice(1),
      txn.type === 'withdrawal' ? Number(txn.amount) : '',
      txn.type === 'deposit' || txn.type === 'loan_repayment' ? Number(txn.amount) : '',
      txn.balanceAfter != null ? Number(txn.balanceAfter) : '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...meta, ...rows]);

    // Column widths
    ws['!cols'] = [
      { wch: 18 }, { wch: 16 }, { wch: 36 }, { wch: 18 },
      { wch: 16 }, { wch: 16 }, { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statement');
    XLSX.writeFile(wb, `statement_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  });
}

export default function StatementPage() {
  const { isLoading: authLoading, isAuthenticated } = useUser();
  const router = useRouter();

  const [accountNumber, setAccountNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statement, setStatement] = useState<StatementResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const q = router.query.accountNumber as string;
    if (q && !accountNumber) {
      setAccountNumber(q);
      fetchStatement(q);
    }
  }, [router.query.accountNumber]);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated && !authLoading) { router.push('/'); return null; }

  async function fetchStatement(acct: string, start?: string, end?: string) {
    if (!acct.trim()) return;
    setError('');
    setStatement(null);
    setIsLoading(true);
    try {
      const data = await depositService.getStatementByAccountNumber(acct.trim(), start, end);
      setStatement(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Account not found. Please check the account number.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchStatement(accountNumber, startDate || undefined, endDate || undefined);
  }

  function handleClear() {
    setAccountNumber('');
    setStartDate('');
    setEndDate('');
    setStatement(null);
    setError('');
  }

  return (
    <DashboardLayout>
      <Head><title>Divine Credit System | Statement of Account</title></Head>

      <div className="max-w-5xl mx-auto space-y-6 bg-[#f8fafc] min-h-full px-1 py-1">
        <PageHeader
          title="Statement of Account"
          subtitle="Enter an account number to generate a full transaction statement"
        />

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-slide-up"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Account Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="e.g. 2123456789"
                  required
                  maxLength={10}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono bg-slate-50 focus:bg-white transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Deposit (starts 2) or loan account number</p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                From Date
              </label>
              <div className="relative">
                <MdCalendarToday className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                To Date
              </label>
              <div className="relative">
                <MdCalendarToday className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              type="submit"
              disabled={isLoading || !accountNumber.trim()}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-green-600/25"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MdSearch size={16} />
              )}
              {isLoading ? 'Fetching...' : 'Generate Statement'}
            </button>
            {(statement || error) && (
              <button
                type="button"
                onClick={handleClear}
                className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Statement output */}
        {statement && !isLoading && (
          <div className="space-y-5 animate-slide-up">

            {/* Customer + account header banner */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <p className="text-green-200 text-[11px] uppercase tracking-widest font-semibold mb-1">Statement of Account</p>
                  <h2 className="text-2xl font-bold">{statement.customer.name}</h2>
                  <p className="text-green-200 text-sm mt-0.5">{statement.customer.phone}</p>
                  {(statement.period.startDate || statement.period.endDate) && (
                    <p className="text-green-100 text-xs mt-2 flex items-center gap-1.5">
                      <MdCalendarToday size={12} />
                      {fmtDateLong(statement.period.startDate) ?? 'Beginning'} — {fmtDateLong(statement.period.endDate) ?? 'Today'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {statement.accounts.map(acc => (
                    <div key={acc.accountNumber} className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3.5 text-center min-w-[120px]">
                      <p className="text-green-200 text-[11px] uppercase tracking-wide mb-1">Balance</p>
                      <p className="text-xl font-bold">{fmt(Number(acc.currentBalance))}</p>
                      <p className="text-green-200 text-[11px] font-mono mt-1">{acc.accountNumber}</p>
                    </div>
                  ))}
                  {/* Export actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-3.5 flex flex-col items-center gap-1 min-w-[64px]"
                      title="Print statement"
                    >
                      <MdPrint size={20} />
                      <span className="text-xs font-medium">Print</span>
                    </button>
                    <button
                      onClick={() => exportToPDF(statement)}
                      className="bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-3.5 flex flex-col items-center gap-1 min-w-[64px]"
                      title="Export as PDF"
                    >
                      <MdDownload size={20} />
                      <span className="text-xs font-medium">PDF</span>
                    </button>
                    <button
                      onClick={() => exportToExcel(statement)}
                      className="bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-3.5 flex flex-col items-center gap-1 min-w-[64px]"
                      title="Export as Excel"
                    >
                      <MdTableView size={20} />
                      <span className="text-xs font-medium">Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                  <MdTrendingUp size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Total Deposits</p>
                  <p className="text-[20px] font-bold text-green-700 mt-0.5">{fmt(statement.summary.totalDeposits)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0">
                  <MdTrendingDown size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Total Withdrawals</p>
                  <p className="text-[20px] font-bold text-red-600 mt-0.5">{fmt(statement.summary.totalWithdrawals)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <MdSwapHoriz size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Total Entries</p>
                  <p className="text-[20px] font-bold text-blue-700 mt-0.5">{statement.summary.totalTransactions}</p>
                  {(statement.summary as any).totalLoanRepayments > 0 && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Incl. {fmt((statement.summary as any).totalLoanRepayments)} repayments</p>
                  )}
                </div>
              </div>
            </div>

            {/* Transactions table */}
            {statement.transactions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-14 text-center text-slate-400 text-sm">
                No transactions found for the selected period.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Transaction History</p>
                  <p className="text-[11px] text-slate-400">{statement.transactions.length} entries</p>
                </div>
                <div className="overflow-auto max-h-[520px]">
                  <table className="w-full text-[13px] min-w-[640px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-slate-100">
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Date</th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Account No.</th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Narration</th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Debit</th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Credit</th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {statement.transactions.map((txn, i) => (
                        <tr
                          key={txn.id}
                          className="hover:bg-slate-50/80 transition-colors animate-slide-up"
                          style={{ animationDelay: `${i * 20}ms` }}
                        >
                          <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">{fmtDate(txn.date)}</td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">{txn.accountNumber}</td>
                          <td className="px-5 py-3.5 text-slate-700">{txn.narration}</td>
                          <td className="px-5 py-3.5 text-right">
                            {txn.type === 'withdrawal'
                              ? <span className="text-red-600 font-semibold">{fmt(Number(txn.amount))}</span>
                              : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {txn.type === 'deposit'
                              ? <span className="text-green-700 font-semibold">{fmt(Number(txn.amount))}</span>
                              : txn.type === 'loan_repayment'
                              ? <span className="text-blue-600 font-semibold">{fmt(Number(txn.amount))}</span>
                              : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                            {txn.balanceAfter != null ? fmt(Number(txn.balanceAfter)) : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
