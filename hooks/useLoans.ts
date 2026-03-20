import useSWR from 'swr';
import {
  loanService,
  ActiveLoansResponse,
  AllLoansResponse,
  LoanScheduleResponse,
  LoanStatsResponse,
  Loan,
  RepaymentsResponse,
} from '@/services/loan.service';

export function useActiveLoans() {
  const { data, error, isLoading, mutate } = useSWR<ActiveLoansResponse>(
    'active-loans',
    loanService.getActiveLoans,
    { refreshInterval: 30000, revalidateOnFocus: true },
  );
  return { loans: data?.loans ?? [], count: data?.count ?? 0, isLoading, isError: error, mutate };
}

export function useLoanSchedule(loanAccountId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<LoanScheduleResponse>(
    loanAccountId ? `loan-schedule-${loanAccountId}` : null,
    () => loanService.getLoanSchedule(loanAccountId!),
    { revalidateOnFocus: false },
  );
  return { schedule: data, isLoading, isError: error, mutate };
}

export function useLoanStats() {
  const { data, error, isLoading, mutate } = useSWR<LoanStatsResponse>(
    'loan-stats',
    loanService.getTotalLoanedAmount,
    { refreshInterval: 60000 },
  );
  return { stats: data, isLoading, isError: error, mutate };
}

export function useLoan(loanAccountId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<Loan>(
    loanAccountId ? `loan-${loanAccountId}` : null,
    () => loanService.getLoanById(loanAccountId!),
    { revalidateOnFocus: false },
  );
  return { loan: data, isLoading, isError: error, mutate };
}

export function useLoanRepayments(loanAccountId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<RepaymentsResponse>(
    loanAccountId ? `loan-repayments-${loanAccountId}` : null,
    () => loanService.getLoanRepayments(loanAccountId!),
    { revalidateOnFocus: false },
  );
  return { repayments: data?.repayments ?? [], isLoading, isError: error, mutate };
}

export function useAllLoans(status?: string, page = 1, limit = 10) {
  const key = `all-loans-${status ?? 'all'}-${page}-${limit}`;
  const { data, error, isLoading, mutate } = useSWR<AllLoansResponse>(
    key,
    () => loanService.getAllLoans(status, page, limit),
    { revalidateOnFocus: false },
  );
  return {
    loans: data?.loans ?? [],
    count: data?.count ?? 0,
    totalPages: data?.totalPages ?? 1,
    currentPage: data?.currentPage ?? page,
    isLoading,
    isError: error,
    mutate,
  };
}
