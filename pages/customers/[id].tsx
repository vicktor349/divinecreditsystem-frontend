import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { useCustomer } from '@/hooks/useCustomers';
import { loanService } from '@/services/loan.service';
import { depositService } from '@/services/deposit.service';
import { customerService, CreditScore, CustomerNote } from '@/services/customer.service';
import { useToast } from '@/context/ToastContext';
import {
  MdArrowBack,
  MdAccountBalance,
  MdTrendingUp,
  MdTrendingDown,
  MdAdd,
  MdReceipt,
  MdEdit,
  MdPerson,
  MdPhone,
  MdArrowForward,
  MdCheckCircle,
  MdDelete,
  MdNote,
  MdSend,
  MdStar,
  MdClose,
  MdAccessTime,
  MdCalculate,
} from 'react-icons/md';
import { formatNumberInput, parseFormattedNumber } from '@/lib/numberInput';
import LoanCalculator from '@/components/LoanCalculator';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const fmtDateShort = (d: string) =>
  new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CreditScoreGauge({ score, grade }: { score: number; grade: string }) {
  const percentage = ((score - 300) / (850 - 300)) * 100;
  const color = score >= 750 ? '#10b981' : score >= 650 ? '#3b82f6' : score >= 550 ? '#f59e0b' : score >= 450 ? '#f97316' : '#ef4444';

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${percentage} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <p className="text-[18px] font-bold text-slate-900 leading-none">{score}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5">/ 850</p>
        </div>
      </div>
      <div>
        <p className="text-[15px] font-bold" style={{ color }}>{grade}</p>
        <p className="text-[12px] text-slate-500 mt-0.5">Credit Score</p>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { isLoading: authLoading, isAuthenticated, user } = useUser();
  const router = useRouter();
  const id = router.query.id ? Number(router.query.id) : null;
  const { customer, isLoading, isError, mutate } = useCustomer(id);

  const { showToast } = useToast();

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const [txModal, setTxModal] = useState(false);
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [txForm, setTxForm] = useState({ amount: '', narration: '' });
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');

  const [loanModal, setLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({ principalAmount: '', interestRate: '', tenureMonths: '', loanType: 'flat' as 'flat' | 'reducing' });
  const [loanSubmitting, setLoanSubmitting] = useState(false);
  const [loanError, setLoanError] = useState('');

  // Archive
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiveSubmitting, setArchiveSubmitting] = useState(false);

  // Calculator
  const [calcModal, setCalcModal] = useState(false);

  // Notes
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Credit score
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [creditScoreLoading, setCreditScoreLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setNotesLoading(true);
    customerService.getNotes(id)
      .then((res: any) => setNotes(res.notes ?? []))
      .catch(() => {})
      .finally(() => setNotesLoading(false));

    setCreditScoreLoading(true);
    customerService.getCreditScore(id)
      .then((res: any) => setCreditScore(res))
      .catch(() => {})
      .finally(() => setCreditScoreLoading(false));
  }, [id]);

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated && !authLoading) { router.push('/'); return null; }

  const deposit = customer?.depositAccounts[0];

  function openEditModal() {
    if (!customer) return;
    setEditForm({ name: customer.name, phone: customer.phone });
    setEditError('');
    setEditModal(true);
  }

  async function handleEditCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setEditError('');
    setEditSubmitting(true);
    try {
      await customerService.update(customer.id, editForm);
      mutate();
      setEditModal(false);
      showToast('Customer updated successfully', 'success');
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? 'Failed to update customer');
    } finally {
      setEditSubmitting(false);
    }
  }

  function openTx(type: 'deposit' | 'withdrawal') {
    setTxType(type);
    setTxError('');
    setTxSuccess('');
    setTxForm({ amount: '', narration: '' });
    setTxModal(true);
  }

  async function handleTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!deposit) return;
    setTxError('');
    setTxSuccess('');
    setTxSubmitting(true);
    try {
      const res: any = await depositService.transact({
        accountId: deposit.id,
        type: txType,
        amount: parseFormattedNumber(txForm.amount),
        narration: txForm.narration,
      });
      const msg = res.message ?? 'Transaction successful';
      setTxSuccess(msg);
      mutate();
      showToast(msg, 'success');
      setTimeout(() => setTxModal(false), 1200);
    } catch (err: any) {
      setTxError(err?.response?.data?.message ?? 'Transaction failed');
    } finally {
      setTxSubmitting(false);
    }
  }

  async function handleIssueLoan(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setLoanError('');
    setLoanSubmitting(true);
    try {
      await loanService.issueLoan({
        customerId: customer.id,
        principalAmount: parseFormattedNumber(loanForm.principalAmount),
        interestRate: parseFormattedNumber(loanForm.interestRate),
        tenureMonths: Number(loanForm.tenureMonths),
        loanType: loanForm.loanType,
      });
      setLoanModal(false);
      mutate();
      showToast(
        user?.role === 'admin' ? 'Loan issued successfully' : 'Loan submitted for approval',
        'success',
      );
    } catch (err: any) {
      setLoanError(err?.response?.data?.message ?? 'Failed to issue loan');
    } finally {
      setLoanSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!customer) return;
    setArchiveSubmitting(true);
    try {
      await customerService.archive(customer.id);
      showToast('Customer archived successfully', 'success');
      router.push('/customers');
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Failed to archive customer', 'error');
    } finally {
      setArchiveSubmitting(false);
      setArchiveModal(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !newNote.trim()) return;
    setNoteSubmitting(true);
    try {
      const res: any = await customerService.addNote(id, newNote.trim());
      setNotes(prev => [res.note, ...prev]);
      setNewNote('');
      showToast('Note added', 'success');
    } catch {
      showToast('Failed to add note', 'error');
    } finally {
      setNoteSubmitting(false);
    }
  }

  async function handleDeleteNote(noteId: number) {
    try {
      await customerService.deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      showToast('Note deleted', 'success');
    } catch {
      showToast('Failed to delete note', 'error');
    }
  }

  return (
    <DashboardLayout>
      <Head><title>Divine Credit System | Customer Detail</title></Head>

      <div className="max-w-5xl mx-auto space-y-6 bg-[#f8fafc] min-h-full px-1 py-1">
        {/* Back */}
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors animate-fade-in">
          <MdArrowBack size={16} /> Back to Customers
        </Link>

        {isLoading && (
          <div className="space-y-4 animate-fade-in">
            <div className="skeleton h-28 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="skeleton h-40 rounded-2xl" />
              <div className="skeleton h-40 rounded-2xl" />
            </div>
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm animate-fade-in">
            Customer not found or an error occurred.
          </div>
        )}

        {customer && !isLoading && (
          <>
            {/* Customer header card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-md shadow-green-600/25">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-[20px] font-bold text-slate-900">{customer.name}</h1>
                  <p className="text-sm text-slate-500 mt-0.5">{customer.phone}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Customer since {fmtDateShort(customer.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <MdEdit size={15} /> Edit
                </button>
                <button
                  onClick={() => openTx('deposit')}
                  className="flex items-center gap-1.5 bg-green-600 text-white px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-600/25"
                >
                  <MdTrendingUp size={15} /> Deposit
                </button>
                <button
                  onClick={() => openTx('withdrawal')}
                  className="flex items-center gap-1.5 border border-red-200 text-red-600 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-red-50 active:scale-95 transition-all"
                >
                  <MdTrendingDown size={15} /> Withdraw
                </button>
                <Link
                  href={`/statement?accountNumber=${deposit?.accountNumber ?? ''}`}
                  className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                >
                  <MdReceipt size={15} /> Statement
                </Link>
                <button
                  onClick={() => setCalcModal(true)}
                  className="flex items-center gap-1.5 border border-violet-200 text-violet-600 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-violet-50 active:scale-95 transition-all"
                >
                  <MdCalculate size={15} /> Calculator
                </button>
                <button
                  onClick={() => setArchiveModal(true)}
                  className="flex items-center gap-1.5 border border-red-200 text-red-500 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-red-50 active:scale-95 transition-all"
                >
                  <MdDelete size={15} /> Delete
                </button>
              </div>
            </div>

            {/* Accounts row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '80ms' }}>
              {/* Deposit account */}
              <div className="bg-gradient-to-br from-slate-900 to-green-950 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-green-300 text-[11px] uppercase tracking-wider font-semibold">Deposit Account</p>
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <MdAccountBalance size={18} className="text-green-300" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight">{deposit ? fmt(Number(deposit.balance)) : '₦0'}</p>
                <p className="text-green-300 text-xs mt-2.5 font-mono tracking-widest">{deposit?.accountNumber ?? '—'}</p>
              </div>

              {/* Loan accounts */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Loan Accounts</p>
                  <span className="text-[11px] text-slate-400">{customer.loanAccounts.length} account{customer.loanAccounts.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-3 max-h-[260px] overflow-y-auto">
                  {customer.loanAccounts.length === 0 ? (
                    <p className="text-sm text-slate-400">No loan accounts found.</p>
                  ) : (
                    customer.loanAccounts.map(ln => (
                      <div key={ln.id} className="border border-slate-100 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] text-slate-400">{ln.accountNumber}</span>
                          <Badge variant={ln.status as any} />
                        </div>
                        {(ln.status === 'active' || ln.status === 'defaulted') && (
                          <div className="mb-1.5">
                            <p className="text-xs text-slate-400">Outstanding</p>
                            <p className={`text-[16px] font-bold ${ln.status === 'defaulted' ? 'text-red-600' : 'text-amber-600'}`}>
                              {fmt(Number(ln.outstandingBalance))}
                            </p>
                          </div>
                        )}
                        {ln.status === 'pending' && (
                          <div className="flex items-center gap-1 text-amber-600 text-xs font-medium mt-1">
                            <MdAccessTime size={12} /> Awaiting admin approval
                          </div>
                        )}
                        {ln.status === 'repaid' && (
                          <div className="flex items-center gap-1 text-green-600 text-xs font-medium mt-1">
                            <MdCheckCircle size={12} /> Fully repaid
                          </div>
                        )}
                        {(ln.status === 'active' || ln.status === 'defaulted' || ln.status === 'pending') && (
                          <Link
                            href={`/loans/${ln.id}`}
                            className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] text-green-600 hover:text-green-700 font-semibold"
                          >
                            View details <MdArrowForward size={11} />
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {/* Issue loan button at bottom */}
                {customer.loanAccounts.every(ln => ln.status !== 'pending') && (
                  <button
                    onClick={() => setLoanModal(true)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-50 active:scale-95 transition-all"
                  >
                    <MdAdd size={15} /> Issue New Loan
                  </button>
                )}
              </div>
            </div>

            {/* Credit Score */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-slide-up" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[14px] font-bold text-slate-900">Credit Score</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Based on loan history and repayment behavior</p>
                </div>
                <MdStar size={18} className="text-amber-400" />
              </div>

              {creditScoreLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 skeleton rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-24 rounded" />
                    <div className="skeleton h-3 w-40 rounded" />
                  </div>
                </div>
              ) : creditScore ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <CreditScoreGauge score={creditScore.score} grade={creditScore.grade} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-3">{creditScore.summary}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center bg-slate-50 rounded-xl py-2">
                        <p className="text-lg font-bold text-slate-900">{creditScore.details.totalLoans}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total Loans</p>
                      </div>
                      <div className="text-center bg-green-50 rounded-xl py-2">
                        <p className="text-lg font-bold text-green-700">{creditScore.details.repaidLoans}</p>
                        <p className="text-[10px] text-green-500 uppercase tracking-wide">Repaid</p>
                      </div>
                      <div className="text-center bg-red-50 rounded-xl py-2">
                        <p className="text-lg font-bold text-red-600">{creditScore.details.defaultedLoans}</p>
                        <p className="text-[10px] text-red-400 uppercase tracking-wide">Defaulted</p>
                      </div>
                    </div>
                    {creditScore.details.lateCharges > 0 && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <MdAccessTime size={12} /> {creditScore.details.lateCharges} late charge(s) recorded
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Credit score unavailable</p>
              )}
            </div>

            {/* Recent transactions */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-slide-up shadow-sm" style={{ animationDelay: '160ms' }}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-bold text-slate-900">Recent Transactions</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Latest activity on the deposit account</p>
                </div>
                <Link href={`/statement?accountNumber=${deposit?.accountNumber ?? ''}`} className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-semibold transition-colors">
                  Full statement <MdArrowForward size={13} />
                </Link>
              </div>
              {!deposit?.transactions || deposit.transactions.length === 0 ? (
                <EmptyState
                  icon={<MdReceipt />}
                  title="No transactions yet"
                  description="Deposit or withdraw to see transactions here."
                />
              ) : (
                <div className="overflow-auto max-h-[420px]">
                  <table className="w-full text-[13px] min-w-[560px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-slate-100">
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Date</th>
                        <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Narration</th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Debit</th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Credit</th>
                        <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {deposit.transactions.map((txn, i) => (
                        <tr
                          key={txn.id}
                          className="hover:bg-slate-50/80 transition-colors animate-slide-up"
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">{fmtDate(txn.createdAt)}</td>
                          <td className="px-5 py-3.5 text-slate-700">{txn.narration}</td>
                          <td className="px-5 py-3.5 text-right text-red-500 font-medium">
                            {txn.type === 'withdrawal' ? fmt(Number(txn.amount)) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-right text-green-600 font-medium">
                            {txn.type === 'deposit' ? fmt(Number(txn.amount)) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{fmt(Number(txn.balanceAfter))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-slide-up shadow-sm" style={{ animationDelay: '200ms' }}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <MdNote size={18} className="text-slate-400" />
                <div>
                  <h2 className="text-[14px] font-bold text-slate-900">Customer Notes</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Internal notes visible only to staff</p>
                </div>
              </div>

              {/* Add note form */}
              <div className="px-5 py-4 border-b border-slate-50">
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={noteSubmitting || !newNote.trim()}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-green-600/25"
                  >
                    <MdSend size={14} />
                    {noteSubmitting ? 'Adding...' : 'Add'}
                  </button>
                </form>
              </div>

              {/* Notes list */}
              <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto">
                {notesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MdNote size={24} className="text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">No notes yet. Add the first note above.</p>
                  </div>
                ) : (
                  notes.map((note, i) => (
                    <div key={note.id} className="px-5 py-3.5 flex items-start gap-3 group animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
                        {note.user?.name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[12px] font-semibold text-slate-700">{note.user?.name}</p>
                          <p className="text-[11px] text-slate-400">{timeAgo(note.createdAt)}</p>
                        </div>
                        <p className="text-[13px] text-slate-600 leading-relaxed">{note.note}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                        title="Delete note"
                      >
                        <MdClose size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit customer modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Customer" size="sm">
        <form onSubmit={handleEditCustomer} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                required
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Phone Number</label>
            <div className="relative">
              <MdPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="tel"
                required
                value={editForm.phone}
                onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>
          {editError && <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{editError}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={editSubmitting}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-green-600/25"
            >
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setEditModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Transaction modal */}
      <Modal
        isOpen={txModal}
        onClose={() => setTxModal(false)}
        title={txType === 'deposit' ? 'Make a Deposit' : 'Make a Withdrawal'}
        size="sm"
      >
        <form onSubmit={handleTransaction} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Amount (₦)</label>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="0.00"
              value={txForm.amount}
              onChange={e => setTxForm(f => ({ ...f, amount: formatNumberInput(e.target.value) }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Narration</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly savings"
              value={txForm.narration}
              onChange={e => setTxForm(f => ({ ...f, narration: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          {txError && <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{txError}</p>}
          {txSuccess && <p className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{txSuccess}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={txSubmitting}
              className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all shadow-sm ${
                txType === 'deposit'
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-600/25'
                  : 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
              }`}
            >
              {txSubmitting ? 'Processing...' : txType === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
            <button type="button" onClick={() => setTxModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Issue loan modal */}
      <Modal isOpen={loanModal} onClose={() => setLoanModal(false)} title="Issue Loan">
        <form onSubmit={handleIssueLoan} className="space-y-4">
          {user?.role === 'admin' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              As an admin, this loan will be activated immediately — no approval required.
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              Loans require admin approval before activation. The loan will be submitted for review.
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Principal Amount (₦)</label>
              <input
                type="text" inputMode="numeric" required placeholder="e.g. 100,000"
                value={loanForm.principalAmount}
                onChange={e => setLoanForm(f => ({ ...f, principalAmount: formatNumberInput(e.target.value, false) }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Interest Rate (%)</label>
              <input
                type="text" inputMode="decimal" required placeholder="e.g. 5"
                value={loanForm.interestRate}
                onChange={e => setLoanForm(f => ({ ...f, interestRate: formatNumberInput(e.target.value) }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Tenure (months)</label>
              <input
                type="number" min="1" required placeholder="e.g. 12"
                value={loanForm.tenureMonths}
                onChange={e => setLoanForm(f => ({ ...f, tenureMonths: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Loan Type</label>
              <select
                value={loanForm.loanType}
                onChange={e => setLoanForm(f => ({ ...f, loanType: e.target.value as 'flat' | 'reducing' }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors"
              >
                <option value="flat">Flat Rate</option>
                <option value="reducing">Reducing Balance</option>
              </select>
            </div>
          </div>
          {loanError && <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{loanError}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loanSubmitting}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-green-600/25"
            >
              {loanSubmitting
                ? (user?.role === 'admin' ? 'Issuing...' : 'Submitting...')
                : (user?.role === 'admin' ? 'Issue Loan' : 'Submit for Approval')
              }
            </button>
            <button type="button" onClick={() => setLoanModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Archive confirmation modal */}
      <Modal isOpen={archiveModal} onClose={() => setArchiveModal(false)} title="Delete Customer" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700 font-semibold mb-1">Are you sure you want to delete this customer?</p>
            <p className="text-sm text-red-600">
              <strong>{customer?.name}</strong> will be archived and hidden from the customer list. All records will be preserved.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleArchive}
              disabled={archiveSubmitting}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 active:scale-95 transition-all"
            >
              {archiveSubmitting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setArchiveModal(false)}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      <LoanCalculator
        isOpen={calcModal}
        onClose={() => setCalcModal(false)}
        onUseValues={(vals) => {
          setLoanForm(vals);
          setLoanModal(true);
        }}
      />
    </DashboardLayout>
  );
}
