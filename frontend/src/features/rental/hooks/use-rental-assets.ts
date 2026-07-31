import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createRentalAsset,
  deleteRentalAsset,
  fetchAllRentalAssetStatusLog,
  fetchAvailableRentalAssets,
  fetchRentalAsset,
  fetchRentalAssetStatusLog,
  fetchRentalAssets,
  updateRentalAsset,
} from '@/features/rental/api/rental-api'
import type { RentalAssetFormValues } from '@/features/rental/schemas/rental-schemas'

const KEY = 'rental-assets'

export function useRentalAssets() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRentalAssets })
}

export function useAvailableRentalAssets() {
  return useQuery({ queryKey: [KEY, 'available'], queryFn: fetchAvailableRentalAssets })
}

export function useRentalAsset(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => fetchRentalAsset(id!),
    enabled: Boolean(id),
  })
}

export function useRentalAssetStatusLog(assetId: string | undefined) {
  return useQuery({
    queryKey: [KEY, assetId, 'status-log'],
    queryFn: () => fetchRentalAssetStatusLog(assetId!),
    enabled: Boolean(assetId),
  })
}

export function useAllRentalAssetStatusLog() {
  return useQuery({ queryKey: [KEY, 'status-log', 'all'], queryFn: fetchAllRentalAssetStatusLog })
}

export function useCreateRentalAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RentalAssetFormValues) => createRentalAsset(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Rental asset added')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateRentalAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<RentalAssetFormValues> }) => updateRentalAsset(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Rental asset updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteRentalAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRentalAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Rental asset deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
