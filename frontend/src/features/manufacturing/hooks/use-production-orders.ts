import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createProductionOrder, fetchProductionOrder, fetchProductionOrders, fetchRawMaterialRequirements } from '@/features/manufacturing/api/manufacturing-api'
import type { ProductionOrderFormValues } from '@/features/manufacturing/schemas/manufacturing-schemas'

const KEY = 'production-orders'

export function useProductionOrders() {
  return useQuery({ queryKey: [KEY], queryFn: fetchProductionOrders })
}

export function useProductionOrder(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => fetchProductionOrder(id!),
    enabled: Boolean(id),
  })
}

export function useRawMaterialRequirements(orderId: string | undefined) {
  return useQuery({
    queryKey: [KEY, orderId, 'requirements'],
    queryFn: () => fetchRawMaterialRequirements(orderId!),
    enabled: Boolean(orderId),
  })
}

export function useCreateProductionOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ProductionOrderFormValues) => createProductionOrder(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Production order created')
    },
    onError: (error) => toast.error(error.message),
  })
}
