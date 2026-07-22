import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { useUser } from '@/context/UserContext';
import { useSavingsProducts } from '@/hooks/useSavings';
import { savingsService } from '@/services/savings.service';
import { useToast } from '@/context/ToastContext';
import { MdSavings, MdCancel, MdAdd, MdLock, MdLockOpen, MdEdit, MdDelete, MdPercent, MdPeople } from 'react-icons/md';
import type { SavingsProduct } from '@/services/savings.service';

export default function SavingsProductsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const router = useRouter();
  const { showToast } = useToast();
  const { products, isLoading, mutate } = useSavingsProducts();

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', interestRate: '', interestFrequency: 'monthly', targetLocked: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [rateModal, setRateModal] = useState(false);
  const [rateProductId, setRateProductId] = useState<number | null>(null);
  const [rateInput, setRateInput] = useState('');
  const [rateSubmitting, setRateSubmitting] = useState(false);
  const [rateError, setRateError] = useState('');

  // Edit product
  const [editModal, setEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState<SavingsProduct | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', interestFrequency: 'monthly', targetLocked: false, isActive: true });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete product
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<SavingsProduct | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated && !authLoading) { router.replace('/'); return null; }

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <MdCancel size={32} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-500 text-sm text-center max-w-sm">
            You need admin access to view this page. Your current role is <strong>{user?.role}</strong>.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const rate = parseFloat(form.interestRate);
      if (!form.name.trim()) { setError('Name is required'); return; }
      if (isNaN(rate) || rate < 0) { setError('Interest rate must be a positive number'); return; }
      await savingsService.createProduct({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        interestRate: rate,
        interestFrequency: form.interestFrequency,
        targetLocked: form.targetLocked,
      });
      showToast('Savings product created', 'success');
      setCreateModal(false);
      setForm({ name: '', description: '', interestRate: '', interestFrequency: 'monthly', targetLocked: false });
      mutate();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create savings product');
    } finally {
      setSubmitting(false);
    }
  }

  function openRateModal(productId: number, currentRate: number) {
    setRateProductId(productId);
    setRateInput(String(currentRate));
    setRateError('');
    setRateModal(true);
  }

  async function handleRateChange(e: React.FormEvent) {
    e.preventDefault();
    if (!rateProductId) return;
    setRateError('');
    setRateSubmitting(true);
    try {
      const rate = parseFloat(rateInput);
      if (isNaN(rate) || rate < 0) { setRateError('Rate must be a positive number'); return; }
      const res: any = await savingsService.requestRateChange(rateProductId, rate);
      showToast(res.approved ? 'Interest rate updated' : 'Rate change request submitted for approval', 'success');
      setRateModal(false);
      mutate();
    } catch (err: any) {
      setRateError(err?.response?.data?.message ?? 'Failed to submit rate change');
    } finally {
      setRateSubmitting(false);
    }
  }

  function openEditModal(p: SavingsProduct) {
    setEditProduct(p);
    setEditForm({
      name: p.name,
      description: p.description ?? '',
      interestFrequency: p.interestFrequency,
      targetLocked: p.targetLocked,
      isActive: p.isActive,
    });
    setEditError('');
    setEditModal(true);
  }

  async function handleEditProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editProduct) return;
    setEditError('');
    setEditSubmitting(true);
    try {
      const hasAccounts = (editProduct._count?.depositAccounts ?? 0) > 0;
      await savingsService.updateProduct(editProduct.id, {
        // Name is frozen once customers hold accounts — don't even send it then.
        ...(!hasAccounts && editForm.name.trim() !== editProduct.name ? { name: editForm.name.trim() } : {}),
        description: editForm.description.trim() || undefined,
        interestFrequency: editForm.interestFrequency,
        targetLocked: editForm.targetLocked,
        isActive: editForm.isActive,
      });
      showToast('Savings product updated', 'success');
      setEditModal(false);
      mutate();
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? 'Failed to update savings product');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteProduct() {
    if (!deleteProduct) return;
    setDeleteSubmitting(true);
    try {
      await savingsService.deleteProduct(deleteProduct.id);
      showToast(`"${deleteProduct.name}" deleted`, 'success');
      setDeleteModal(false);
      mutate();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Failed to delete savings product', 'error');
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <Head><title>Divine Credit System | Savings Products</title></Head>

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Savings Products</h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage savings products (Target Savings, Bulk Savings, Daily Contributions, etc.)</p>
          </div>
          <button
            onClick={() => { setForm({ name: '', description: '', interestRate: '', interestFrequency: 'monthly', targetLocked: false }); setError(''); setCreateModal(true); }}
            className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-600/25"
          >
            <MdAdd size={17} /> New Product
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<MdSavings />}
              title="No savings products yet"
              description="Create your first savings product to start offering Target Savings, Bulk Savings, Daily Contributions, or any other savings type."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {products.map((p, i) => (
                <div key={p.id} className="p-5 hover:bg-slate-50/50 transition-colors animate-slide-up flex items-center justify-between gap-4 flex-wrap" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white flex-shrink-0">
                      <MdSavings size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-slate-900">{p.name}</p>
                        {p.targetLocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            <MdLock size={11} /> Target-locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            <MdLockOpen size={11} /> Unlocked
                          </span>
                        )}
                        {!p.isActive && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inactive</span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          <MdPeople size={11} /> {p._count?.depositAccounts ?? 0} account{(p._count?.depositAccounts ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {p.description && <p className="text-[12px] text-slate-400 mt-0.5">{p.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-right mr-1">
                      <p className="text-[13px] font-bold text-slate-900">{p.interestRate}%</p>
                      <p className="text-[11px] text-slate-400 capitalize">{p.interestFrequency}</p>
                    </div>
                    <button
                      onClick={() => openRateModal(p.id, p.interestRate)}
                      className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 transition-all"
                    >
                      <MdPercent size={13} /> Edit Rate
                    </button>
                    <button
                      onClick={() => openEditModal(p)}
                      className="flex items-center gap-1.5 border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-50 transition-all"
                    >
                      <MdEdit size={13} /> Edit
                    </button>
                    <button
                      onClick={() => { setDeleteProduct(p); setDeleteModal(true); }}
                      disabled={(p._count?.depositAccounts ?? 0) > 0}
                      title={(p._count?.depositAccounts ?? 0) > 0 ? 'Cannot delete — customers already hold accounts on this product' : 'Delete product'}
                      className="flex items-center gap-1.5 border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <MdDelete size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create product modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="New Savings Product" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Product Name</label>
            <input
              type="text" required placeholder="e.g. Target Savings"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Description (optional)</label>
            <input
              type="text" placeholder="e.g. Locked savings toward a goal"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Interest Rate (%)</label>
              <input
                type="number" step="0.01" min="0" required placeholder="e.g. 2"
                value={form.interestRate}
                onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Frequency</label>
              <select
                value={form.interestFrequency}
                onChange={e => setForm(f => ({ ...f, interestFrequency: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.targetLocked}
              onChange={e => setForm(f => ({ ...f, targetLocked: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-[13px] text-slate-700">Lock withdrawals until target amount/date is met (Target Savings behavior)</span>
          </label>
          {error && <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all"
            >
              {submitting ? 'Creating...' : 'Create Product'}
            </button>
            <button type="button" onClick={() => setCreateModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit rate modal */}
      <Modal isOpen={rateModal} onClose={() => setRateModal(false)} title="Edit Interest Rate" size="sm">
        <form onSubmit={handleRateChange} className="space-y-4">
          <p className="text-sm text-slate-600">
            As an admin, this change applies immediately. Non-admin staff changes go through admin approval instead.
          </p>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">New Interest Rate (%)</label>
            <input
              type="number" step="0.01" min="0" required
              value={rateInput}
              onChange={e => setRateInput(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          {rateError && <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{rateError}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={rateSubmitting}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all"
            >
              {rateSubmitting ? 'Saving...' : 'Save Rate'}
            </button>
            <button type="button" onClick={() => setRateModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit product modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Savings Product" size="sm">
        <form onSubmit={handleEditProduct} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Product Name
              {(editProduct?._count?.depositAccounts ?? 0) > 0 && (
                <span className="text-[11px] text-amber-600 ml-2">
                  Locked — {editProduct?._count?.depositAccounts} customer account{(editProduct?._count?.depositAccounts ?? 0) !== 1 ? 's' : ''} use this product
                </span>
              )}
            </label>
            <input
              type="text" required
              value={editForm.name}
              disabled={(editProduct?._count?.depositAccounts ?? 0) > 0}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Description (optional)</label>
            <input
              type="text"
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Interest Frequency</label>
            <select
              value={editForm.interestFrequency}
              onChange={e => setEditForm(f => ({ ...f, interestFrequency: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.targetLocked}
              onChange={e => setEditForm(f => ({ ...f, targetLocked: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[13px] text-slate-700">Lock withdrawals until target amount/date is met</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.isActive}
              onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[13px] text-slate-700">Active (inactive products can&apos;t be assigned to new customers)</span>
          </label>
          {editError && <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{editError}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={editSubmitting}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all"
            >
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setEditModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete product confirmation modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Savings Product" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700 font-semibold mb-1">Delete &quot;{deleteProduct?.name}&quot;?</p>
            <p className="text-sm text-red-600">
              This permanently removes the product. It has no customer accounts, so no balances are affected.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDeleteProduct}
              disabled={deleteSubmitting}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 active:scale-95 transition-all"
            >
              {deleteSubmitting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setDeleteModal(false)}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
