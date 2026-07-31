import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRentalAssetCategory, deleteRentalAssetCategory, fetchRentalAssetCategories, updateRentalAssetCategory } from '@/features/rental/api/rental-api'
import type { RentalAssetCategoryFormValues } from '@/features/rental/schemas/rental-schemas'

const KEY = 'rental-asset-categories'

export function useRentalAssetCategories() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRentalAssetCategories })
}

export function useCreateRentalAssetCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RentalAssetCategoryFormValues) => createRentalAssetCategory(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Category created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateRentalAssetCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<RentalAssetCategoryFormValues> & { is_active?: boolean } }) => updateRentalAssetCategory(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Category updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteRentalAssetCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRentalAssetCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Category deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
