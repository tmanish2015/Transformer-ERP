import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createPurchaseOrder, deletePurchaseOrder, fetchPurchaseOrderItems, fetchPurchaseOrders, updatePurchaseOrderStatus } from '@/features/purchases/api/purchases-api'

const PO_KEY = 'purchase-orders'

export function usePurchaseOrders() {
  return useQuery({ queryKey: [PO_KEY], queryFn: fetchPurchaseOrders })
}

export function usePurchaseOrderItems(purchaseOrderId: string | undefined) {
  return useQuery({
    queryKey: [PO_KEY, purchaseOrderId, 'items'],
    queryFn: () => fetchPurchaseOrderItems(purchaseOrderId!),
    enabled: Boolean(purchaseOrderId),
  })
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PO_KEY] })
      toast.success('Purchase order created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, extra }: { id: string; status: string; extra?: { approved_by?: string; approved_at?: string } }) => updatePurchaseOrderStatus(id, status, extra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PO_KEY] })
      toast.success('Purchase order updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PO_KEY] })
      toast.success('Purchase order deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
