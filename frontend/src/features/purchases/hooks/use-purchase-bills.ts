import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createPurchaseBill, createPurchasePayment, fetchBillablePOs, fetchPurchaseBills, fetchPurchasePayments } from '@/features/purchases/api/purchases-api'
import type { PurchasePaymentFormValues } from '@/features/purchases/schemas/purchase-schemas'

export function usePurchaseBills() {
  return useQuery({ queryKey: ['purchase-bills'], queryFn: fetchPurchaseBills })
}

export function useBillablePOs() {
  return useQuery({ queryKey: ['purchase-orders', 'billable'], queryFn: fetchBillablePOs })
}

export function useCreatePurchaseBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPurchaseBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Bill created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function usePurchasePayments(billId: string | undefined) {
  return useQuery({
    queryKey: ['purchase-payments', billId],
    queryFn: () => fetchPurchasePayments(billId!),
    enabled: Boolean(billId),
  })
}

export function useCreatePurchasePayment(billId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: PurchasePaymentFormValues) => createPurchasePayment(billId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-payments', billId] })
      toast.success('Payment recorded')
    },
    onError: (error) => toast.error(error.message),
  })
}
