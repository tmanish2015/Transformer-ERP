import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createAccount, deleteAccount, fetchChartOfAccounts, updateAccount } from '@/features/finance/api/finance-api'
import type { AccountFormValues } from '@/features/finance/schemas/finance-schemas'

const KEY = 'chart-of-accounts'

export function useChartOfAccounts() {
  return useQuery({ queryKey: [KEY], queryFn: fetchChartOfAccounts })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: AccountFormValues) => createAccount(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Account created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<AccountFormValues> }) => updateAccount(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Account updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Account deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
