import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRentalAgreement, fetchRentalAgreement, fetchRentalAgreements } from '@/features/rental/api/rental-api'
import type { RentalAgreementFormValues } from '@/features/rental/schemas/rental-schemas'
import type { RentalBookingWithRelations } from '@/features/rental/types/rental-types'

const KEY = 'rental-agreements'

export function useRentalAgreements() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRentalAgreements })
}

export function useRentalAgreement(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => fetchRentalAgreement(id!),
    enabled: Boolean(id),
  })
}

export function useCreateRentalAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ booking, values }: { booking: RentalBookingWithRelations; values: RentalAgreementFormValues }) => createRentalAgreement(booking, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      queryClient.invalidateQueries({ queryKey: ['rental-bookings'] })
      toast.success('Rental agreement created')
    },
    onError: (error) => toast.error(error.message),
  })
}
