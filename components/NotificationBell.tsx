import React, { useState, useEffect, useRef } from 'react';
import { MdNotifications, MdNotificationsNone, MdDoneAll, MdClose, MdInfoOutline } from 'react-icons/md';
import { notificationService, Notification } from '@/services/notification.service';

const typeColorMap: Record<string, string> = {
  info: 'bg-blue-50 border-blue-100',
  warning: 'bg-amber-50 border-amber-100',
  success: 'bg-green-50 border-green-100',
  error: 'bg-red-50 border-red-100',
};

const typeDotMap: Record<string, string> = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await notificationService.getAll();
      setNotifications((res as any).notifications ?? []);
      setUnreadCount((res as any).unreadCount ?? 0);
    } catch {}
    setLoading(false);
  }

  async function fetchCount() {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount((res as any).count ?? 0);
    } catch {}
  }

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleMarkRead(id: number) {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
        title="Notifications"
      >
        {unreadCount > 0 ? <MdNotifications size={20} /> : <MdNotificationsNone size={20} />}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-[360px] bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-[11px] text-slate-400">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <MdDoneAll size={14} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <MdClose size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <MdNotificationsNone size={32} className="text-slate-300 mb-2" />
                <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
                <p className="text-xs text-slate-300 mt-1">Activity will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 transition-colors cursor-pointer ${n.isRead ? 'bg-white' : 'bg-blue-50/30'} hover:bg-slate-50`}
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-slate-200' : typeDotMap[n.type] ?? 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-${n.isRead ? 'normal' : 'semibold'} text-slate-${n.isRead ? '600' : '900'} leading-snug`}>
                          {n.title}
                        </p>
                        <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
