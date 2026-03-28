import useSWR from 'swr';
import { depositService, StatementResponse } from '@/services/deposit.service';

export function useStatement(
  customerId: number | null,
  startDate?: string,
  endDate?: string,
) {
  const key =
    customerId
      ? `statement-${customerId}-${startDate ?? ''}-${endDate ?? ''}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<StatementResponse>(
    key,
    () => depositService.getStatement(customerId!, startDate, endDate),
    { revalidateOnFocus: false },
  );

  return {
    statement: data,
    isLoading,
    isError: error,
    mutate,
  };
}
