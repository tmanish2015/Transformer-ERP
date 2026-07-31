import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRepairEstimate, fetchRepairEstimateItems, fetchRepairEstimates, fetchRepairEstimatesForJob, recordCustomerApproval, sendEstimateToCustomer } from '@/features/workshop/api/workshop-api'
import type { CustomerApprovalFormValues, RepairEstimateFormValues } from '@/features/workshop/schemas/workshop-schemas'

const KEY = 'repair-estimates'
const JOBS_KEY = 'repair-jobs'

export function useRepairEstimates() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRepairEstimates })
}

export function useRepairEstimatesForJob(repairJobId: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'job', repairJobId],
    queryFn: () => fetchRepairEstimatesForJob(repairJobId!),
    enabled: Boolean(repairJobId),
  })
}

export function useRepairEstimateItems(estimateId: string | undefined) {
  return useQuery({
    queryKey: [KEY, estimateId, 'items'],
    queryFn: () => fetchRepairEstimateItems(estimateId!),
    enabled: Boolean(estimateId),
  })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [KEY] })
  queryClient.invalidateQueries({ queryKey: [JOBS_KEY] })
}

export function useCreateRepairEstimate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RepairEstimateFormValues) => createRepairEstimate(values),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Estimate created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useSendEstimateToCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sendEstimateToCustomer(id),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Estimate marked as sent')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useRecordCustomerApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CustomerApprovalFormValues }) => recordCustomerApproval(id, values),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Customer decision recorded')
    },
    onError: (error) => toast.error(error.message),
  })
}
