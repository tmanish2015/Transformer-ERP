import { useQuery } from '@tanstack/react-query'
import { fetchCustomerLedgerData } from '@/features/sales/api/sales-api'

export function useCustomerLedger(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customer-ledger', customerId],
    queryFn: () => fetchCustomerLedgerData(customerId!),
    enabled: Boolean(customerId),
  })
}
