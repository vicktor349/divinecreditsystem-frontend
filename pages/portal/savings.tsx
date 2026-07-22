import React from 'react';
import Head from 'next/head';
import RoleGate from '@/components/RoleGate';
import PortalLayout from '@/components/PortalLayout';
import EmptyState from '@/components/EmptyState';
import { useMyDeposits, useMySavings } from '@/hooks/useMe';
import { MdAccountBalance, MdSavings, MdLock } from 'react-icons/md';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function SavingsContent() {
  const { deposits, isLoading: depositsLoading } = useMyDeposits();
  const { accounts: savingsAccounts, isLoading: savingsLoading } = useMySavings();

  return (
    <PortalLayout>
      <Head><title>Divine Credit System | My Deposits & Savings</title></Head>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Deposits &amp; Savings</h1>
          <p className="text-sm text-slate-500 mt-1">Your deposit account and savings accounts</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <MdAccountBalance size={16} className="text-green-600" />
            <p className="text-[13px] font-bold text-slate-900">Deposit Account</p>
          </div>
          {depositsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deposits.length === 0 ? (
            <EmptyState icon={<MdAccountBalance />} title="No deposit account found" />
          ) : (
            <div className="divide-y divide-slate-100">
              {deposits.map(d => (
                <div key={d.id} className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-sm text-slate-500">{d.accountNumber}</span>
                    <span className="text-xl font-bold text-slate-900">{fmt(Number(d.balance))}</span>
                  </div>
                  {d.transactions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Recent Transactions</p>
                      {d.transactions.slice(0, 5).map(t => (
                        <div key={t.id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-slate-700">{t.narration}</p>
                            <p className="text-[11px] text-slate-400">{fmtDate(t.createdAt)}</p>
                          </div>
                          <span className={`font-semibold ${t.type === 'deposit' ? 'text-green-700' : 'text-red-600'}`}>
                            {t.type === 'deposit' ? '+' : '-'}{fmt(Number(t.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <MdSavings size={16} className="text-purple-600" />
            <p className="text-[13px] font-bold text-slate-900">Savings Accounts</p>
          </div>
          {savingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : savingsAccounts.length === 0 ? (
            <EmptyState icon={<MdSavings />} title="No savings accounts yet" description="Ask your account officer to set up a savings account for you." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
              {savingsAccounts.map(s => {
                const target = s.targetAmount ? Number(s.targetAmount) : null;
                const progressPct = target ? Math.min(100, (Number(s.balance) / target) * 100) : null;
                return (
                  <div key={s.id} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-slate-700">{s.savingsProduct.name}</span>
                      {s.savingsProduct.targetLocked && <MdLock size={13} className="text-amber-500" />}
                    </div>
                    <p className="text-[20px] font-bold text-slate-900">{fmt(Number(s.balance))}</p>
                    <p className="font-mono text-[11px] text-slate-400 mt-0.5">{s.accountNumber}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{s.savingsProduct.interestRate}% interest, {s.savingsProduct.interestFrequency}</p>
                    {target != null && progressPct != null && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Target: {fmt(target)}{s.targetDate ? ` by ${fmtDate(s.targetDate)}` : ''}</span>
                          <span>{progressPct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}

export default function PortalSavingsPage() {
  return (
    <RoleGate allow={['customer']}>
      <SavingsContent />
    </RoleGate>
  );
}
