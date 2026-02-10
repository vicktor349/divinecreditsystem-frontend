import SideNavbar from "./SideNavbar";
import NotificationBell from "./NotificationBell";
import React, { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <SideNavbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop header bar with notification bell */}
        <header className="hidden lg:flex items-center justify-end px-6 py-3 bg-white border-b border-slate-100">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="lg:hidden h-14" />
          <div className="p-5 sm:p-6 lg:p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
