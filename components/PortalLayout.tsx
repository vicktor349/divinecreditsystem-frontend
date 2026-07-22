import React, { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import { MdDashboard, MdAccountBalance, MdSavings, MdLogout } from 'react-icons/md';

const links = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: MdDashboard },
  { href: '/portal/loans', label: 'My Loans', icon: MdAccountBalance },
  { href: '/portal/savings', label: 'My Deposits & Savings', icon: MdSavings },
];

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useUser();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/images/logo.png" alt="Divine Credit System" width={32} height={32} className="object-contain rounded-lg" />
            <span className="text-[14px] font-bold text-slate-900 hidden sm:inline">Divine Credit</span>
          </div>
          <nav className="flex items-center gap-1">
            {links.map(l => {
              const active = router.pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                    active ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <l.icon size={16} />
                  <span className="hidden sm:inline">{l.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-slate-600 hidden sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              title="Sign out"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <MdLogout size={17} />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
