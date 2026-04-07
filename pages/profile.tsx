import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import { MdPerson, MdEmail, MdBadge, MdLogout, MdShield } from 'react-icons/md';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, logout } = useUser();
  const router = useRouter();

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated && !isLoading) { router.push('/'); return null; }

  const fields = [
    { icon: <MdPerson size={17} />, label: 'Full Name', value: user?.name ?? '—' },
    { icon: <MdEmail size={17} />, label: 'Email Address', value: user?.email ?? '—' },
    { icon: <MdBadge size={17} />, label: 'Role', value: user?.role ?? 'Staff' },
  ];

  return (
    <DashboardLayout>
      <Head><title>Divine Credit System | Profile</title></Head>

      <div className="max-w-lg mx-auto space-y-5 bg-[#f8fafc] min-h-full px-1 py-1">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-green-600/25">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <h1 className="text-[20px] font-bold text-slate-900">{user?.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-green-100 text-green-700 ring-1 ring-green-200">
            <MdShield size={13} />
            {user?.role ?? 'Staff'}
          </span>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-slide-up" style={{ animationDelay: '80ms' }}>
          {fields.map((f, i) => (
            <div
              key={f.label}
              className={`flex items-center gap-4 px-5 py-4 ${i < fields.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{f.label}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{f.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <div className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 py-3 rounded-2xl text-sm font-semibold hover:bg-red-50 active:scale-95 transition-all"
          >
            <MdLogout size={17} /> Sign Out
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
