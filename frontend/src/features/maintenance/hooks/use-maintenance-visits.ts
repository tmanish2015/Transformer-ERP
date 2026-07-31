import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createMaintenanceVisit, fetchVisitsForSchedule } from '@/features/maintenance/api/maintenance-api'
import type { MaintenanceVisitFormValues } from '@/features/maintenance/schemas/maintenance-schemas'

export function useVisitsForSchedule(scheduleId: string | undefined) {
  return useQuery({
    queryKey: ['maintenance-visits', scheduleId],
    queryFn: () => fetchVisitsForSchedule(scheduleId!),
    enabled: Boolean(scheduleId),
  })
}

export function useCreateMaintenanceVisit(scheduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: MaintenanceVisitFormValues) => createMaintenanceVisit(scheduleId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-visits', scheduleId] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] })
      toast.success('Visit logged')
    },
    onError: (error) => toast.error(error.message),
  })
}
