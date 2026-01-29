import React from 'react';

type Variant = 'active' | 'notActive' | 'repaid' | 'defaulted' | 'deposit' | 'withdrawal' | 'flat' | 'reducing' | 'pending';

const variantMap: Record<Variant, string> = {
  active:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  notActive:  'bg-slate-100  text-slate-500   ring-1 ring-slate-200',
  repaid:     'bg-blue-50    text-blue-700    ring-1 ring-blue-200',
  defaulted:  'bg-red-50     text-red-700     ring-1 ring-red-200',
  deposit:    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  withdrawal: 'bg-red-50     text-red-600     ring-1 ring-red-200',
  flat:       'bg-violet-50  text-violet-700  ring-1 ring-violet-200',
  reducing:   'bg-amber-50   text-amber-700   ring-1 ring-amber-200',
  pending:    'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
};

const labelMap: Record<Variant, string> = {
  active:     'Active',
  notActive:  'Not Active',
  repaid:     'Repaid',
  defaulted:  'Defaulted',
  deposit:    'Deposit',
  withdrawal: 'Withdrawal',
  flat:       'Flat',
  reducing:   'Reducing',
  pending:    'Pending Approval',
};

const dotMap: Record<Variant, string> = {
  active:     'bg-emerald-500',
  notActive:  'bg-slate-400',
  repaid:     'bg-blue-500',
  defaulted:  'bg-red-500',
  deposit:    'bg-emerald-500',
  withdrawal: 'bg-red-500',
  flat:       'bg-violet-500',
  reducing:   'bg-amber-500',
  pending:    'bg-amber-500',
};

export default function Badge({ variant }: { variant: Variant }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${variantMap[variant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotMap[variant]}`} />
      {labelMap[variant]}
    </span>
  );
}
