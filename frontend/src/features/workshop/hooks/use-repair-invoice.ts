import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createRepairInvoice, fetchInvoiceForRepairJob } from '@/features/workshop/api/workshop-api'

export function useInvoiceForRepairJob(repairJobId: string | undefined) {
  return useQuery({
    queryKey: ['repair-job-invoice', repairJobId],
    queryFn: () => fetchInvoiceForRepairJob(repairJobId!),
    enabled: Boolean(repairJobId),
  })
}

export function useCreateRepairInvoice(repairJobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => createRepairInvoice(repairJobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-job-invoice', repairJobId] })
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-lines'] })
      toast.success('Repair invoice created and posted to the ledger')
    },
    onError: (error) => toast.error(error.message),
  })
}
