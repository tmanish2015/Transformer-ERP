import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRentalDamageAssessment, fetchDamageAssessmentsForInspection } from '@/features/rental/api/rental-api'
import type { RentalDamageAssessmentFormValues } from '@/features/rental/schemas/rental-schemas'

export function useDamageAssessmentsForInspection(inspectionId: string | undefined) {
  return useQuery({
    queryKey: ['rental-damage-assessments', inspectionId],
    queryFn: () => fetchDamageAssessmentsForInspection(inspectionId!),
    enabled: Boolean(inspectionId),
  })
}

export function useCreateRentalDamageAssessment(inspectionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RentalDamageAssessmentFormValues) => createRentalDamageAssessment(inspectionId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-damage-assessments', inspectionId] })
      toast.success('Damage item logged')
    },
    onError: (error) => toast.error(error.message),
  })
}
