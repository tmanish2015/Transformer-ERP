import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cancelSalesOrder, createSalesOrder, deleteSalesOrder, fetchSalesOrderItems, fetchSalesOrders } from '@/features/sales/api/sales-api'
import type { SalesOrderFormValues } from '@/features/sales/schemas/sales-schemas'

const KEY = 'sales-orders'

export function useSalesOrders() {
  return useQuery({ queryKey: [KEY], queryFn: fetchSalesOrders })
}

export function useSalesOrderItems(salesOrderId: string | undefined) {
  return useQuery({
    queryKey: [KEY, salesOrderId, 'items'],
    queryFn: () => fetchSalesOrderItems(salesOrderId!),
    enabled: Boolean(salesOrderId),
  })
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SalesOrderFormValues) => createSalesOrder(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Sales order created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useCancelSalesOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Sales order cancelled')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Sales order deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
