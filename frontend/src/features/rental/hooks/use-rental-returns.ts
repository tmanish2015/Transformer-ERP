import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRentalReturn, fetchRentalReturnForAgreement } from '@/features/rental/api/rental-api'
import type { RentalReturnFormValues } from '@/features/rental/schemas/rental-schemas'

export function useRentalReturnForAgreement(agreementId: string | undefined) {
  return useQuery({
    queryKey: ['rental-return', agreementId],
    queryFn: () => fetchRentalReturnForAgreement(agreementId!),
    enabled: Boolean(agreementId),
  })
}

export function useCreateRentalReturn(agreementId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RentalReturnFormValues) => createRentalReturn(agreementId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-return', agreementId] })
      queryClient.invalidateQueries({ queryKey: ['rental-agreements', agreementId] })
      queryClient.invalidateQueries({ queryKey: ['rental-assets'] })
      toast.success('Asset marked as returned')
    },
    onError: (error) => toast.error(error.message),
  })
}
