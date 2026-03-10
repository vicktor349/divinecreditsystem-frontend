import { apiClient } from '@/lib/api-client';

export interface DepositAccountSummary {
  id: number;
  accountNumber: string;
  balance: number;
}

export interface LoanAccountSummary {
  id: number;
  accountNumber: string;
  status: 'notActive' | 'active' | 'repaid' | 'defaulted' | 'pending';
  outstandingBalance: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
  depositAccounts: DepositAccountSummary[];
  loanAccounts: LoanAccountSummary[];
}

export interface CustomerDetail extends Customer {
  depositAccounts: Array<
    DepositAccountSummary & {
      transactions: Array<{
        id: number;
        type: 'deposit' | 'withdrawal' | 'loan_repayment';
        amount: number;
        narration: string;
        balanceAfter: number;
        createdAt: string;
      }>;
    }
  >;
}

export interface CustomersResponse {
  count: number;
  customers: Customer[];
  totalPages: number;
  currentPage: number;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
}

export interface CreateCustomerResponse {
  message: string;
  customer: { id: number; name: string; phone: string };
  depositAccount: { id: number; accountNumber: string };
  loanAccount: { id: number; accountNumber: string; status: string };
}

export interface CustomerNote {
  id: number;
  customerId: number;
  userId: number;
  note: string;
  createdAt: string;
  user: { name: string; email: string };
}

export interface CreditScore {
  customerId: number;
  score: number;
  grade: string;
  summary: string;
  details: {
    totalLoans: number;
    repaidLoans: number;
    defaultedLoans: number;
    activeLoans: number;
    lateCharges: number;
  };
}

export const customerService = {
  getAll: (search?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return apiClient.get<CustomersResponse>(`/customer?${params.toString()}`);
  },

  getById: (id: number) =>
    apiClient.get<CustomerDetail>(`/customer/${id}`),

  create: (dto: CreateCustomerDto) =>
    apiClient.post<CreateCustomerResponse>('/customer', dto),

  update: (id: number, dto: { name?: string; phone?: string }) =>
    apiClient.patch<{ message: string; customer: { id: number; name: string; phone: string } }>(
      `/customer/${id}`,
      dto,
    ),

  archive: (id: number) =>
    apiClient.patch<{ message: string }>(`/customer/${id}/archive`),

  getNotes: (id: number) =>
    apiClient.get<{ customerId: number; notes: CustomerNote[] }>(`/customer/${id}/notes`),

  addNote: (id: number, note: string) =>
    apiClient.post<{ message: string; note: CustomerNote }>(`/customer/${id}/notes`, { note }),

  deleteNote: (noteId: number) =>
    apiClient.patch<{ message: string }>(`/customer/notes/${noteId}/delete`),

  getCreditScore: (id: number) =>
    apiClient.get<CreditScore>(`/customer/${id}/credit-score`),
};
