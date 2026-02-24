import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { MdCalculate } from 'react-icons/md';
import { formatNumberInput, parseFormattedNumber } from '@/lib/numberInput';

interface ScheduleRow {
  month: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultPrincipal?: string;
  defaultRate?: string;
  defaultTenure?: string;
  defaultType?: 'flat' | 'reducing';
  onUseValues?: (values: { principalAmount: string; interestRate: string; tenureMonths: string; loanType: 'flat' | 'reducing' }) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

function calculate(principal: number, rate: number, tenure: number, type: 'flat' | 'reducing') {
  if (!principal || !rate || !tenure) return null;

  const schedule: ScheduleRow[] = [];
  let totalInterest = 0;

  if (type === 'flat') {
    const totalInt = (rate / 100) * principal * (tenure / 12);
    const totalPayable = principal + totalInt;
    const monthlyPayment = totalPayable / tenure;
    const monthlyPrincipal = principal / tenure;
    const monthlyInterest = totalInt / tenure;

    let balance = principal;
    for (let i = 1; i <= tenure; i++) {
      balance -= monthlyPrincipal;
      schedule.push({
        month: i,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        payment: monthlyPayment,
        balance: Math.max(0, balance),
      });
    }
    totalInterest = totalInt;
  } else {
    const monthlyPrincipal = principal / tenure;
    let balance = principal;
    for (let i = 1; i <= tenure; i++) {
      const interest = (rate / 100) * balance;
      const payment = monthlyPrincipal + interest;
      totalInterest += interest;
      balance -= monthlyPrincipal;
      schedule.push({
        month: i,
        principal: monthlyPrincipal,
        interest,
        payment,
        balance: Math.max(0, balance),
      });
    }
  }

  const totalPayable = principal + totalInterest;
  const firstPayment = schedule[0]?.payment ?? 0;

  return { schedule, totalInterest, totalPayable, firstPayment };
}

export default function LoanCalculator({ isOpen, onClose, defaultPrincipal = '', defaultRate = '', defaultTenure = '', defaultType = 'flat', onUseValues }: Props) {
  const [form, setForm] = useState({
    principalAmount: defaultPrincipal,
    interestRate: defaultRate,
    tenureMonths: defaultTenure,
    loanType: defaultType,
  });

  const principal = parseFormattedNumber(form.principalAmount);
  const rate = parseFormattedNumber(form.interestRate);
  const tenure = Number(form.tenureMonths);
  const result = calculate(principal, rate, tenure, form.loanType);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Loan Calculator" size="lg">
      <div className="space-y-5">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Principal Amount (₦)</label>
            <input
              type="text" inputMode="numeric" placeholder="e.g. 100,000"
              value={form.principalAmount}
              onChange={e => setForm(f => ({ ...f, principalAmount: formatNumberInput(e.target.value, false) }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Interest Rate (% p.a.)</label>
            <input
              type="text" inputMode="decimal" placeholder="e.g. 5"
              value={form.interestRate}
              onChange={e => setForm(f => ({ ...f, interestRate: formatNumberInput(e.target.value) }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Tenure (months)</label>
            <input
              type="number" min="1" max="360" placeholder="e.g. 12"
              value={form.tenureMonths}
              onChange={e => setForm(f => ({ ...f, tenureMonths: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Loan Type</label>
            <select
              value={form.loanType}
              onChange={e => setForm(f => ({ ...f, loanType: e.target.value as 'flat' | 'reducing' }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            >
              <option value="flat">Flat Rate</option>
              <option value="reducing">Reducing Balance</option>
            </select>
          </div>
        </div>

        {/* Summary pills */}
        {result && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wide mb-1">Total Payable</p>
                <p className="text-[15px] font-bold text-green-700">{fmt(result.totalPayable)}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide mb-1">Total Interest</p>
                <p className="text-[15px] font-bold text-amber-700">{fmt(result.totalInterest)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide mb-1">1st Payment</p>
                <p className="text-[15px] font-bold text-blue-700">{fmt(result.firstPayment)}</p>
              </div>
            </div>

            {/* Schedule table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[12px] font-semibold text-slate-600">Repayment Schedule Preview</p>
                <span className="text-[11px] text-slate-400">{tenure} months</span>
              </div>
              <div className="overflow-auto max-h-[260px]">
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-white border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase">#</th>
                      <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase">Principal</th>
                      <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase">Interest</th>
                      <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase">Payment</th>
                      <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {result.schedule.map(row => (
                      <tr key={row.month} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2 text-slate-400 font-mono">{row.month}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{fmt(row.principal)}</td>
                        <td className="px-4 py-2 text-right text-amber-600">{fmt(row.interest)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-green-700">{fmt(row.payment)}</td>
                        <td className="px-4 py-2 text-right text-slate-700">{fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Use values button */}
            {onUseValues && (
              <button
                onClick={() => {
                  onUseValues(form);
                  onClose();
                }}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-600/25"
              >
                Use These Values &#8594; Issue Loan
              </button>
            )}
          </>
        )}

        {!result && principal === 0 && (
          <div className="text-center py-8 text-slate-400">
            <MdCalculate size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Enter the loan details above to see the repayment schedule</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
