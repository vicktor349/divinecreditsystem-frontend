import { apiClient } from "@/lib/api-client";

export interface MyLoan {
  id: number;
  accountNumber: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  loanType: 'flat' | 'reducing' | 'bullet';
  paymentFrequency: 'weekly' | 'monthly';
  outstandingBalance: number;
  status: 'notActive' | 'active' | 'repaid' | 'defaulted' | 'pending';
  startDate: string | null;
  nextPaymentDate: string | null;
  nextPaymentAmount: number | null;
  createdAt: string;
}

export interface MyDepositTransaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'loan_repayment';
  amount: number;
  narration: string;
  balanceAfter: number;
  createdAt: string;
}

export interface MyDeposit {
  id: number;
  accountNumber: string;
  balance: number;
  transactions: MyDepositTransaction[];
}

export interface MySavingsAccount {
  id: number;
  accountNumber: string;
  balance: number;
  targetAmount?: number | null;
  targetDate?: string | null;
  savingsProduct: {
    id: number;
    name: string;
    interestRate: number;
    interestFrequency: string;
    targetLocked: boolean;
  };
}

export interface MyProfile {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
  depositAccounts: MyDeposit[];
  loanAccounts: MyLoan[];
}

export const meService = {
  getProfile: () => apiClient.get<MyProfile>('/me/profile'),
  getLoans: () => apiClient.get<{ count: number; loans: MyLoan[] }>('/me/loans'),
  getDeposits: () => apiClient.get<{ count: number; deposits: MyDeposit[] }>('/me/deposits'),
  getSavings: () => apiClient.get<{ count: number; accounts: MySavingsAccount[] }>('/me/savings'),
};
