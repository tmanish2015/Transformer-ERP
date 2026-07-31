import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createLookupApi } from '@/features/inventory/api/lookup-api'
import type { Database } from '@/types/database.types'

type LookupTable = 'units' | 'categories' | 'brands' | 'warehouses' | 'suppliers'
type Insert<T extends LookupTable> = Database['public']['Tables'][T]['Insert']
type Update<T extends LookupTable> = Database['public']['Tables'][T]['Update']

export function createLookupHooks<T extends LookupTable>(table: T, queryKey: string, entityLabel: string, orderBy = 'name') {
  const api = createLookupApi(table, orderBy)

  function useList() {
    return useQuery({ queryKey: [queryKey], queryFn: api.list })
  }

  function useCreate() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (values: Insert<T>) => api.create(values),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
        toast.success(`${entityLabel} created`)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  function useUpdate() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, values }: { id: string; values: Update<T> }) => api.update(id, values),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
        toast.success(`${entityLabel} updated`)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  function useRemove() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => api.remove(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
        toast.success(`${entityLabel} deleted`)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  function useRemoveAll() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => api.removeAll(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      },
    })
  }

  return { useList, useCreate, useUpdate, useRemove, useRemoveAll }
}
