import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRentalQuotation, fetchRentalQuotationItems, fetchRentalQuotations, sendRentalQuotation } from '@/features/rental/api/rental-api'
import type { RentalQuotationFormValues } from '@/features/rental/schemas/rental-schemas'

const KEY = 'rental-quotations'

export function useRentalQuotations() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRentalQuotations })
}

export function useRentalQuotationItems(quotationId: string | undefined) {
  return useQuery({
    queryKey: [KEY, quotationId, 'items'],
    queryFn: () => fetchRentalQuotationItems(quotationId!),
    enabled: Boolean(quotationId),
  })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [KEY] })
  queryClient.invalidateQueries({ queryKey: ['rental-inquiries'] })
}

export function useCreateRentalQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RentalQuotationFormValues) => createRentalQuotation(values),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Quotation created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useSendRentalQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sendRentalQuotation(id),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Quotation marked as sent')
    },
    onError: (error) => toast.error(error.message),
  })
}
