import { apiClient } from "@/lib/api-client";

export interface SavingsProduct {
  id: number;
  name: string;
  description?: string | null;
  interestRate: number;
  interestFrequency: string;
  targetLocked: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: { depositAccounts: number };
}

export interface UpdateSavingsProductDto {
  name?: string;
  description?: string;
  interestFrequency?: string;
  targetLocked?: boolean;
  isActive?: boolean;
}

export interface SavingsAccount {
  id: number;
  accountNumber: string;
  balance: number;
  targetAmount?: number | null;
  targetDate?: string | null;
  lastInterestCreditedAt?: string | null;
  savingsProduct: SavingsProduct;
}

export interface SavingsRateChangeRequest {
  id: number;
  currentRate: number;
  requestedRate: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  savingsProduct: SavingsProduct;
  requestedBy: { id: number; name: string; email: string };
}

export interface CreateSavingsProductDto {
  name: string;
  description?: string;
  interestRate: number;
  interestFrequency?: string;
  targetLocked?: boolean;
}

export interface CreateSavingsAccountDto {
  customerId: number;
  savingsProductId: number;
  targetAmount?: number;
  targetDate?: string;
}

export const savingsService = {
  createProduct: (dto: CreateSavingsProductDto) =>
    apiClient.post<{ message: string; product: SavingsProduct }>('/savings/products', dto),

  listProducts: () =>
    apiClient.get<{ count: number; products: SavingsProduct[] }>('/savings/products'),

  updateProduct: (id: number, dto: UpdateSavingsProductDto) =>
    apiClient.patch<{ message: string; product: SavingsProduct }>(`/savings/products/${id}`, dto),

  deleteProduct: (id: number) =>
    apiClient.delete<{ message: string }>(`/savings/products/${id}`),

  requestRateChange: (productId: number, requestedRate: number) =>
    apiClient.post<{ message: string; approved: boolean }>(
      `/savings/products/${productId}/rate-change-request`, { requestedRate },
    ),

  getPendingRateChangeRequests: () =>
    apiClient.get<{ count: number; requests: SavingsRateChangeRequest[] }>('/savings/rate-change-requests/pending'),

  approveRateChangeRequest: (id: number) =>
    apiClient.patch<{ message: string }>(`/savings/rate-change-requests/${id}/approve`),

  rejectRateChangeRequest: (id: number, reason: string) =>
    apiClient.patch<{ message: string }>(`/savings/rate-change-requests/${id}/reject`, { reason }),

  createSavingsAccount: (dto: CreateSavingsAccountDto) =>
    apiClient.post<{ message: string; account: SavingsAccount }>('/savings/accounts', dto),

  getCustomerSavingsAccounts: (customerId: number) =>
    apiClient.get<{ count: number; accounts: SavingsAccount[] }>(`/savings/customer/${customerId}/accounts`),
};
