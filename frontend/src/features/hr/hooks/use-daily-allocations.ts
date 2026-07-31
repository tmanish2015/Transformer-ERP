import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createDailyAllocation, deleteDailyAllocation, fetchAllAllocations, fetchAllocationsForReference } from '@/features/hr/api/hr-api'
import type { DailyAllocationFormValues } from '@/features/hr/schemas/hr-schemas'

export function useAllocationsForReference(referenceType: string, referenceId: string | undefined) {
  return useQuery({
    queryKey: ['daily-allocations', referenceType, referenceId],
    queryFn: () => fetchAllocationsForReference(referenceType, referenceId!),
    enabled: Boolean(referenceId),
  })
}

export function useAllAllocations() {
  return useQuery({ queryKey: ['daily-allocations', 'all'], queryFn: fetchAllAllocations })
}

export function useCreateDailyAllocation(referenceType: string, referenceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: DailyAllocationFormValues) => createDailyAllocation(referenceType, referenceId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-allocations', referenceType, referenceId] })
      toast.success('Technician assigned')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteDailyAllocation(referenceType: string, referenceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDailyAllocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-allocations', referenceType, referenceId] })
      toast.success('Assignment removed')
    },
    onError: (error) => toast.error(error.message),
  })
}
