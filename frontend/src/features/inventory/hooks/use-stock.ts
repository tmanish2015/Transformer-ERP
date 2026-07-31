import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createBatch, createStockMovement, fetchBatches, fetchMovements, fetchStockLevels } from '@/features/inventory/api/stock-api'
import type { BatchFormValues, StockAdjustmentFormValues } from '@/features/inventory/schemas/inventory-schemas'

export function useStockLevels() {
  return useQuery({ queryKey: ['inventory-stock-levels'], queryFn: fetchStockLevels })
}

export function useBatches() {
  return useQuery({ queryKey: ['inventory-batches'], queryFn: fetchBatches })
}

export function useMovements() {
  return useQuery({ queryKey: ['inventory-movements'], queryFn: () => fetchMovements() })
}

function invalidateStockQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['inventory-stock-levels'] })
  queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
  queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
  queryClient.invalidateQueries({ queryKey: ['inventory-batches'] })
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: StockAdjustmentFormValues) => createStockMovement(values),
    onSuccess: () => {
      invalidateStockQueries(queryClient)
      toast.success('Stock movement recorded')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useCreateBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: BatchFormValues) => createBatch(values),
    onSuccess: () => {
      invalidateStockQueries(queryClient)
      toast.success('Batch created')
    },
    onError: (error) => toast.error(error.message),
  })
}
