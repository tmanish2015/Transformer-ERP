import { createLookupHooks } from '@/features/inventory/hooks/use-lookup-crud'

const hooks = createLookupHooks('units', 'inventory-units', 'Unit')

export const useUnits = hooks.useList
export const useCreateUnit = hooks.useCreate
export const useUpdateUnit = hooks.useUpdate
export const useDeleteUnit = hooks.useRemove
