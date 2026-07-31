import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createCustomer, deleteAllCustomers, deleteCustomer, fetchCustomers, updateCustomer } from '@/features/sales/api/sales-api'
import type { CustomerFormValues } from '@/features/sales/schemas/sales-schemas'

const KEY = 'customers'

export function useCustomers() {
  return useQuery({ queryKey: [KEY], queryFn: fetchCustomers })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CustomerFormValues) => createCustomer(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Customer created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CustomerFormValues> & { is_active?: boolean } }) => updateCustomer(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Customer updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Customer deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteAllCustomers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAllCustomers,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}
