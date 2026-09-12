import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRentalInvoice, createRentalInvoiceFromBooking, fetchInvoiceForRentalAgreement } from '@/features/rental/api/rental-api'
import type { RentalBookingInvoiceFormValues } from '@/features/rental/schemas/rental-schemas'
import type { RentalAgreementWithRelations, RentalBookingWithRelations } from '@/features/rental/types/rental-types'

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

export function useCreateRentalInvoiceFromBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ booking, values }: { booking: RentalBookingWithRelations; values: RentalBookingInvoiceFormValues }) =>
      createRentalInvoiceFromBooking(booking, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['rental-bookings-invoiced-ids'] })
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-lines'] })
      toast.success('Rental invoice created and posted to the ledger')
    },
    onError: (error) => toast.error(error.message),
  })
}
