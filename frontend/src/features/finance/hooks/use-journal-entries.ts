import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { approveJournalEntry, cancelJournalEntry, createJournalEntry, fetchJournalEntries, fetchJournalEntryDetail, rejectJournalEntry } from '@/features/finance/api/finance-api'
import type { JournalEntryFormValues } from '@/features/finance/schemas/finance-schemas'

const KEY = 'journal-entries'
const LEDGER_KEY = 'ledger-lines'

export function useJournalEntries() {
  return useQuery({ queryKey: [KEY], queryFn: fetchJournalEntries })
}

export function useJournalEntryDetail(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => fetchJournalEntryDetail(id!),
    enabled: Boolean(id),
  })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [KEY] })
  queryClient.invalidateQueries({ queryKey: [LEDGER_KEY] })
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ values, createdBy }: { values: JournalEntryFormValues; createdBy: string }) => createJournalEntry(values, createdBy),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Journal entry posted')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useApproveJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => approveJournalEntry(id, approvedBy),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Journal entry approved')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useRejectJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rejectJournalEntry(id),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Journal entry rejected')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useCancelJournalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelJournalEntry(id),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Journal entry cancelled')
    },
    onError: (error) => toast.error(error.message),
  })
}
