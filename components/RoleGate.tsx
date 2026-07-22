import React, { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import { MdCancel } from 'react-icons/md';

interface RoleGateProps {
  allow: string[];
  redirectTo?: string;
  children: ReactNode;
}

// Shared guard for role-restricted areas (e.g. /admin/*, /portal/*).
// Unauthenticated users are sent to the login page; authenticated users
// with the wrong role see an Access Denied message rather than a silent redirect,
// matching the existing pattern used on admin pages.
export default function RoleGate({ allow, redirectTo = '/', children }: RoleGateProps) {
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const router = useRouter();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace(redirectTo);
    return null;
  }

  if (!user || !allow.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#f8fafc]">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <MdCancel size={32} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          You don&apos;t have access to this page. Your current role is <strong>{user?.role}</strong>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
