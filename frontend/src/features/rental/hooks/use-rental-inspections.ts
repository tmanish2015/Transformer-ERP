import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRentalInspection, fetchRentalInspectionForReturn } from '@/features/rental/api/rental-api'
import type { RentalInspectionFormValues } from '@/features/rental/schemas/rental-schemas'

export function useRentalInspectionForReturn(returnId: string | undefined) {
  return useQuery({
    queryKey: ['rental-inspection', returnId],
    queryFn: () => fetchRentalInspectionForReturn(returnId!),
    enabled: Boolean(returnId),
  })
}

export function useCreateRentalInspection(returnId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RentalInspectionFormValues) => createRentalInspection(returnId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-inspection', returnId] })
      queryClient.invalidateQueries({ queryKey: ['rental-assets'] })
      toast.success('Inspection recorded')
    },
    onError: (error) => toast.error(error.message),
  })
}
