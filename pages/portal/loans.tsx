import React from 'react';
import Head from 'next/head';
import RoleGate from '@/components/RoleGate';
import PortalLayout from '@/components/PortalLayout';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import { useMyLoans } from '@/hooks/useMe';
import { MdAccountBalance, MdAccessTime } from 'react-icons/md';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function LoansContent() {
  const { loans, isLoading } = useMyLoans();

  return (
    <PortalLayout>
      <Head><title>Divine Credit System | My Loans</title></Head>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Loans</h1>
          <p className="text-sm text-slate-500 mt-1">All loan accounts associated with you</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : loans.filter(l => l.status !== 'notActive').length === 0 ? (
            <EmptyState icon={<MdAccountBalance />} title="No loans yet" description="You don't have any loan accounts yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {loans.filter(l => l.status !== 'notActive').map(l => (
                <div key={l.id} className="p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Badge variant={l.status as any} />
                      <span className="font-mono text-sm text-slate-500">{l.accountNumber}</span>
                    </div>
                    <Badge variant={l.loanType as any} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Principal</p>
                      <p className="text-[13px] font-bold text-slate-900">{fmt(Number(l.principalAmount))}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Outstanding</p>
                      <p className="text-[13px] font-bold text-amber-600">{fmt(Number(l.outstandingBalance))}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Interest Rate</p>
                      <p className="text-[13px] font-bold text-slate-900">{l.interestRate}% {l.paymentFrequency === 'weekly' ? 'p.w.' : 'p.m.'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Next Payment</p>
                      <p className="text-[13px] font-bold text-slate-900">{l.nextPaymentAmount ? fmt(Number(l.nextPaymentAmount)) : '—'}</p>
                    </div>
                  </div>
                  {l.nextPaymentDate && (l.status === 'active' || l.status === 'defaulted') && (
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mt-3">
                      <MdAccessTime size={13} /> Next payment due {fmtDate(l.nextPaymentDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}

export default function PortalLoansPage() {
  return (
    <RoleGate allow={['customer']}>
      <LoansContent />
    </RoleGate>
  );
}
