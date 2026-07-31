import { createLookupHooks } from '@/features/inventory/hooks/use-lookup-crud'

const hooks = createLookupHooks('brands', 'inventory-brands', 'Brand')

export const useBrands = hooks.useList
export const useCreateBrand = hooks.useCreate
export const useUpdateBrand = hooks.useUpdate
export const useDeleteBrand = hooks.useRemove
