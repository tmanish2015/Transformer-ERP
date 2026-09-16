import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cancelRentalBooking, createRentalBooking, fetchInvoicedBookingIds, fetchRentalBookings, returnRentalBookingAndInvoice, updateRentalBooking } from '@/features/rental/api/rental-api'
import type { RentalBookingFormValues } from '@/features/rental/schemas/rental-schemas'
import type { RentalBookingWithRelations } from '@/features/rental/types/rental-types'

const KEY = 'rental-bookings'

export function useRentalBookings() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRentalBookings })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [KEY] })
  queryClient.invalidateQueries({ queryKey: ['rental-assets'] })
  queryClient.invalidateQueries({ queryKey: ['rental-quotations'] })
  queryClient.invalidateQueries({ queryKey: ['rental-inquiries'] })
}

export function useCreateRentalBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, values, rentalQuotationId }: { customerId: string; values: RentalBookingFormValues; rentalQuotationId?: string }) =>
      createRentalBooking(customerId, values, rentalQuotationId),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Booking confirmed — asset reserved')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateRentalBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, customerId, values }: { id: string; customerId: string; values: RentalBookingFormValues }) => updateRentalBooking(id, customerId, values),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Booking updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useCancelRentalBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelRentalBooking(id),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Booking cancelled — asset available again')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useReturnRentalBookingAndInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      booking,
      actualReturnDate,
      rentalDays,
      dailyRate,
    }: {
      booking: RentalBookingWithRelations
      actualReturnDate: string
      rentalDays: number
      dailyRate: number
    }) => returnRentalBookingAndInvoice(booking, actualReturnDate, rentalDays, dailyRate),
    onSuccess: () => {
      invalidateAll(queryClient)
      queryClient.invalidateQueries({ queryKey: ['rental-bookings-invoiced-ids'] })
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-lines'] })
      toast.success('Machine returned and invoice generated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useInvoicedBookingIds() {
  return useQuery({ queryKey: ['rental-bookings-invoiced-ids'], queryFn: fetchInvoicedBookingIds })
}
