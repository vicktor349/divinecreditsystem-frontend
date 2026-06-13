import { apiClient } from "@/lib/api-client";

export interface StatementTransaction {
  id: number;
  accountNumber: string;
  type: 'deposit' | 'withdrawal' | 'loan_repayment' | 'penalty';
  amount: number;
  narration: string;
  balanceAfter: number;
  date: string;
}

export interface StatementResponse {
  customer: { id: number; name: string; phone: string };
  accounts: Array<{ accountNumber: string; currentBalance: number }>;
  period: { startDate: string | null; endDate: string | null };
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
    totalPenalties: number;
    totalLoanRepayments: number;
    totalTransactions: number;
  };
  transactions: StatementTransaction[];
}

export interface CreateDepositDto {
  accountId: number;
  type: 'deposit' | 'withdrawal';
  amount: number;
  narration: string;
}

export interface DepositRequest {
  id: number;
  type: 'deposit' | 'withdrawal';
  amount: number;
  narration: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  depositAccount: {
    id: number;
    accountNumber: string;
    balance: number;
    customer: { id: number; name: string; phone: string };
  };
  requestedBy: { id: number; name: string; email: string };
}

export const depositService = {
  // Submit a deposit/withdrawal request for admin approval (Feature #5)
  requestDeposit: (dto: CreateDepositDto) =>
    apiClient.post<{ message: string; request: DepositRequest }>('/deposit/request', dto),

  // Admin: get pending deposit requests
  getPendingDepositRequests: () =>
    apiClient.get<{ count: number; requests: DepositRequest[] }>('/deposit/requests/pending'),

  // Admin: approve a deposit request
  approveDepositRequest: (id: number) =>
    apiClient.patch<{ message: string; newBalance: number }>(`/deposit/requests/${id}/approve`),

  // Admin: reject a deposit request
  rejectDepositRequest: (id: number, reason: string) =>
    apiClient.patch<{ message: string }>(`/deposit/requests/${id}/reject`, { reason }),

  getStatement: (customerId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<StatementResponse>(`/deposit/statement/${customerId}${query}`);
  },

  getStatementByAccountNumber: (accountNumber: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<StatementResponse>(`/deposit/statement/account/${accountNumber}${query}`);
  },
};
