import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRentalDispatch, fetchRentalDispatchForAgreement } from '@/features/rental/api/rental-api'
import type { RentalDispatchFormValues } from '@/features/rental/schemas/rental-schemas'

export function useRentalDispatchForAgreement(agreementId: string | undefined) {
  return useQuery({
    queryKey: ['rental-dispatch', agreementId],
    queryFn: () => fetchRentalDispatchForAgreement(agreementId!),
    enabled: Boolean(agreementId),
  })
}

export function useCreateRentalDispatch(agreementId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RentalDispatchFormValues) => createRentalDispatch(agreementId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-dispatch', agreementId] })
      queryClient.invalidateQueries({ queryKey: ['rental-agreements', agreementId] })
      queryClient.invalidateQueries({ queryKey: ['rental-assets'] })
      toast.success('Asset dispatched')
    },
    onError: (error) => toast.error(error.message),
  })
}
