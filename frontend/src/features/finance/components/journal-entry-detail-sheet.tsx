import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/shared/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useJournalEntryDetail, useApproveJournalEntry, useCancelJournalEntry, useRejectJournalEntry } from '@/features/finance/hooks/use-journal-entries'
import { APPROVAL_STATUS_LABELS, JOURNAL_STATUS_LABELS, VOUCHER_TYPE_LABELS } from '@/features/finance/types/finance-types'
import { useAuth } from '@/providers/auth-provider'

interface JournalEntryDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryId: string | undefined
}

export function JournalEntryDetailSheet({ open, onOpenChange, entryId }: JournalEntryDetailSheetProps) {
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission('finance.manage')
  const { data: entry, isLoading } = useJournalEntryDetail(entryId)
  const approveEntry = useApproveJournalEntry()
  const rejectEntry = useRejectJournalEntry()
  const cancelEntry = useCancelJournalEntry()

  const totalDebit = entry?.lines.reduce((s, l) => s + l.debit, 0) ?? 0
  const totalCredit = entry?.lines.reduce((s, l) => s + l.credit, 0) ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{entry?.entry_number ?? 'Journal Entry'}</DialogTitle>
          <DialogDescription>{entry ? VOUCHER_TYPE_LABELS[entry.voucher_type as keyof typeof VOUCHER_TYPE_LABELS] : ''} voucher detail</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading || !entry ? (
            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <StatusBadge status={entry.status} label={JOURNAL_STATUS_LABELS[entry.status as keyof typeof JOURNAL_STATUS_LABELS]} />
                <span className="text-sm text-muted-foreground">{new Date(entry.entry_date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approval</span>
                <StatusBadge status={entry.approval_status} label={APPROVAL_STATUS_LABELS[entry.approval_status as keyof typeof APPROVAL_STATUS_LABELS]} />
              </div>

              {entry.narration && <p className="rounded-lg bg-muted/40 p-3 text-sm text-foreground">{entry.narration}</p>}

              <Separator />

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{line.account.name}</p>
                          <p className="text-xs text-muted-foreground">{line.account.code}</p>
                        </TableCell>
                        <TableCell className="text-right">{line.debit > 0 ? `₹${line.debit.toLocaleString('en-IN')}` : '—'}</TableCell>
                        <TableCell className="text-right">{line.credit > 0 ? `₹${line.credit.toLocaleString('en-IN')}` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-end gap-6 text-sm font-medium">
                <span>Total Debit: ₹{totalDebit.toLocaleString('en-IN')}</span>
                <span>Total Credit: ₹{totalCredit.toLocaleString('en-IN')}</span>
              </div>

              {canManage && entry.status !== 'cancelled' && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {entry.approval_status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => user && approveEntry.mutate({ id: entry.id, approvedBy: user.id })}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectEntry.mutate(entry.id)}>
                          Reject
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => cancelEntry.mutate(entry.id)}>
                      Cancel Entry
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
