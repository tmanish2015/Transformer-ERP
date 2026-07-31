import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { addStageHistoryEntry, fetchAllStageHistory, fetchStageHistory } from '@/features/workshop/api/workshop-api'
import type { StageHistoryFormValues } from '@/features/workshop/schemas/workshop-schemas'

const KEY = 'repair-job-stages'

export function useStageHistory(repairJobId: string | undefined) {
  return useQuery({
    queryKey: [KEY, repairJobId],
    queryFn: () => fetchStageHistory(repairJobId!),
    enabled: Boolean(repairJobId),
  })
}

export function useAllStageHistory() {
  return useQuery({ queryKey: [KEY, 'all'], queryFn: fetchAllStageHistory })
}

export function useAddStageHistoryEntry(repairJobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: StageHistoryFormValues) => addStageHistoryEntry(repairJobId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, repairJobId] })
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
      toast.success('Stage logged')
    },
    onError: (error) => toast.error(error.message),
  })
}
