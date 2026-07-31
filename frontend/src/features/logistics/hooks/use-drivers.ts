import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createDriver, deleteDriver, fetchDrivers, updateDriver } from '@/features/logistics/api/logistics-api'
import type { DriverFormValues } from '@/features/logistics/schemas/logistics-schemas'

const KEY = 'drivers'

export function useDrivers() {
  return useQuery({ queryKey: [KEY], queryFn: fetchDrivers })
}

export function useCreateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: DriverFormValues) => createDriver(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Driver added')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<DriverFormValues> & { is_active?: boolean } }) => updateDriver(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Driver updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Driver deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
