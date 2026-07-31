import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createSerialNumber, deleteSerialNumber, fetchSerialNumbers, updateSerialNumberStatus } from '@/features/inventory/api/serial-numbers-api'
import type { SerialNumberFormValues } from '@/features/inventory/schemas/inventory-schemas'

const SERIAL_NUMBERS_KEY = 'inventory-serial-numbers'

export function useSerialNumbers() {
  return useQuery({ queryKey: [SERIAL_NUMBERS_KEY], queryFn: fetchSerialNumbers })
}

export function useCreateSerialNumber() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SerialNumberFormValues) => createSerialNumber(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERIAL_NUMBERS_KEY] })
      toast.success('Serial number added')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateSerialNumberStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateSerialNumberStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERIAL_NUMBERS_KEY] })
      toast.success('Status updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteSerialNumber() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSerialNumber(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERIAL_NUMBERS_KEY] })
      toast.success('Serial number deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
