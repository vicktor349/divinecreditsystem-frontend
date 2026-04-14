import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  MdPeople, MdAccountBalance, MdTrendingUp, MdWarning,
  MdCheckCircle, MdAttachMoney, MdShield, MdBarChart,
  MdPrint, MdPictureAsPdf, MdTableChart,
} from 'react-icons/md';
import { useUser } from '@/context/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { adminService, AdminStats } from '@/services/admin.service';

// ── Formatters ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtK = (n: number) => {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};

// Avoids ₦ → ¦ in jsPDF Helvetica
const fmtPDF = (n: number) =>
  'NGN ' + new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(n);

const LOAN_STATUS_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#d97706'];

const CurrencyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{fmt(p.value)}</p>
      ))}
    </div>
  );
};

const CountTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.value} customers</p>
      ))}
    </div>
  );
};

// ── Export helpers ────────────────────────────────────────────────────────────

const reportDate = () =>
  new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' });

async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

async function exportToPDF(stats: AdminStats) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new (jsPDF as any)({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const f = stats.financial;

  // ── Header bar ──
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, 210, 32, 'F');

  const logo = await loadImageAsBase64('/images/logo.png');
  if (logo) doc.addImage(logo, 'PNG', 14, 8, 14, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Divine Credit System', 32, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Analytics Report', 32, 22);
  doc.text(`Generated: ${reportDate()}`, 32, 28);

  let y = 42;

  const section = (title: string) => {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, y);
    y += 2;
  };

  const tableOpts = (head: string[][], body: (string | number)[][], startY: number) => ({
    startY,
    head,
    body,
    theme: 'grid' as const,
    headStyles: { fillColor: [22, 101, 52] as [number, number, number], textColor: 255, fontStyle: 'bold' as const, fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] as [number, number, number] },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    margin: { left: 14, right: 14 },
  });

  // ── Financial Summary ──
  section('Financial Summary');
  autoTable(doc, tableOpts(
    [['Metric', 'Amount']],
    [
      ['Total Principal Disbursed', fmtPDF(f.totalPrincipalDisbursed)],
      ['Total Repayments Collected', fmtPDF(f.totalRepayments)],
      ['Outstanding Balance', fmtPDF(f.totalOutstanding)],
      ['Deposits Held', fmtPDF(f.totalDepositsHeld)],
      ['Profit (from repaid loans)', fmtPDF(f.profitFromRepaid)],
    ],
    y,
  ));
  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Users & Customers ──
  section('Users & Customers');
  autoTable(doc, tableOpts(
    [['Category', 'Total', 'Active / Owing', 'Inactive / Defaulted']],
    [
      ['System Users', stats.users.total, stats.users.active, stats.users.inactive],
      ['Customers', stats.customers.total, stats.customers.owing, stats.customers.defaulted],
    ],
    y,
  ));
  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Loan Status ──
  section('Loan Status Breakdown');
  autoTable(doc, tableOpts(
    [['Status', 'Count', 'Outstanding (NGN)']],
    stats.loans.byStatus.map(s => [
      s.status.charAt(0).toUpperCase() + s.status.slice(1),
      s.count,
      fmtPDF(Number(s.outstanding)),
    ]),
    y,
  ));
  y = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (y > 230) { doc.addPage(); y = 20; }

  // ── Monthly Repayments ──
  section('Monthly Repayments (Last 6 Months)');
  autoTable(doc, tableOpts(
    [['Month', 'Amount Collected (NGN)']],
    stats.charts.monthlyRepayments.map(r => [r.month, fmtPDF(r.amount)]),
    y,
  ));
  y = (doc as any).lastAutoTable.finalY + 10;

  if (y > 230) { doc.addPage(); y = 20; }

  // ── Monthly New Customers ──
  section('Monthly New Customers (Last 6 Months)');
  autoTable(doc, tableOpts(
    [['Month', 'New Customers']],
    stats.charts.monthlyNewCustomers.map(r => [r.month, r.count]),
    y,
  ));

  // ── Footer ──
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Divine Credit System  •  Analytics Report  •  Page ${i} of ${pageCount}`,
      105, 290, { align: 'center' },
    );
  }

  doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

async function exportToExcel(stats: AdminStats) {
  const xlsx = await import('xlsx');
  const wb = xlsx.utils.book_new();
  const f = stats.financial;

  // Sheet 1: Overview
  const overview = [
    ['Divine Credit System — Analytics Report'],
    [`Generated: ${reportDate()}`],
    [],
    ['FINANCIAL SUMMARY', ''],
    ['Total Principal Disbursed', f.totalPrincipalDisbursed],
    ['Total Repayments Collected', f.totalRepayments],
    ['Outstanding Balance', f.totalOutstanding],
    ['Deposits Held', f.totalDepositsHeld],
    ['Profit (from repaid loans)', f.profitFromRepaid],
    [],
    ['USERS', ''],
    ['Total Users', stats.users.total],
    ['Active Users', stats.users.active],
    ['Inactive Users', stats.users.inactive],
    [],
    ['CUSTOMERS', ''],
    ['Total Customers', stats.customers.total],
    ['Owing (active loan)', stats.customers.owing],
    ['Defaulted', stats.customers.defaulted],
    [],
    ['LOANS', ''],
    ['Active Loans', stats.loans.active],
    ['Repaid Loans', stats.loans.repaid],
    ['Defaulted Loans', stats.loans.defaulted],
  ];
  const ws1 = xlsx.utils.aoa_to_sheet(overview);
  ws1['!cols'] = [{ wch: 36 }, { wch: 20 }];
  xlsx.utils.book_append_sheet(wb, ws1, 'Overview');

  // Sheet 2: Loan Status
  const loanStatus = [
    ['Status', 'Count', 'Outstanding (NGN)'],
    ...stats.loans.byStatus.map(s => [
      s.status.charAt(0).toUpperCase() + s.status.slice(1),
      s.count,
      Number(s.outstanding),
    ]),
  ];
  const ws2 = xlsx.utils.aoa_to_sheet(loanStatus);
  ws2['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 22 }];
  xlsx.utils.book_append_sheet(wb, ws2, 'Loan Status');

  // Sheet 3: Monthly Repayments
  const repayments = [
    ['Month', 'Amount Collected (NGN)'],
    ...stats.charts.monthlyRepayments.map(r => [r.month, r.amount]),
  ];
  const ws3 = xlsx.utils.aoa_to_sheet(repayments);
  ws3['!cols'] = [{ wch: 14 }, { wch: 22 }];
  xlsx.utils.book_append_sheet(wb, ws3, 'Monthly Repayments');

  // Sheet 4: Monthly New Customers
  const customers = [
    ['Month', 'New Customers'],
    ...stats.charts.monthlyNewCustomers.map(r => [r.month, r.count]),
  ];
  const ws4 = xlsx.utils.aoa_to_sheet(customers);
  ws4['!cols'] = [{ wch: 14 }, { wch: 16 }];
  xlsx.utils.book_append_sheet(wb, ws4, 'New Customers');

  xlsx.writeFile(wb, `analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { isLoading: authLoading, isAuthenticated, user } = useUser();
  const router = useRouter();
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  const { data: stats, isLoading: statsLoading } = useSWR<AdminStats>(
    isAuthenticated && user?.role === 'admin' ? 'admin-stats' : null,
    () => adminService.getStats(),
  );

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) { router.push('/'); return null; }

  // Show access denied instead of silently redirecting
  if (user?.role !== 'admin') return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <MdShield size={30} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">
          You need the <strong>admin</strong> role to access this page.
          Log out and log back in after your role has been updated.
        </p>
        <p className="text-xs text-slate-400 mt-2 bg-slate-100 px-3 py-1 rounded-full">
          Your current role: <strong>{user?.role ?? 'unknown'}</strong>
        </p>
      </div>
    </DashboardLayout>
  );

  const f = stats?.financial;
  const isProfit = (f?.profitFromRepaid ?? 0) >= 0;

  const loanStatusData = stats?.loans.byStatus.map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase(),
    value: s.count,
  })) ?? [];

  const handleExportPDF = async () => {
    if (!stats) return;
    setExporting('pdf');
    try { await exportToPDF(stats); } finally { setExporting(null); }
  };

  const handleExportExcel = async () => {
    if (!stats) return;
    setExporting('excel');
    try { await exportToExcel(stats); } finally { setExporting(null); }
  };

  return (
    <DashboardLayout>
      <Head><title>Admin Dashboard | Divine Credit System</title></Head>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-3 py-1 text-xs font-semibold mb-2">
              <MdShield size={13} />
              Admin
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Platform Overview</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time analytics across all users and customers</p>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <MdPrint size={16} />
              Print
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!stats || exporting === 'pdf'}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 bg-red-50 rounded-xl text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <MdPictureAsPdf size={16} />
              {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={!stats || exporting === 'excel'}
              className="flex items-center gap-1.5 px-3 py-2 border border-green-200 bg-green-50 rounded-xl text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              <MdTableChart size={16} />
              {exporting === 'excel' ? 'Exporting…' : 'Excel'}
            </button>
          </div>
        </div>

        {/* ── Profit/Loss Banner ── */}
        {!statsLoading && f && (
          <div className={`rounded-2xl p-4 sm:p-5 border flex items-center gap-4 ${
            isProfit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isProfit ? 'bg-green-600' : 'bg-red-600'
            }`}>
              <MdTrendingUp size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-wider ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {isProfit ? 'Running at a Profit' : 'Running at a Loss'}
              </p>
              <p className={`text-xl sm:text-2xl font-bold mt-0.5 ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                {fmt(Math.abs(f.profitFromRepaid))}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Profit computed from fully repaid loans (repayments minus principal)</p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1 text-right flex-shrink-0">
              <p className="text-xs text-slate-500">Total Disbursed</p>
              <p className="text-sm font-bold text-slate-700">{fmt(f.totalPrincipalDisbursed)}</p>
              <p className="text-xs text-slate-500 mt-1">Total Collected</p>
              <p className="text-sm font-bold text-slate-700">{fmt(f.totalRepayments)}</p>
            </div>
          </div>
        )}

        {/* ── User Stats ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">System Users</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard title="Total Users"    value={statsLoading ? '…' : stats?.users.total ?? 0}    sub="All registered staff accounts" icon={<MdPeople />}       color="blue"   delay={0} />
            <StatCard title="Active Users"   value={statsLoading ? '…' : stats?.users.active ?? 0}   sub="Currently active accounts"     icon={<MdCheckCircle />}  color="green"  delay={50} />
            <StatCard title="Inactive Users" value={statsLoading ? '…' : stats?.users.inactive ?? 0} sub="Deactivated accounts"          icon={<MdWarning />}      color="red"    delay={100} />
          </div>
        </div>

        {/* ── Customer & Loan Stats ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Customers & Loans</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard title="Total Customers" value={statsLoading ? '…' : stats?.customers.total ?? 0}   icon={<MdPeople />}        color="blue"   delay={0} />
            <StatCard title="Owing"           value={statsLoading ? '…' : stats?.customers.owing ?? 0}   sub="Have active loans"    icon={<MdAccountBalance />} color="amber"  delay={50} />
            <StatCard title="Defaulted"       value={statsLoading ? '…' : stats?.customers.defaulted ?? 0} sub="Missed payments"   icon={<MdWarning />}       color="red"    delay={100} />
            <StatCard title="Active Loans"    value={statsLoading ? '…' : stats?.loans.active ?? 0}      icon={<MdAccountBalance />} color="green"  delay={150} />
            <StatCard title="Repaid Loans"    value={statsLoading ? '…' : stats?.loans.repaid ?? 0}      icon={<MdCheckCircle />}   color="purple" delay={200} />
          </div>
        </div>

        {/* ── Financial Stats ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Financials</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title="Principal Disbursed"  value={statsLoading ? '…' : fmtK(f?.totalPrincipalDisbursed ?? 0)} sub="All time"                  icon={<MdAttachMoney />}    color="blue"   delay={0} />
            <StatCard title="Total Repayments"     value={statsLoading ? '…' : fmtK(f?.totalRepayments ?? 0)}         sub="Collected all time"        icon={<MdTrendingUp />}     color="green"  delay={50} />
            <StatCard title="Outstanding Balance"  value={statsLoading ? '…' : fmtK(f?.totalOutstanding ?? 0)}        sub="Yet to be collected"       icon={<MdBarChart />}       color="amber"  delay={100} />
            <StatCard title="Deposits Held"        value={statsLoading ? '…' : fmtK(f?.totalDepositsHeld ?? 0)}       sub="Current deposit balances"  icon={<MdAccountBalance />} color="purple" delay={150} />
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Repayments</h3>
            <p className="text-xs text-slate-400 mb-4">Amount collected each month (last 6 months)</p>
            {statsLoading ? (
              <div className="h-[240px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats?.charts.monthlyRepayments ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₦${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip content={<CurrencyTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="amount" name="Repayments" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Loan Status Breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Distribution of loans by status</p>
            {statsLoading ? (
              <div className="h-[240px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : loanStatusData.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No loan data</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={loanStatusData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {loanStatusData.map((_, idx) => <Cell key={idx} fill={LOAN_STATUS_COLORS[idx % LOAN_STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val: any, name: any) => [`${val} loans`, name]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly New Customers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">New Customers</h3>
          <p className="text-xs text-slate-400 mb-4">Number of customers added each month (last 6 months)</p>
          {statsLoading ? (
            <div className="h-[200px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats?.charts.monthlyNewCustomers ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                <Tooltip content={<CountTooltip />} />
                <Line type="monotone" dataKey="count" name="New Customers" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Loan Status Table ── */}
        {!statsLoading && stats?.loans.byStatus && stats.loans.byStatus.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Loan Status Details</h3>
            </div>
            <div className="overflow-auto max-h-[300px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Count</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.loans.byStatus.map((row, i) => {
                    const statusColor =
                      row.status === 'active'   ? 'bg-green-100 text-green-700' :
                      row.status === 'repaid'   ? 'bg-blue-100 text-blue-700' :
                      row.status === 'defaulted'? 'bg-red-100 text-red-700' :
                                                  'bg-slate-100 text-slate-700';
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-slate-700">{row.count}</td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(Number(row.outstanding))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
