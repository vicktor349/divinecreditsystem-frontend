import { apiClient } from "@/lib/api-client";

export interface StatementTransaction {
  id: number;
  accountNumber: string;
  type: 'deposit' | 'withdrawal' | 'loan_repayment';
  amount: number;
  narration: string;
  balanceAfter: number;
  date: string;
}

export interface StatementResponse {
  customer: {
    id: number;
    name: string;
    phone: string;
  };
  accounts: Array<{
    accountNumber: string;
    currentBalance: number;
  }>;
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
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

export const depositService = {
  transact: (dto: CreateDepositDto) =>
    apiClient.post('/deposit', dto),

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
