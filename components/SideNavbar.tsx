import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import {
  MdDashboard, MdPeople, MdAccountBalance,
  MdDescription, MdPerson, MdLogout,
  MdMenu, MdClose, MdChevronRight,
  MdShield, MdBarChart, MdManageAccounts,
  MdAccessTime, MdTrendingUp,
} from 'react-icons/md';
import { useUser } from '@/context/UserContext';

const links = [
  { href: '/dashboard',       label: 'Dashboard',       icon: MdDashboard,      section: 'main' },
  { href: '/customers',       label: 'Customers',       icon: MdPeople,         section: 'main' },
  { href: '/loans',           label: 'Loans',           icon: MdAccountBalance, section: 'main' },
  { href: '/statement',       label: 'Statement',       icon: MdDescription,    section: 'tools' },
  { href: '/profile',         label: 'Profile',         icon: MdPerson,         section: 'tools' },
  { href: '/admin/dashboard', label: 'Analytics',       icon: MdBarChart,       section: 'admin' },
  { href: '/admin/users',     label: 'User Management', icon: MdManageAccounts, section: 'admin' },
  { href: '/admin/audit',     label: 'Audit Trail',     icon: MdShield,         section: 'admin' },
  { href: '/admin/loans',        label: 'Pending Loans',   icon: MdAccessTime,   section: 'admin' },
  { href: '/admin/collections',  label: 'Collections',     icon: MdTrendingUp,   section: 'admin' },
];

const mainLinks  = links.filter(l => l.section === 'main');
const toolsLinks = links.filter(l => l.section === 'tools');
const adminLinks = links.filter(l => l.section === 'admin');

export default function SideNavbar() {
  const router = useRouter();
  const { user, logout } = useUser();
  const isSuperadmin = user?.role === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isSuperadmin) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/loan/pending/all`, {
      headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` }
    })
      .then(r => r.json())
      .then(d => setPendingCount(d.count ?? 0))
      .catch(() => {});
  }, [isSuperadmin]);

  const isActive = (href: string) =>
    router.asPath === href ||
    router.pathname === href ||
    (href !== '/dashboard' && router.pathname.startsWith(href));

  const NavLink = ({ href, label, icon: Icon }: typeof links[0]) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
          active
            ? 'bg-green-600 text-white shadow-sm shadow-green-600/25'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`}
      >
        <Icon
          size={18}
          className={`flex-shrink-0 transition-colors ${
            active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
          }`}
        />
        <span className="flex-1">{label}</span>
        {active && <MdChevronRight size={15} className="text-green-200 flex-shrink-0" />}
      </Link>
    );
  };

  const NavContent = () => (
    <div className="flex flex-col h-full select-none">

      {/* ── Logo ── */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="flex-shrink-0">
          <Image
            src="/images/logo.png"
            alt="Divine Credit System"
            width={40}
            height={40}
            className="object-contain rounded-lg"
          />
        </div>
        <div className="min-w-0">
          <p className="text-slate-900 text-[13px] font-bold leading-tight truncate">Divine Credit</p>
          <p className="text-slate-400 text-[11px] leading-tight mt-0.5">Management System</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-slate-100" />

      {/* ── Navigation ── */}
      <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        <div className="space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Main</p>
          {mainLinks.map(l => <NavLink key={l.href} {...l} />)}
        </div>

        <div className="space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Tools</p>
          {toolsLinks.map(l => <NavLink key={l.href} {...l} />)}
        </div>

        {isSuperadmin && (
          <div className="space-y-0.5">
            <div className="px-3 mb-2 flex items-center gap-1.5">
              <MdShield size={11} className="text-violet-500" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-500">Admin</p>
            </div>
            {adminLinks.map(l => {
              const active = router.pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/25'
                      : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'
                  }`}
                >
                  <l.icon
                    size={18}
                    className={`flex-shrink-0 transition-colors ${
                      active ? 'text-white' : 'text-violet-400 group-hover:text-violet-600'
                    }`}
                  />
                  <span className="flex-1">{l.label}</span>
                  {l.href === '/admin/loans' && pendingCount > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                  {active && <MdChevronRight size={15} className="text-violet-200 flex-shrink-0" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── User footer ── */}
      {user && (
        <div className="mx-4 mb-4 mt-2">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate capitalize">{user.role?.toLowerCase() ?? 'staff'}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
            >
              <MdLogout size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <Image src="/images/logo.png" alt="Logo" width={30} height={30} className="object-contain" />
            <span className="text-[14px] font-bold text-slate-900">Divine Credit</span>
          </div>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
          >
            {mobileOpen ? <MdClose size={20} /> : <MdMenu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar ── */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-40 w-[260px] bg-white shadow-2xl transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </div>

      {/* ── Desktop sidebar ── */}
      <nav className="hidden lg:flex flex-col w-[260px] h-screen bg-white border-r border-slate-200 flex-shrink-0 shadow-sm">
        <NavContent />
      </nav>
    </>
  );
}
