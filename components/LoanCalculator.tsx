import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { MdCalculate } from 'react-icons/md';
import { formatNumberInput, parseFormattedNumber } from '@/lib/numberInput';

type LoanKind = 'flat' | 'reducing' | 'bullet';
type Frequency = 'weekly' | 'monthly';

interface ScheduleRow {
  period: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
}

interface CalculatorValues {
  principalAmount: string;
  interestRate: string;
  tenureMonths: string;
  loanType: LoanKind;
  paymentFrequency: Frequency;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultPrincipal?: string;
  defaultRate?: string;
  defaultTenure?: string;
  defaultType?: LoanKind;
  onUseValues?: (values: CalculatorValues) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

// Mirrors the backend's LoanService math exactly (rate is PER PERIOD):
//  - reducing: equal principal installments, interest on outstanding balance
//  - flat/straight-line: same total interest as reducing, equal payments
//  - bullet: interest-only each period, principal + interest in the final period
function calculate(principal: number, rate: number, tenure: number, type: LoanKind) {
  if (!principal || !rate || !tenure) return null;

  const schedule: ScheduleRow[] = [];
  let totalInterest = 0;

  const periodPrincipal = principal / tenure;

  // Reducing total (also used by flat/straight-line)
  let reducingTotal = 0;
  {
    let balance = principal;
    for (let i = 0; i < tenure; i++) {
      reducingTotal += (rate / 100) * balance;
      balance -= periodPrincipal;
    }
  }

  if (type === 'flat') {
    totalInterest = reducingTotal;
    const periodInterest = totalInterest / tenure;
    const payment = periodPrincipal + periodInterest;
    let balance = principal;
    for (let i = 1; i <= tenure; i++) {
      balance -= periodPrincipal;
      schedule.push({
        period: i,
        principal: periodPrincipal,
        interest: periodInterest,
        payment,
        balance: Math.max(0, balance),
      });
    }
  } else if (type === 'reducing') {
    let balance = principal;
    for (let i = 1; i <= tenure; i++) {
      const interest = (rate / 100) * balance;
      totalInterest += interest;
      balance -= periodPrincipal;
      schedule.push({
        period: i,
        principal: periodPrincipal,
        interest,
        payment: periodPrincipal + interest,
        balance: Math.max(0, balance),
      });
    }
  } else {
    // bullet
    const periodInterest = (rate / 100) * principal;
    totalInterest = periodInterest * tenure;
    for (let i = 1; i <= tenure; i++) {
      const isFinal = i === tenure;
      schedule.push({
        period: i,
        principal: isFinal ? principal : 0,
        interest: periodInterest,
        payment: isFinal ? principal + periodInterest : periodInterest,
        balance: isFinal ? 0 : principal,
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
    loanType: defaultType as LoanKind,
    paymentFrequency: 'monthly' as Frequency,
  });

  const principal = parseFormattedNumber(form.principalAmount);
  const rate = parseFormattedNumber(form.interestRate);
  const tenure = Number(form.tenureMonths);
  const result = calculate(principal, rate, tenure, form.loanType);

  const periodNoun = form.paymentFrequency === 'weekly' ? 'week' : 'month';

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
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Interest Rate (% per {periodNoun})</label>
            <input
              type="text" inputMode="decimal" placeholder="e.g. 5"
              value={form.interestRate}
              onChange={e => setForm(f => ({ ...f, interestRate: formatNumberInput(e.target.value) }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Tenure ({periodNoun}s)</label>
            <input
              type="number" min="1" max="360" placeholder="e.g. 12"
              value={form.tenureMonths}
              onChange={e => setForm(f => ({ ...f, tenureMonths: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Frequency</label>
            <select
              value={form.paymentFrequency}
              onChange={e => setForm(f => ({ ...f, paymentFrequency: e.target.value as Frequency }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Loan Type</label>
            <select
              value={form.loanType}
              onChange={e => setForm(f => ({ ...f, loanType: e.target.value as LoanKind }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            >
              <option value="flat">Flat / Straight Line (equal payments)</option>
              <option value="reducing">Reducing Balance (declining payments)</option>
              <option value="bullet">Bullet (interest only, principal at end)</option>
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
                <span className="text-[11px] text-slate-400">{tenure} {periodNoun}s</span>
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
                      <tr key={row.period} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2 text-slate-400 font-mono">{row.period}</td>
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
