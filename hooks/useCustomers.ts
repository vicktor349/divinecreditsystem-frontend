import useSWR from 'swr';
import { customerService, Customer, CustomerDetail, CustomersResponse } from '@/services/customer.service';

export function useCustomers(search?: string, page = 1, limit = 10) {
  const key = `customers-${search ?? ''}-${page}-${limit}`;
  const { data, error, isLoading, mutate } = useSWR<CustomersResponse>(
    key,
    () => customerService.getAll(search, page, limit),
    { revalidateOnFocus: true, dedupingInterval: 5000 },
  );
  return {
    customers: data?.customers ?? [],
    count: data?.count ?? 0,
    totalPages: data?.totalPages ?? 1,
    currentPage: data?.currentPage ?? page,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCustomer(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<CustomerDetail>(
    id ? `customer-${id}` : null,
    () => customerService.getById(id!),
    { revalidateOnFocus: false },
  );
  return { customer: data, isLoading, isError: error, mutate };
}
