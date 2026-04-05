import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useUser } from '@/context/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import { useActiveLoans, useLoanStats } from '@/hooks/useLoans';
import { useCustomers } from '@/hooks/useCustomers';
import { adminService } from '@/services/admin.service';
import {
  MdAccountBalance, MdPeople, MdTrendingUp,
  MdWarning, MdArrowForward, MdAdd, MdOpenInNew,
  MdCheckCircle, MdSchedule, MdNotificationsActive,
} from 'react-icons/md';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function AlertsWidget() {
  const { data, isLoading } = useSWR('dashboard-alerts', () => adminService.getDashboardAlerts(), {
    revalidateOnFocus: false,
    refreshInterval: 60000,
  });

  const alerts = data as any;
  const items = [
    {
      label: 'Overdue Loans',
      count: alerts?.overdueLoans?.count ?? 0,
      href: '/admin/collections',
      color: 'red',
      icon: MdWarning,
    },
    {
      label: 'Pending Approvals',
      count: alerts?.pendingApprovals?.count ?? 0,
      href: '/admin/loans',
      color: 'amber',
      icon: MdSchedule,
    },
    {
      label: 'Maturing in 30 Days',
      count: alerts?.nearMaturity?.count ?? 0,
      href: '/admin/collections',
      color: 'blue',
      icon: MdNotificationsActive,
    },
  ];

  const hasAlerts = items.some(i => i.count > 0);

  if (isLoading) return null; // silent — don't show skeleton for this
  if (!hasAlerts) return null; // no alerts, nothing to show

  return (
    <div className="animate-slide-up" style={{ animationDelay: '140ms' }}>
      <div className="flex items-center gap-2 mb-3">
        <MdWarning size={16} className="text-amber-500" />
        <h2 className="text-[13px] font-bold text-slate-700">Alerts</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.filter(a => a.count > 0).map(alert => {
          const colorMap: Record<string, string> = {
            red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
            amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
            blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
          };
          const Icon = alert.icon;
          return (
            <Link
              key={alert.label}
              href={alert.href}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-colors ${colorMap[alert.color]}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={18} />
                <span className="text-[13px] font-semibold">{alert.label}</span>
              </div>
              <span className="text-xl font-bold">{alert.count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isLoading: authLoading, isAuthenticated, user } = useUser();
  const router = useRouter();
  const { loans, isLoading: loansLoading } = useActiveLoans();
  const { stats, isLoading: statsLoading } = useLoanStats();
  const { count: customerCount, isLoading: customersLoading } = useCustomers();

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
  if (!isAuthenticated && !authLoading) { router.replace('/'); return null; }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <DashboardLayout>
      <Head><title>Divine Credit System | Dashboard</title></Head>

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Greeting bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <p className="text-xs text-slate-400 font-medium">{today}</p>
            <h1 className="text-[22px] font-bold text-slate-900 mt-0.5">
              {greeting}, {user?.name?.split(' ')[0] ?? 'there'} 👋
            </h1>
          </div>
          <Link
            href="/customers"
            className="self-start sm:self-auto inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-600/25"
          >
            <MdAdd size={17} /> New Customer
          </Link>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Active Loans"
            value={statsLoading ? '—' : (stats?.activeLoanCount ?? 0)}
            icon={<MdAccountBalance />} color="green" delay={0}
          />
          <StatCard
            title="Total Customers"
            value={customersLoading ? '—' : customerCount}
            icon={<MdPeople />} color="blue" delay={60}
          />
          <StatCard
            title="Total Loaned"
            value={statsLoading ? '—' : fmt(stats?.totalPrincipalLoaned ?? 0)}
            icon={<MdTrendingUp />} color="purple" delay={120}
          />
          <StatCard
            title="Outstanding"
            value={statsLoading ? '—' : fmt(stats?.totalOutstandingBalance ?? 0)}
            sub={statsLoading ? '' : `Interest: ${fmt(stats?.totalInterestToCollect ?? 0)}`}
            icon={<MdWarning />} color="amber" delay={180}
          />
        </div>

        {/* ── Alerts widget (admin only) ── */}
        {user?.role === 'admin' && <AlertsWidget />}

        {/* ── Active loans table ── */}
        <div className="animate-slide-up" style={{ animationDelay: '220ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Active Loans</h2>
              <p className="text-xs text-slate-400 mt-0.5">Currently running loan accounts</p>
            </div>
            <Link
              href="/loans"
              className="inline-flex items-center gap-1 text-[13px] text-green-600 hover:text-green-700 font-semibold transition-colors"
            >
              View all <MdArrowForward size={15} />
            </Link>
          </div>

          {loansLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <EmptyState
                icon={<MdAccountBalance />}
                title="No active loans"
                description="Issue a loan to a customer to see it here."
                action={
                  <Link href="/customers" className="text-sm text-green-600 hover:text-green-700 font-semibold transition-colors">
                    Go to Customers →
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-auto max-h-[420px]">
                <table className="w-full text-sm min-w-[680px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Customer</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Account</th>
                      <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Principal</th>
                      <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Outstanding</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Next Payment</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Type</th>
                      <th className="px-5 py-3.5 bg-slate-50/70" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loans.slice(0, 8).map((loan, i) => (
                      <tr
                        key={loan.id}
                        onClick={() => router.push(`/loans/${loan.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer animate-slide-up"
                        style={{ animationDelay: `${i * 35}ms` }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm shadow-green-600/25">
                              {loan.customer?.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-[13px] leading-tight">{loan.customer?.name}</p>
                              <p className="text-[11px] text-slate-400">{loan.customer?.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">{loan.accountNumber}</td>
                        <td className="px-5 py-3.5 text-right text-[13px] font-medium text-slate-700">{fmt(Number(loan.principalAmount))}</td>
                        <td className="px-5 py-3.5 text-right text-[13px] font-bold text-amber-600">{fmt(Number(loan.outstandingBalance))}</td>
                        <td className="px-5 py-3.5 text-[13px] text-slate-500">{fmtDate(loan.nextPaymentDate)}</td>
                        <td className="px-5 py-3.5"><Badge variant={loan.loanType} /></td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="inline-flex items-center gap-0.5 text-[12px] text-green-600 font-semibold hover:text-green-700">
                            View <MdOpenInNew size={12} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
