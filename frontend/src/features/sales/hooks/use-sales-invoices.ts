import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createSalesInvoice, createSalesPayment, fetchInvoiceableSalesOrders, fetchSalesInvoiceItems, fetchSalesInvoices, fetchSalesPayments } from '@/features/sales/api/sales-api'
import type { SalesPaymentFormValues } from '@/features/sales/schemas/sales-schemas'

export function useSalesInvoices() {
  return useQuery({ queryKey: ['sales-invoices'], queryFn: fetchSalesInvoices })
}

export function useSalesInvoiceItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['sales-invoices', invoiceId, 'items'],
    queryFn: () => fetchSalesInvoiceItems(invoiceId!),
    enabled: Boolean(invoiceId),
  })
}

export function useInvoiceableSalesOrders() {
  return useQuery({ queryKey: ['sales-orders', 'invoiceable'], queryFn: fetchInvoiceableSalesOrders })
}

export function useCreateSalesInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSalesInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-lines'] })
      toast.success('Invoice created and posted to ledger')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useSalesPayments(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['sales-payments', invoiceId],
    queryFn: () => fetchSalesPayments(invoiceId!),
    enabled: Boolean(invoiceId),
  })
}

export function useCreateSalesPayment(invoiceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SalesPaymentFormValues) => createSalesPayment(invoiceId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sales-payments', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['ledger-lines'] })
      toast.success('Payment recorded')
    },
    onError: (error) => toast.error(error.message),
  })
}
