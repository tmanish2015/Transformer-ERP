import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createExpense, fetchExpenses } from '@/features/finance/api/finance-api'
import type { ExpenseFormValues } from '@/features/finance/schemas/finance-schemas'

const KEY = 'expenses'

export function useExpenses() {
  return useQuery({ queryKey: [KEY], queryFn: fetchExpenses })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ values, createdBy }: { values: ExpenseFormValues; createdBy: string }) => createExpense(values, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-lines'] })
      toast.success('Expense recorded')
    },
    onError: (error) => toast.error(error.message),
  })
}
