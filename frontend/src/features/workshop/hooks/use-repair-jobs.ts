import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRepairJob, deleteRepairJob, fetchRepairJob, fetchRepairJobs, markPickupCompleted, updateRepairJobStatus } from '@/features/workshop/api/workshop-api'
import type { RepairJobFormValues } from '@/features/workshop/schemas/workshop-schemas'

const KEY = 'repair-jobs'

export function useRepairJobs() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRepairJobs })
}

export function useRepairJob(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => fetchRepairJob(id!),
    enabled: Boolean(id),
  })
}

export function useCreateRepairJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RepairJobFormValues) => createRepairJob(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Job card created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateRepairJobStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateRepairJobStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Job card updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useMarkPickupCompleted() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pickupCompletedDate }: { id: string; pickupCompletedDate: string }) => markPickupCompleted(id, pickupCompletedDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Pickup marked complete')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteRepairJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRepairJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Job card deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
