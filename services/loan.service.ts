import { apiClient } from "@/lib/api-client";

export interface LoanCustomer {
  id: number;
  name: string;
  phone: string;
  depositAccounts: Array<{ id: number; accountNumber: string; balance: number }>;
  loanAccounts: Array<{ id: number; accountNumber: string; status: string }>;
}

export interface Loan {
  id: number;
  accountNumber: string;
  customerId: number;
  depositAccountId: number;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  loanType: 'flat' | 'reducing';
  outstandingBalance: number;
  startDate: string;
  endDate: string;
  nextPaymentDate: string | null;
  nextPaymentAmount: number | null;
  status: 'notActive' | 'active' | 'repaid' | 'defaulted' | 'pending';
  rejectionReason?: string;
  createdAt: string;
  customer: LoanCustomer;
}

export interface ActiveLoansResponse {
  count: number;
  loans: Loan[];
}

export interface AllLoansResponse {
  count: number;
  loans: Loan[];
  totalPages: number;
  currentPage: number;
}

export interface LoanScheduleEntry {
  month: number;
  date: string;
  narration: string;
  principalRepayment: number;
  interestAmount: number;
  loanBalance: number;
  amountPayable: number;
  status: 'disbursed' | 'paid' | 'next' | 'upcoming';
}

export interface LoanScheduleResponse {
  loanAccountId: number;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  summary: {
    totalPrincipal: number;
    totalInterest: number;
    totalPayable: number;
    totalPaid: number;
    remainingBalance: number;
  };
  schedule: LoanScheduleEntry[];
}

export interface LoanStatsResponse {
  totalPrincipalLoaned: number;
  totalOutstandingBalance: number;
  totalInterestToCollect: number;
  activeLoanCount: number;
}

export interface CreateLoanDto {
  customerId: number;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  loanType: 'flat' | 'reducing';
}

export interface CreateRepaymentDto {
  amount: number;
  narration: string;
}

export interface RepaymentRecord {
  id: number;
  amount: number;
  method: string;
  expectedAmount: number;
  narration: string;
  createdAt: string;
  createdBy: { name: string; email: string };
}

export interface RepaymentsResponse {
  loanAccountId: number;
  repayments: RepaymentRecord[];
}

export const loanService = {
  getActiveLoans: () =>
    apiClient.get<ActiveLoansResponse>('/loan/activeloans'),

  getLoanSchedule: (loanAccountId: number) =>
    apiClient.get<LoanScheduleResponse>(`/loan/${loanAccountId}/schedule`),

  getTotalLoanedAmount: () =>
    apiClient.get<LoanStatsResponse>('/loan/stats/total-loaned'),

  issueLoan: (loan: CreateLoanDto) =>
    apiClient.post<Loan & { warning?: string | null }>('/loan/issueloan', loan),

  getLoanById: (loanAccountId: number) =>
    apiClient.get<Loan>(`/loan/${loanAccountId}`),

  recordRepayment: (loanAccountId: number, dto: CreateRepaymentDto) =>
    apiClient.post(`/loan/${loanAccountId}/repayment`, dto),

  getLoanRepayments: (loanAccountId: number) =>
    apiClient.get<RepaymentsResponse>(`/loan/${loanAccountId}/repayments`),

  getAllLoans: (status?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return apiClient.get<AllLoansResponse>(`/loan/all?${params.toString()}`);
  },

  markDefaulted: (loanAccountId: number) =>
    apiClient.patch(`/loan/${loanAccountId}/mark-defaulted`),

  repayFromBalance: (loanAccountId: number, amount?: number) =>
    apiClient.post(`/loan/${loanAccountId}/repay-from-balance`, amount ? { amount } : {}),

  getPendingLoans: () =>
    apiClient.get<{ count: number; loans: Loan[] }>('/loan/pending/all'),

  approveLoan: (id: number) =>
    apiClient.patch<{ message: string; loanAccount: Loan }>(`/loan/${id}/approve`),

  rejectLoan: (id: number, reason: string) =>
    apiClient.patch<{ message: string; loanAccount: Loan }>(`/loan/${id}/reject`, { reason }),
};
