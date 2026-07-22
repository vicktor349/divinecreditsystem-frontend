import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import RoleGate from '@/components/RoleGate';
import PortalLayout from '@/components/PortalLayout';
import Badge from '@/components/Badge';
import { useUser } from '@/context/UserContext';
import { useMyDeposits, useMyLoans, useMySavings } from '@/hooks/useMe';
import { MdAccountBalance, MdSavings, MdArrowForward } from 'react-icons/md';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

function DashboardContent() {
  const { user } = useUser();
  const { deposits, isLoading: depositsLoading } = useMyDeposits();
  const { loans, isLoading: loansLoading } = useMyLoans();
  const { accounts: savingsAccounts, isLoading: savingsLoading } = useMySavings();

  const totalDepositBalance = deposits.reduce((sum, d) => sum + Number(d.balance), 0);
  const totalSavingsBalance = savingsAccounts.reduce((sum, s) => sum + Number(s.balance), 0);
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'defaulted');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + Number(l.outstandingBalance), 0);

  return (
    <PortalLayout>
      <Head><title>Divine Credit System | My Dashboard</title></Head>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Here&apos;s an overview of your accounts</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-green-950 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-green-300 text-[11px] uppercase tracking-wider font-semibold mb-2">Deposit Balance</p>
            {depositsLoading ? <div className="skeleton h-8 w-32 rounded bg-white/10" /> : (
              <p className="text-2xl font-bold tracking-tight">{fmt(totalDepositBalance)}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2">Savings Balance</p>
            {savingsLoading ? <div className="skeleton h-8 w-32 rounded" /> : (
              <p className="text-2xl font-bold text-slate-900">{fmt(totalSavingsBalance)}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2">Outstanding Loan Balance</p>
            {loansLoading ? <div className="skeleton h-8 w-32 rounded" /> : (
              <p className={`text-2xl font-bold ${totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{fmt(totalOutstanding)}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MdAccountBalance size={16} className="text-green-600" />
                <p className="text-[13px] font-bold text-slate-900">My Loans</p>
              </div>
              <Link href="/portal/loans" className="text-[12px] text-green-600 font-semibold flex items-center gap-0.5 hover:text-green-700">
                View all <MdArrowForward size={12} />
              </Link>
            </div>
            {loans.length === 0 ? (
              <p className="text-sm text-slate-400">No loans on record.</p>
            ) : (
              <div className="space-y-2">
                {loans.slice(0, 3).map(l => (
                  <div key={l.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-[12px] text-slate-500">{l.accountNumber}</span>
                    <Badge variant={l.status as any} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MdSavings size={16} className="text-purple-600" />
                <p className="text-[13px] font-bold text-slate-900">My Savings</p>
              </div>
              <Link href="/portal/savings" className="text-[12px] text-green-600 font-semibold flex items-center gap-0.5 hover:text-green-700">
                View all <MdArrowForward size={12} />
              </Link>
            </div>
            {savingsAccounts.length === 0 ? (
              <p className="text-sm text-slate-400">No savings accounts yet.</p>
            ) : (
              <div className="space-y-2">
                {savingsAccounts.slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-[12px] text-slate-600">{s.savingsProduct.name}</span>
                    <span className="text-[13px] font-semibold text-slate-900">{fmt(Number(s.balance))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

export default function PortalDashboardPage() {
  return (
    <RoleGate allow={['customer']}>
      <DashboardContent />
    </RoleGate>
  );
}
