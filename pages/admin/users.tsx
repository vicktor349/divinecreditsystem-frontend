import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import {
  MdAdd, MdEdit, MdLock, MdPerson, MdShield,
  MdCheckCircle, MdBlock, MdSearch, MdRefresh, MdLogout,
} from 'react-icons/md';
import { useUser } from '@/context/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import { adminService, AdminUser } from '@/services/admin.service';

// ── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtLastSeen = (d: string | null | undefined) => {
  if (!d) return 'Never';
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return fmtDate(d);
};

const ROLES = ['staff', 'admin'];

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'admin' ? 'bg-violet-100 text-violet-700' :
                       'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {role === 'admin' && <MdShield size={11} />}
      {role}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────

interface ModalProps { onClose: () => void; onDone: () => void; }

function CreateUserModal({ onClose, onDone }: ModalProps) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('All fields are required.'); return;
    }
    setLoading(true); setError('');
    try {
      await adminService.createUser(form);
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to create user');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Create New User</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add a staff or admin account</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
            <input
              value={form.name} onChange={set('name')} placeholder="e.g. Jane Doe"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
            <input
              type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <input
              type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
            <select
              value={form.role} onChange={set('role')}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            >
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors">
              {loading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onDone }: ModalProps & { user: AdminUser }) {
  const [form, setForm] = useState({ name: user.name ?? '', role: user.role });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await adminService.updateUser(user.id, form);
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to update user');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit User</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
            <input
              value={form.name} onChange={set('name')}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
            <select
              value={form.role} onChange={set('role')}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            >
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors">
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onDone }: ModalProps & { user: AdminUser }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await adminService.resetPassword(user.id, password);
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to reset password');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Reset Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm Password</label>
            <input
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ToggleActiveModal({
  user, onClose, onDone,
}: ModalProps & { user: AdminUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setLoading(true); setError('');
    try {
      if (user.isActive) await adminService.deactivateUser(user.id);
      else await adminService.activateUser(user.id);
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Action failed');
    } finally { setLoading(false); }
  };

  const action = user.isActive ? 'Deactivate' : 'Activate';
  const color = user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{action} User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <p className="text-sm text-slate-600">
            Are you sure you want to <strong>{action.toLowerCase()}</strong> the account for{' '}
            <strong>{user.name ?? user.email}</strong>?
            {user.isActive && ' They will no longer be able to log in.'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={confirm} disabled={loading}
              className={`flex-1 py-2.5 ${color} disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors`}>
              {loading ? `${action}ing…` : action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KickModal({ user, onClose, onDone }: ModalProps & { user: AdminUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setLoading(true); setError('');
    try {
      await adminService.kickUser(user.id);
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Action failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Kick User Session</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <p className="text-sm text-slate-600">
            This will immediately invalidate <strong>{user.name ?? user.email}</strong>&apos;s active session.
            They will be logged out and must sign in again to continue.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={confirm} disabled={loading}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors">
              {loading ? 'Kicking…' : 'Kick Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'create' }
  | { type: 'edit'; user: AdminUser }
  | { type: 'reset'; user: AdminUser }
  | { type: 'toggle'; user: AdminUser }
  | { type: 'kick'; user: AdminUser }
  | null;

export default function AdminUsers() {
  const { isLoading: authLoading, isAuthenticated, user: me } = useUser();
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [search, setSearch] = useState('');

  const { data: users, isLoading, mutate } = useSWR<AdminUser[]>(
    isAuthenticated && me?.role === 'admin' ? 'admin-users' : null,
    () => adminService.listUsers(),
  );

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) { router.push('/'); return null; }
  if (me?.role !== 'admin') return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <MdShield size={30} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">
          You need the <strong>admin</strong> role to access this page.
          Log out and log back in after your role has been updated.
        </p>
        <p className="text-xs text-slate-400 mt-2 bg-slate-100 px-3 py-1 rounded-full">
          Your current role: <strong>{me?.role ?? 'unknown'}</strong>
        </p>
      </div>
    </DashboardLayout>
  );

  const filtered = (users ?? []).filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()),
  );

  const closeAndRefresh = () => { setModal(null); mutate(); };

  return (
    <DashboardLayout>
      <Head><title>User Management | Divine Credit System</title></Head>

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-3 py-1 text-xs font-semibold mb-2">
              <MdShield size={13} />
              Superadmin
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage staff accounts, roles and access</p>
          </div>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors flex-shrink-0"
          >
            <MdAdd size={18} />
            New User
          </button>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="flex-1 relative">
              <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email or role…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-slate-700"
              />
            </div>
            <button
              onClick={() => mutate()}
              title="Refresh"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <MdRefresh size={17} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading users…</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-5">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <MdPerson size={26} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">{search ? 'No users match your search' : 'No users yet'}</p>
              <p className="text-xs text-slate-400 mt-1">{search ? 'Try a different keyword' : 'Create the first user to get started'}</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Last Seen</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Joined</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {(u.name ?? u.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{u.name ?? '—'}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                        {/* mobile role + status */}
                        <div className="flex items-center gap-2 mt-1.5 sm:hidden">
                          <RoleBadge role={u.role} />
                          <StatusBadge isActive={u.isActive} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <StatusBadge isActive={u.isActive} />
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell text-xs">
                        <span className={`font-medium ${u.lastLoginAt ? 'text-slate-600' : 'text-slate-400'}`}>
                          {fmtLastSeen(u.lastLoginAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden xl:table-cell text-slate-500 text-xs">
                        {fmtDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => setModal({ type: 'edit', user: u })}
                            title="Edit name / role"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <MdEdit size={16} />
                          </button>
                          {/* Reset password */}
                          <button
                            onClick={() => setModal({ type: 'reset', user: u })}
                            title="Reset password"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          >
                            <MdLock size={16} />
                          </button>
                          {/* Toggle active */}
                          <button
                            onClick={() => setModal({ type: 'toggle', user: u })}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                              u.isActive
                                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {u.isActive ? <MdBlock size={16} /> : <MdCheckCircle size={16} />}
                          </button>
                          {/* Kick session */}
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => setModal({ type: 'kick', user: u })}
                              title="Kick out of session"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
                            >
                              <MdLogout size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!isLoading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of{' '}
                <span className="font-semibold text-slate-600">{users?.length ?? 0}</span> users
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'create' && (
        <CreateUserModal onClose={() => setModal(null)} onDone={closeAndRefresh} />
      )}
      {modal?.type === 'edit' && (
        <EditUserModal user={modal.user} onClose={() => setModal(null)} onDone={closeAndRefresh} />
      )}
      {modal?.type === 'reset' && (
        <ResetPasswordModal user={modal.user} onClose={() => setModal(null)} onDone={closeAndRefresh} />
      )}
      {modal?.type === 'toggle' && (
        <ToggleActiveModal user={modal.user} onClose={() => setModal(null)} onDone={closeAndRefresh} />
      )}
      {modal?.type === 'kick' && (
        <KickModal user={modal.user} onClose={() => setModal(null)} onDone={closeAndRefresh} />
      )}
    </DashboardLayout>
  );
}
