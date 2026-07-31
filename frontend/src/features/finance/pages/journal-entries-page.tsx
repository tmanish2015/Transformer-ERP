import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { BookText, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useJournalEntries } from '@/features/finance/hooks/use-journal-entries'
import { JournalEntryFormDrawer } from '@/features/finance/components/journal-entry-form-drawer'
import { JournalEntryDetailSheet } from '@/features/finance/components/journal-entry-detail-sheet'
import { APPROVAL_STATUS_LABELS, JOURNAL_STATUS_LABELS, VOUCHER_TYPE_LABELS, type JournalEntry } from '@/features/finance/types/finance-types'
import { useAuth } from '@/providers/auth-provider'

export function JournalEntriesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('finance.manage')

  const { data: entries, isLoading } = useJournalEntries()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>()

  const filtered = useMemo(() => (entries ?? []).filter((e) => (typeFilter === 'all' ? true : e.voucher_type === typeFilter)), [entries, typeFilter])

  const columns: ColumnDef<JournalEntry>[] = [
    {
      id: 'entry_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Entry #" />,
      accessorFn: (row) => row.entry_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => setSelectedId(row.original.id)}>
          {row.original.entry_number}
        </button>
      ),
    },
    {
      id: 'entry_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      accessorFn: (row) => row.entry_date,
      cell: ({ row }) => new Date(row.original.entry_date).toLocaleDateString(),
    },
    { id: 'narration', header: 'Narration', cell: ({ row }) => row.original.narration || '—' },
    {
      id: 'voucher_type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="outline">{VOUCHER_TYPE_LABELS[row.original.voucher_type as keyof typeof VOUCHER_TYPE_LABELS]}</Badge>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={JOURNAL_STATUS_LABELS[row.original.status as keyof typeof JOURNAL_STATUS_LABELS]} />,
    },
    {
      id: 'approval_status',
      header: 'Approval',
      cell: ({ row }) => <StatusBadge status={row.original.approval_status} label={APPROVAL_STATUS_LABELS[row.original.approval_status as keyof typeof APPROVAL_STATUS_LABELS]} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Entries"
        description="Manual double-entry vouchers with approval workflow."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Journal Entry
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Voucher Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(VOUCHER_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={BookText} title="No journal entries yet" description="Post your first manual journal entry." />}
      />

      <JournalEntryFormDrawer open={formOpen} onOpenChange={setFormOpen} />
      <JournalEntryDetailSheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(undefined)} entryId={selectedId} />
    </div>
  )
}
