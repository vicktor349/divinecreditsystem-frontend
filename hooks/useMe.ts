import useSWR from 'swr';
import { meService, MyProfile, MyLoan, MyDeposit, MySavingsAccount } from '@/services/me.service';

export function useMyProfile() {
  const { data, error, isLoading, mutate } = useSWR<MyProfile>(
    'me-profile', meService.getProfile, { revalidateOnFocus: false },
  );
  return { profile: data, isLoading, isError: error, mutate };
}

export function useMyLoans() {
  const { data, error, isLoading, mutate } = useSWR<{ count: number; loans: MyLoan[] }>(
    'me-loans', meService.getLoans, { revalidateOnFocus: false },
  );
  return { loans: data?.loans ?? [], isLoading, isError: error, mutate };
}

export function useMyDeposits() {
  const { data, error, isLoading, mutate } = useSWR<{ count: number; deposits: MyDeposit[] }>(
    'me-deposits', meService.getDeposits, { revalidateOnFocus: false },
  );
  return { deposits: data?.deposits ?? [], isLoading, isError: error, mutate };
}

export function useMySavings() {
  const { data, error, isLoading, mutate } = useSWR<{ count: number; accounts: MySavingsAccount[] }>(
    'me-savings', meService.getSavings, { revalidateOnFocus: false },
  );
  return { accounts: data?.accounts ?? [], isLoading, isError: error, mutate };
}
