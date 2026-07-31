import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRentalInvoice, fetchInvoiceForRentalAgreement } from '@/features/rental/api/rental-api'
import type { RentalAgreementWithRelations } from '@/features/rental/types/rental-types'

export function useInvoiceForRentalAgreement(agreementId: string | undefined) {
  return useQuery({
    queryKey: ['rental-agreement-invoice', agreementId],
    queryFn: () => fetchInvoiceForRentalAgreement(agreementId!),
    enabled: Boolean(agreementId),
  })
}

export function useCreateRentalInvoice(agreementId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (agreement: RentalAgreementWithRelations) => createRentalInvoice(agreement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-agreement-invoice', agreementId] })
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-lines'] })
      toast.success('Rental invoice created and posted to the ledger')
    },
    onError: (error) => toast.error(error.message),
  })
}
