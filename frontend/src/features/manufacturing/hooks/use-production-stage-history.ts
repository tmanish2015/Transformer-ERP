import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { addProductionStageHistoryEntry, fetchAllProductionStageHistory, fetchProductionStageHistory } from '@/features/manufacturing/api/manufacturing-api'
import type { ProductionStageHistoryFormValues } from '@/features/manufacturing/schemas/manufacturing-schemas'

const KEY = 'production-stage-history'

export function useProductionStageHistory(orderId: string | undefined) {
  return useQuery({
    queryKey: [KEY, orderId],
    queryFn: () => fetchProductionStageHistory(orderId!),
    enabled: Boolean(orderId),
  })
}

export function useAllProductionStageHistory() {
  return useQuery({ queryKey: [KEY, 'all'], queryFn: fetchAllProductionStageHistory })
}

export function useAddProductionStageHistoryEntry(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ProductionStageHistoryFormValues) => addProductionStageHistoryEntry(orderId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, orderId] })
      queryClient.invalidateQueries({ queryKey: ['production-orders'] })
      queryClient.invalidateQueries({ queryKey: ['production-orders', orderId, 'requirements'] })
      toast.success('Stage logged')
    },
    onError: (error) => toast.error(error.message),
  })
}
