import useSWR from 'swr';
import {
  savingsService,
  SavingsProduct,
  SavingsAccount,
  SavingsRateChangeRequest,
} from '@/services/savings.service';

export function useSavingsProducts() {
  const { data, error, isLoading, mutate } = useSWR<{ count: number; products: SavingsProduct[] }>(
    'savings-products',
    savingsService.listProducts,
    { revalidateOnFocus: false },
  );
  return { products: data?.products ?? [], isLoading, isError: error, mutate };
}

export function useCustomerSavingsAccounts(customerId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<{ count: number; accounts: SavingsAccount[] }>(
    customerId ? `customer-savings-${customerId}` : null,
    () => savingsService.getCustomerSavingsAccounts(customerId!),
    { revalidateOnFocus: false },
  );
  return { accounts: data?.accounts ?? [], isLoading, isError: error, mutate };
}

export function usePendingSavingsRateRequests() {
  const { data, error, isLoading, mutate } = useSWR<{ count: number; requests: SavingsRateChangeRequest[] }>(
    'savings-rate-requests-pending',
    savingsService.getPendingRateChangeRequests,
    { revalidateOnFocus: false },
  );
  return { requests: data?.requests ?? [], isLoading, isError: error, mutate };
}
