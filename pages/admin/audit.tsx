import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import {
  MdShield, MdSearch, MdRefresh, MdFilterList,
  MdExpandMore, MdExpandLess, MdPrint, MdPictureAsPdf, MdTableChart,
} from 'react-icons/md';
import { useUser } from '@/context/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import { adminService, AuditLog } from '@/services/admin.service';

// ── Action badge config ───────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  USER_LOGIN:              { label: 'Login',             color: 'bg-green-100 text-green-700' },
  CUSTOMER_CREATED:        { label: 'Customer Created',  color: 'bg-blue-100 text-blue-700' },
  CUSTOMER_UPDATED:        { label: 'Customer Updated',  color: 'bg-sky-100 text-sky-700' },
  DEPOSIT_MADE:            { label: 'Deposit',           color: 'bg-emerald-100 text-emerald-700' },
  WITHDRAWAL_MADE:         { label: 'Withdrawal',        color: 'bg-red-100 text-red-700' },
  LOAN_ISSUED:             { label: 'Loan Issued',       color: 'bg-violet-100 text-violet-700' },
  LOAN_REPAYMENT:          { label: 'Repayment',         color: 'bg-teal-100 text-teal-700' },
  LOAN_REPAY_FROM_BALANCE: { label: 'Repay (Balance)',   color: 'bg-cyan-100 text-cyan-700' },
  LOAN_MARKED_DEFAULTED:   { label: 'Defaulted',         color: 'bg-orange-100 text-orange-700' },
  AUTO_REPAYMENT:          { label: 'Auto Repayment',    color: 'bg-indigo-100 text-indigo-700' },
  USER_CREATED:            { label: 'User Created',      color: 'bg-purple-100 text-purple-700' },
  USER_UPDATED:            { label: 'User Updated',      color: 'bg-slate-100 text-slate-600' },
  USER_ACTIVATED:          { label: 'User Activated',    color: 'bg-green-100 text-green-700' },
  USER_DEACTIVATED:        { label: 'User Deactivated',  color: 'bg-red-100 text-red-700' },
  PASSWORD_RESET:          { label: 'Password Reset',    color: 'bg-amber-100 text-amber-700' },
};

