import { createLookupHooks } from '@/features/inventory/hooks/use-lookup-crud'

const hooks = createLookupHooks('suppliers', 'inventory-suppliers', 'Supplier')

export const useSuppliers = hooks.useList
export const useCreateSupplier = hooks.useCreate
export const useUpdateSupplier = hooks.useUpdate
export const useDeleteSupplier = hooks.useRemove
