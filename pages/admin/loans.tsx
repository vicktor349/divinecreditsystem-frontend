import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import DashboardLayout from '@/components/DashboardLayout';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { useUser } from '@/context/UserContext';
import { loanService } from '@/services/loan.service';
import { useToast } from '@/context/ToastContext';
import {
  MdCheckCircle,
  MdCancel,
  MdAccountBalance,
  MdPerson,
  MdAccessTime,
} from 'react-icons/md';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminLoansPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useUser();
  const router = useRouter();
  const { showToast } = useToast();

  const [rejectModal, setRejectModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);

  const { data, isLoading, mutate } = useSWR(
    isAuthenticated && user?.role === 'admin' ? 'pending-loans' : null,
    () => loanService.getPendingLoans()
  );

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated && !authLoading) { router.push('/'); return null; }

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

  const loans = (data as any)?.loans ?? [];

  async function handleApprove(loanId: number) {
    setProcessing(loanId);
    try {
      await loanService.approveLoan(loanId);
      showToast('Loan approved successfully', 'success');
      mutate();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Failed to approve loan', 'error');
    } finally {
      setProcessing(null);
    }
  }

  function openRejectModal(loanId: number) {
    setSelectedLoanId(loanId);
    setRejectReason('');
    setRejectModal(true);
  }

  async function handleReject() {
    if (!selectedLoanId) return;
    setProcessing(selectedLoanId);
    try {
      await loanService.rejectLoan(selectedLoanId, rejectReason || 'Loan rejected by admin');
      showToast('Loan rejected', 'success');
      setRejectModal(false);
      mutate();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Failed to reject loan', 'error');
    } finally {
      setProcessing(null);
    }
  }

  return (
    <DashboardLayout>
      <Head><title>Divine Credit System | Pending Loans</title></Head>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pending Loan Approvals</h1>
            <p className="text-sm text-slate-500 mt-1">Review and approve or reject submitted loans</p>
          </div>
          {loans.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-xl">
              {loans.length} pending
            </span>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : loans.length === 0 ? (
            <EmptyState
              icon={<MdAccountBalance />}
              title="No pending loans"
              description="All loan applications have been reviewed. New submissions will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {loans.map((loan: any, i: number) => (
                <div key={loan.id} className="p-5 hover:bg-slate-50/50 transition-colors animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Left: Loan info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="pending" />
                        <span className="font-mono text-sm text-slate-500">{loan.accountNumber}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {loan.customer?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-slate-900">{loan.customer?.name}</p>
                          <p className="text-[12px] text-slate-400">{loan.customer?.phone}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Principal</p>
                          <p className="text-[13px] font-bold text-slate-900">{fmt(Number(loan.principalAmount))}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Interest</p>
                          <p className="text-[13px] font-bold text-slate-900">{loan.interestRate}%</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Tenure</p>
                          <p className="text-[13px] font-bold text-slate-900">{loan.tenureMonths} months</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Type</p>
                          <p className="text-[13px] font-bold text-slate-900 capitalize">{loan.loanType}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[12px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MdPerson size={13} /> Submitted by {loan.createdBy?.name ?? loan.createdBy?.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <MdAccessTime size={13} /> {fmtDate(loan.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex sm:flex-col gap-2 sm:min-w-[140px]">
                      <button
                        onClick={() => handleApprove(loan.id)}
                        disabled={processing === loan.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-green-600/25"
                      >
                        <MdCheckCircle size={16} />
                        {processing === loan.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => openRejectModal(loan.id)}
                        disabled={processing === loan.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-50 active:scale-95 transition-all"
                      >
                        <MdCancel size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Reject Loan Application" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Please provide a reason for rejecting this loan application. This will be recorded for the audit trail.</p>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Insufficient income documentation"
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 focus:bg-white transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={processing !== null}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 active:scale-95 transition-all"
            >
              {processing !== null ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => setRejectModal(false)}
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
