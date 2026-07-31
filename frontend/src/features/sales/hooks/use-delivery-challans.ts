import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createDeliveryChallan, fetchDeliverableSalesOrders, fetchDeliveryChallans } from '@/features/sales/api/sales-api'

export function useDeliveryChallans() {
  return useQuery({ queryKey: ['delivery-challans'], queryFn: fetchDeliveryChallans })
}

export function useDeliverableSalesOrders() {
  return useQuery({ queryKey: ['sales-orders', 'deliverable'], queryFn: fetchDeliverableSalesOrders })
}

export function useCreateDeliveryChallan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDeliveryChallan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-challans'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stock-levels'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      toast.success('Delivery challan created — stock updated')
    },
    onError: (error) => toast.error(error.message),
  })
}
