import { createLookupHooks } from '@/features/inventory/hooks/use-lookup-crud'

const hooks = createLookupHooks('warehouses', 'inventory-warehouses', 'Warehouse')

export const useWarehouses = hooks.useList
export const useCreateWarehouse = hooks.useCreate
export const useUpdateWarehouse = hooks.useUpdate
export const useDeleteWarehouse = hooks.useRemove
