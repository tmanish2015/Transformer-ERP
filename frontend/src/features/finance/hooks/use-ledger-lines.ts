import { useQuery } from '@tanstack/react-query'
import { fetchAllLedgerLines } from '@/features/finance/api/finance-api'

export function useLedgerLines() {
  return useQuery({ queryKey: ['ledger-lines'], queryFn: fetchAllLedgerLines })
}
