import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createVehicle, deleteVehicle, fetchVehicles, updateVehicle } from '@/features/logistics/api/logistics-api'
import type { VehicleFormValues } from '@/features/logistics/schemas/logistics-schemas'

const KEY = 'vehicles'

export function useVehicles() {
  return useQuery({ queryKey: [KEY], queryFn: fetchVehicles })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: VehicleFormValues) => createVehicle(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Vehicle added')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<VehicleFormValues> & { is_active?: boolean } }) => updateVehicle(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Vehicle updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Vehicle deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
