import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createOpportunity, deleteOpportunity, fetchOpportunities, fetchOpportunity, updateOpportunityStage } from '@/features/crm/api/crm-api'
import type { OpportunityFormValues } from '@/features/crm/schemas/crm-schemas'
import type { OpportunityStage } from '@/features/crm/types/crm-types'

const KEY = 'opportunities'

export function useOpportunities() {
  return useQuery({ queryKey: [KEY], queryFn: fetchOpportunities })
}

export function useOpportunity(id: string | undefined) {
  return useQuery({ queryKey: [KEY, id], queryFn: () => fetchOpportunity(id!), enabled: Boolean(id) })
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: OpportunityFormValues) => createOpportunity(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Opportunity created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateOpportunityStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: OpportunityStage }) => updateOpportunityStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Opportunity stage updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Opportunity deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
