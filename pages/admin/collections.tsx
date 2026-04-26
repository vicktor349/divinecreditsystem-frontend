import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import DashboardLayout from '@/components/DashboardLayout';
import EmptyState from '@/components/EmptyState';
import { useUser } from '@/context/UserContext';
import { adminService } from '@/services/admin.service';
import { MdWarning, MdAccessTime, MdCalendarToday, MdTrendingUp, MdArrowForward, MdRefresh } from 'react-icons/md';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function CollectionCard({ label, count, total, color, icon }: { label: string; count: number; total: number; color: string; icon: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      </div>
      <p className="text-2xl font-bold">{fmt(total)}</p>
      <p className="text-[12px] mt-1 opacity-70">{count} loan{count !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function CollectionsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overdue' | '30' | '60' | '90'>('overdue');

  const { data, isLoading, mutate } = useSWR(
    isAuthenticated && user?.role === 'admin' ? 'projected-collections' : null,
    () => adminService.getProjectedCollections(),
    { revalidateOnFocus: false }
  );

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated && !authLoading) { router.push('/'); return null; }

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <MdWarning size={32} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-500 text-sm">Admin access required. Your role: <strong>{user?.role}</strong></p>
        </div>
      </DashboardLayout>
    );
  }

  const collections = data as any;

  const tabs = [
    { key: 'overdue', label: 'Overdue', count: collections?.overdue?.count ?? 0, color: 'text-red-600', bg: 'bg-red-600' },
    { key: '30', label: 'Next 30 Days', count: collections?.next30Days?.count ?? 0, color: 'text-amber-600', bg: 'bg-amber-500' },
    { key: '60', label: 'Next 60 Days', count: collections?.next60Days?.count ?? 0, color: 'text-blue-600', bg: 'bg-blue-500' },
    { key: '90', label: 'Next 90 Days', count: collections?.next90Days?.count ?? 0, color: 'text-slate-600', bg: 'bg-slate-500' },
  ] as const;

  const activeLoans = activeTab === 'overdue' ? collections?.overdue?.loans
    : activeTab === '30' ? collections?.next30Days?.loans
    : activeTab === '60' ? collections?.next60Days?.loans
    : collections?.next90Days?.loans;

  return (
    <DashboardLayout>
      <Head><title>Divine Credit System | Projected Collections</title></Head>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Projected Collections</h1>
            <p className="text-sm text-slate-500 mt-1">Expected loan repayments for upcoming periods</p>
          </div>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
          >
            <MdRefresh size={15} /> Refresh
          </button>
        </div>

        {/* Summary cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <CollectionCard label="Overdue" count={collections?.overdue?.count ?? 0} total={collections?.overdue?.totalExpected ?? 0} color="red" icon={<MdWarning />} />
            <CollectionCard label="Due in 30 Days" count={collections?.next30Days?.count ?? 0} total={collections?.next30Days?.totalExpected ?? 0} color="amber" icon={<MdAccessTime />} />
            <CollectionCard label="Due in 60 Days" count={collections?.next60Days?.count ?? 0} total={collections?.next60Days?.totalExpected ?? 0} color="blue" icon={<MdCalendarToday />} />
            <CollectionCard label="Due in 90 Days" count={collections?.next90Days?.count ?? 0} total={collections?.next90Days?.totalExpected ?? 0} color="slate" icon={<MdTrendingUp />} />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? `border-current ${tab.color} bg-slate-50/60`
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`${tab.bg} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : !activeLoans || activeLoans.length === 0 ? (
            <EmptyState
              icon={<MdCalendarToday />}
              title="No loans in this period"
              description="No upcoming payments found for the selected time range."
            />
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-[13px] min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Customer</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Loan Account</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Next Payment</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Outstanding</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Due Date</th>
                    <th className="px-5 py-3.5 bg-slate-50/70" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeLoans.map((loan: any, i: number) => {
                    const isOverdue = activeTab === 'overdue';
                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {loan.customer?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{loan.customer?.name}</p>
                              <p className="text-[11px] text-slate-400">{loan.customer?.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">{loan.accountNumber}</td>
                        <td className={`px-5 py-3.5 text-right font-bold ${isOverdue ? 'text-red-600' : 'text-green-700'}`}>
                          {fmt(Number(loan.nextPaymentAmount ?? 0))}
                        </td>
                        <td className="px-5 py-3.5 text-right text-amber-600 font-semibold">
                          {fmt(Number(loan.outstandingBalance))}
                        </td>
                        <td className={`px-5 py-3.5 text-sm ${isOverdue ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                          {fmtDate(loan.nextPaymentDate)}
                          {isOverdue && <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">OVERDUE</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/loans/${loan.id}`} className="inline-flex items-center gap-0.5 text-[12px] text-green-600 hover:text-green-700 font-semibold">
                            View <MdArrowForward size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
