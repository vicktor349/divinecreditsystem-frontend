import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { useCustomers } from '@/hooks/useCustomers';
import { customerService } from '@/services/customer.service';
import { useToast } from '@/context/ToastContext';
import { MdPeople, MdSearch, MdAdd, MdArrowForward, MdPhone, MdPerson } from 'react-icons/md';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

export default function CustomersPage() {
  const { isLoading: authLoading, isAuthenticated } = useUser();
  const router = useRouter();

  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { customers, count, totalPages, isLoading, mutate } = useCustomers(debouncedSearch, page);

  // Simple debounce on search
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(val), 400);
  }, []);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  if (!isAuthenticated && !authLoading) { router.push('/'); return null; }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await customerService.create(form);
      setCreateOpen(false);
      setForm({ name: '', phone: '' });
      mutate();
      showToast('Customer created successfully', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg ?? err?.message ?? 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <Head><title>Divine Credit System | Customers</title></Head>

      <div className="max-w-6xl mx-auto space-y-6 bg-[#f8fafc] min-h-full px-1 py-1">
        <PageHeader
          title="Customers"
          subtitle={`${count} customer${count !== 1 ? 's' : ''} total`}
          action={
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-600/25"
            >
              <MdAdd size={18} /> New Customer
            </button>
          }
        />

        {/* Search bar */}
        <div className="relative animate-fade-in">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-10" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <EmptyState
              icon={<MdPeople />}
              title="No customers found"
              description={debouncedSearch ? 'Try a different search term.' : 'Create your first customer to get started.'}
              action={
                !debouncedSearch ? (
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="text-sm text-green-600 hover:underline font-medium"
                  >
                    Create customer
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-slide-up shadow-sm">
            <div className="overflow-auto max-h-[520px]">
              <table className="w-full text-[13px] min-w-[700px]">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Name</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Phone</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Deposit A/C</th>
                    <th className="px-5 py-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Balance</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Loan Status</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Joined</th>
                    <th className="px-5 py-4 bg-slate-50/70" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customers.map((c, i) => {
                    const deposit = c.depositAccounts[0];
                    const loan = c.loanAccounts[0];
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer animate-slide-up"
                        style={{ animationDelay: `${i * 40}ms` }}
                        onClick={() => router.push(`/customers/${c.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm shadow-green-600/25">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-900">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{c.phone}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">{deposit?.accountNumber ?? '—'}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                          {deposit ? fmt(Number(deposit.balance)) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {loan ? <Badge variant={loan.status as any} /> : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{fmtDate(c.createdAt)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/customers/${c.id}`}
                            onClick={e => e.stopPropagation()}
                            className="text-green-600 hover:text-green-700 font-medium text-[11px] flex items-center gap-0.5 justify-end transition-colors"
                          >
                            View <MdArrowForward size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Create customer modal */}
      <Modal isOpen={createOpen} onClose={() => { setCreateOpen(false); setFormError(''); setForm({ name: '', phone: '' }); }} title="New Customer">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                placeholder="e.g. Adebayo Okafor"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Phone Number</label>
            <div className="relative">
              <MdPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="tel"
                required
                placeholder="e.g. 08012345678"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>
          {formError && (
            <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{formError}</p>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all active:scale-95 shadow-sm shadow-green-600/25"
            >
              {submitting ? 'Creating...' : 'Create Customer'}
            </button>
            <button
              type="button"
              onClick={() => { setCreateOpen(false); setFormError(''); }}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
