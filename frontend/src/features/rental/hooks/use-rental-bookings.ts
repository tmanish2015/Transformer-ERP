import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cancelRentalBooking, createRentalBooking, fetchRentalBookings } from '@/features/rental/api/rental-api'
import type { RentalBookingFormValues } from '@/features/rental/schemas/rental-schemas'

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
