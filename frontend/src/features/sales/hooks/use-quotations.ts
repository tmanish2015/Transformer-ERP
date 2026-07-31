import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { convertQuotationToSalesOrder, createQuotation, deleteQuotation, fetchQuotationItems, fetchQuotations, updateQuotationStatus } from '@/features/sales/api/sales-api'
import type { QuotationFormValues } from '@/features/sales/schemas/sales-schemas'

const KEY = 'quotations'

export function useQuotations() {
  return useQuery({ queryKey: [KEY], queryFn: fetchQuotations })
}

export function useQuotationItems(quotationId: string | undefined) {
  return useQuery({
    queryKey: [KEY, quotationId, 'items'],
    queryFn: () => fetchQuotationItems(quotationId!),
    enabled: Boolean(quotationId),
  })
}

export function useCreateQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: QuotationFormValues) => createQuotation(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Quotation created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, extra }: { id: string; status: string; extra?: { approved_by?: string; approved_at?: string } }) => updateQuotationStatus(id, status, extra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Quotation updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Quotation deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useConvertQuotationToSalesOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quotationId, warehouseId, deliveryDate }: { quotationId: string; warehouseId: string; deliveryDate?: string }) =>
      convertQuotationToSalesOrder(quotationId, warehouseId, deliveryDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      toast.success('Converted to sales order')
    },
    onError: (error) => toast.error(error.message),
  })
}
