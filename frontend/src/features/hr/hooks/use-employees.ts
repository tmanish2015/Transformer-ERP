import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createEmployee, deleteEmployee, fetchEmployees, updateEmployee } from '@/features/hr/api/hr-api'
import type { EmployeeFormValues } from '@/features/hr/schemas/hr-schemas'

const KEY = 'employees'

export function useEmployees() {
  return useQuery({ queryKey: [KEY], queryFn: fetchEmployees })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: EmployeeFormValues) => createEmployee(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Employee added')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<EmployeeFormValues> & { is_active?: boolean } }) => updateEmployee(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Employee updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Employee deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