const ALL_ACTIONS = Object.keys(ACTION_CONFIG);

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function DetailsCell({ details }: { details: string | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!details) return <span className="text-slate-300">—</span>;
  let parsed: any;
  try { parsed = JSON.parse(details); } catch { return <span className="text-xs text-slate-500 font-mono">{details}</span>; }
  const keys = Object.keys(parsed);
  if (keys.length === 0) return <span className="text-slate-300">—</span>;
  return (
    <div>
      <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors">
        {expanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
        {expanded ? 'Hide' : `${keys.length} field${keys.length > 1 ? 's' : ''}`}
      </button>
      {expanded && (
        <div className="mt-1.5 bg-slate-50 rounded-lg px-2.5 py-2 text-xs font-mono text-slate-600 space-y-0.5 max-w-[260px]">
          {keys.map(k => (
            <div key={k} className="flex gap-1.5 flex-wrap">
              <span className="text-slate-400">{k}:</span>
              <span className="text-slate-700 break-all">{String(parsed[k])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

const reportDate = () =>
  new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' });

function parseDetails(details: string | null): string {
  if (!details) return '—';
  try {
    const obj = JSON.parse(details);
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ');
  } catch { return details; }
}

// ── Export helpers ────────────────────────────────────────────────────────────

async function exportAuditToPDF(
  logs: AuditLog[],
  filters: { search?: string; action?: string; startDate?: string; endDate?: string },
) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new (jsPDF as any)({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ── Header ──
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, 297, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Divine Credit System', 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Audit Trail Report', 14, 19);
  doc.text(`Generated: ${reportDate()}  |  Records: ${logs.length}`, 14, 25);

  // Filter info
  const filterParts: string[] = [];
  if (filters.search)    filterParts.push(`Search: "${filters.search}"`);
  if (filters.action)    filterParts.push(`Action: ${filters.action}`);
  if (filters.startDate) filterParts.push(`From: ${filters.startDate}`);
  if (filters.endDate)   filterParts.push(`To: ${filters.endDate}`);
  if (filterParts.length > 0) {
    doc.text(`Filters: ${filterParts.join('  •  ')}`, 14, 31);
  }

  autoTable(doc, {
    startY: filterParts.length > 0 ? 36 : 32,
    head: [['Date & Time', 'User', 'Action', 'Entity', 'ID', 'Details']],
    body: logs.map(l => [
      fmtDate(l.createdAt),
      l.userName ? `${l.userName}\n${l.userEmail ?? ''}` : (l.userEmail ?? 'System'),
      ACTION_CONFIG[l.action]?.label ?? l.action,
      l.entity,
      l.entityId ?? '—',
      parseDetails(l.details),
    ]),
    theme: 'grid' as const,
    headStyles: { fillColor: [22, 101, 52] as [number, number, number], textColor: 255, fontStyle: 'bold' as const, fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] as [number, number, number], cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 38 },
      2: { cellWidth: 32 },
      3: { cellWidth: 24 },
      4: { cellWidth: 16 },
      5: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Divine Credit System  •  Audit Trail  •  Page ${i} of ${pageCount}`,
      148, 205, { align: 'center' },
    );
  }

  doc.save(`audit-trail-${new Date().toISOString().split('T')[0]}.pdf`);
}

async function exportAuditToExcel(
  logs: AuditLog[],
  filters: { search?: string; action?: string; startDate?: string; endDate?: string },
) {
  const xlsx = await import('xlsx');
  const wb = xlsx.utils.book_new();

  const filterParts: string[] = [];
  if (filters.search)    filterParts.push(`Search: "${filters.search}"`);
  if (filters.action)    filterParts.push(`Action: ${filters.action}`);
  if (filters.startDate) filterParts.push(`From: ${filters.startDate}`);
  if (filters.endDate)   filterParts.push(`To: ${filters.endDate}`);

  const rows = [
    ['Divine Credit System — Audit Trail'],
    [`Generated: ${reportDate()}  |  Records: ${logs.length}`],
    filterParts.length > 0 ? [`Filters: ${filterParts.join('  •  ')}`] : [],
    [],
    ['Date & Time', 'User Name', 'User Email', 'Action', 'Entity', 'Entity ID', 'Details'],
    ...logs.map(l => [
      fmtDate(l.createdAt),
      l.userName ?? 'System',
      l.userEmail ?? '',
      ACTION_CONFIG[l.action]?.label ?? l.action,
      l.entity,
      l.entityId ?? '',
      parseDetails(l.details),
    ]),
  ];

  const ws = xlsx.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 22 }, { wch: 20 }, { wch: 28 }, { wch: 22 },
    { wch: 16 }, { wch: 10 }, { wch: 50 },
  ];
  xlsx.utils.book_append_sheet(wb, ws, 'Audit Trail');
  xlsx.writeFile(wb, `audit-trail-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AuditTrail() {
  const { isLoading: authLoading, isAuthenticated, user } = useUser();
  const router = useRouter();

  const [search, setSearch]       = useState('');
  const [action, setAction]       = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [page, setPage]           = useState(1);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const LIMIT = 50;

  const swrKey = isAuthenticated && user?.role === 'admin'
    ? ['admin-audit', page, search, action, startDate, endDate]
    : null;

  const { data, isLoading, mutate } = useSWR(
    swrKey,
    () => adminService.getAuditLogs({
      page, limit: LIMIT,
      search: search || undefined, action: action || undefined,
      startDate: startDate || undefined, endDate: endDate || undefined,
    }),
    { keepPreviousData: true },
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

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;
  const filters = { search: search || undefined, action: action || undefined, startDate: startDate || undefined, endDate: endDate || undefined };

  const applyFilters = () => { setPage(1); mutate(); };
  const clearFilters = () => { setSearch(''); setAction(''); setStartDate(''); setEndDate(''); setPage(1); };

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      // Fetch ALL matching records for export (up to 10,000)
      const all = await adminService.getAuditLogs({ ...filters, page: 1, limit: 10000 });
      await exportAuditToPDF(all.data, filters);
    } finally { setExporting(null); }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const all = await adminService.getAuditLogs({ ...filters, page: 1, limit: 10000 });
      await exportAuditToExcel(all.data, filters);
    } finally { setExporting(null); }
  };

  return (
    <DashboardLayout>
      <Head><title>Audit Trail | Divine Credit System</title></Head>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-3 py-1 text-xs font-semibold mb-2">
              <MdShield size={13} />
              Admin
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Audit Trail</h1>
            <p className="text-slate-500 text-sm mt-1">Every action across the platform, nothing hidden</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <MdPrint size={16} />
              Print
            </button>
            <button onClick={handleExportPDF} disabled={exporting === 'pdf'}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 bg-red-50 rounded-xl text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
              <MdPictureAsPdf size={16} />
              {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
            </button>
            <button onClick={handleExportExcel} disabled={exporting === 'excel'}
              className="flex items-center gap-1.5 px-3 py-2 border border-green-200 bg-green-50 rounded-xl text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors">
              <MdTableChart size={16} />
              {exporting === 'excel' ? 'Exporting…' : 'Excel'}
            </button>
            <button onClick={() => mutate()}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <MdRefresh size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <MdFilterList size={14} />
            Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()}
                placeholder="Search user, entity…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-slate-700"
              />
            </div>
            <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
              className="py-2 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-slate-700">
              <option value="">All Actions</option>
              {ALL_ACTIONS.map(a => <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>)}
            </select>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="py-2 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-slate-600" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="py-2 px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-slate-600" />
          </div>
          <div className="flex gap-2">
            <button onClick={applyFilters} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors">Apply</button>
            <button onClick={clearFilters} className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">Clear</button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading audit logs…</p>
              </div>
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-5">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <MdShield size={26} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No audit logs found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[160px]">When</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Who</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Entity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((log: AuditLog) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        {log.userName || log.userEmail ? (
                          <div>
                            <p className="font-medium text-slate-800 text-xs truncate max-w-[160px]">{log.userName ?? '—'}</p>
                            <p className="text-slate-400 text-xs truncate max-w-[160px]">{log.userEmail ?? ''}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><ActionBadge action={log.action} /></td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div>
                          <span className="text-xs font-medium text-slate-600">{log.entity}</span>
                          {log.entityId && <span className="text-xs text-slate-400 ml-1">#{log.entityId}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell"><DetailsCell details={log.details} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.total)}</span> of{' '}
                <span className="font-semibold text-slate-600">{data.total}</span> events
                {data.total > LIMIT && <span className="text-violet-500 ml-1">(PDF/Excel exports all {data.total})</span>}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Previous
                </button>
                <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
