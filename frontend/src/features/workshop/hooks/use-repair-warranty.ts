import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRepairWarranty, fetchRepairWarranty } from '@/features/workshop/api/workshop-api'
import type { RepairWarrantyFormValues } from '@/features/workshop/schemas/workshop-schemas'

export function useRepairWarranty(repairJobId: string | undefined) {
  return useQuery({
    queryKey: ['repair-warranty', repairJobId],
    queryFn: () => fetchRepairWarranty(repairJobId!),
    enabled: Boolean(repairJobId),
  })
}

export function useCreateRepairWarranty(repairJobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RepairWarrantyFormValues) => createRepairWarranty(repairJobId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-warranty', repairJobId] })
      toast.success('Warranty recorded')
    },
    onError: (error) => toast.error(error.message),
  })
}
