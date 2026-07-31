import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createMaintenanceSchedule, fetchMaintenanceSchedules } from '@/features/maintenance/api/maintenance-api'
import type { MaintenanceScheduleFormValues } from '@/features/maintenance/schemas/maintenance-schemas'

const KEY = 'maintenance-schedules'

export function useMaintenanceSchedules(referenceType: string) {
  return useQuery({ queryKey: [KEY, referenceType], queryFn: () => fetchMaintenanceSchedules(referenceType) })
}

export function useCreateMaintenanceSchedule(referenceType: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: MaintenanceScheduleFormValues) => createMaintenanceSchedule(referenceType, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, referenceType] })
      toast.success('Maintenance schedule created')
    },
    onError: (error) => toast.error(error.message),
  })
}
