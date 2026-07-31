import { createLookupHooks } from '@/features/inventory/hooks/use-lookup-crud'

const hooks = createLookupHooks('categories', 'inventory-categories', 'Category')

export const useCategories = hooks.useList
export const useCreateCategory = hooks.useCreate
export const useUpdateCategory = hooks.useUpdate
export const useDeleteCategory = hooks.useRemove
