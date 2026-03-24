import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { useAllLoans } from '@/hooks/useLoans';
import { MdAccountBalance, MdArrowForward } from 'react-icons/md';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Repaid', value: 'repaid' },
  { label: 'Defaulted', value: 'defaulted' },
  { label: 'Not Active', value: 'notActive' },
] as const;

export default function LoansPage() {
  const { isLoading: authLoading, isAuthenticated } = useUser();
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { loans, count, totalPages, isLoading } = useAllLoans(activeStatus, page);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  if (!isAuthenticated && !authLoading) { router.push('/'); return null; }

  function handleTabChange(status: string | undefined) {
    setActiveStatus(status);
    setPage(1);
  }

  return (
    <DashboardLayout>
      <Head><title>Divine Credit System | Loans</title></Head>

      <div className="max-w-6xl mx-auto space-y-6 bg-[#f8fafc] min-h-full px-1 py-1">
        <PageHeader
          title="Loans"
          subtitle={`${count} loan${count !== 1 ? 's' : ''} ${activeStatus ? `(${activeStatus})` : 'total'}`}
        />

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm animate-fade-in overflow-x-auto w-full sm:w-fit max-w-full">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.label}
              onClick={() => handleTabChange(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                activeStatus === tab.value
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-10" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <EmptyState
              icon={<MdAccountBalance />}
              title="No loans found"
              description={
                activeStatus
                  ? `No ${activeStatus} loans at the moment.`
                  : 'Issue a loan to a customer to see it here.'
              }
              action={
                !activeStatus ? (
                  <Link href="/customers" className="text-sm text-green-600 hover:underline font-medium">
                    Go to Customers
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-slide-up shadow-sm">
            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-[13px] min-w-[700px]">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Customer</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Loan Account</th>
                    <th className="px-5 py-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Principal</th>
                    <th className="px-5 py-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Outstanding</th>
                    <th className="px-5 py-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Next Payment</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Next Date</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Status</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Start Date</th>
                    <th className="px-5 py-4 bg-slate-50/70" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loans.map((loan, i) => (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer animate-slide-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={() => router.push(`/loans/${loan.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm shadow-green-600/25">
                            {loan.customer?.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{loan.customer?.name}</p>
                            <p className="text-[11px] text-slate-400">{loan.customer?.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">{loan.accountNumber}</td>
                      <td className="px-5 py-3.5 text-right text-slate-500">{fmt(Number(loan.principalAmount))}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-amber-700">{fmt(Number(loan.outstandingBalance))}</td>
                      <td className="px-5 py-3.5 text-right text-slate-500">
                        {loan.nextPaymentAmount ? fmt(loan.nextPaymentAmount) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{fmtDate(loan.nextPaymentDate)}</td>
                      <td className="px-5 py-3.5"><Badge variant={loan.status as any} /></td>
                      <td className="px-5 py-3.5 text-slate-500">{fmtDate(loan.startDate)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/loans/${loan.id}`}
                          onClick={e => e.stopPropagation()}
                          className="text-green-600 hover:text-green-700 font-medium text-[11px] flex items-center gap-0.5 justify-end transition-colors"
                        >
                          Details <MdArrowForward size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
