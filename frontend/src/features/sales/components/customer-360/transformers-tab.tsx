import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Zap } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomer360Transformers } from '@/features/sales/hooks/use-customer-360'
import { TRANSFORMER_STATUS_LABELS, type TransformerWithCustomer } from '@/features/transformer/types/transformer-types'

interface TransformersTabProps {
  customerId: string
  active: boolean
}

const columns: ColumnDef<TransformerWithCustomer>[] = [
  { accessorKey: 'registration_no', header: 'Asset No.' },
  { accessorKey: 'capacity_kva', header: 'Capacity (kVA)', cell: ({ row }) => row.original.capacity_kva ?? 'Not available' },
  { accessorKey: 'make', header: 'Type / Make', cell: ({ row }) => [row.original.make, row.original.model].filter(Boolean).join(' / ') || 'Not available' },
  {
    accessorKey: 'current_status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.current_status as keyof typeof TRANSFORMER_STATUS_LABELS
      return <StatusBadge status={status} label={TRANSFORMER_STATUS_LABELS[status] ?? status} />
    },
  },
  { accessorKey: 'location', header: 'Location', cell: ({ row }) => row.original.location ?? 'Not available' },
]

export function TransformersTab({ customerId, active }: TransformersTabProps) {
  const { data: transformers, isLoading } = useCustomer360Transformers(customerId, active)

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of transformers ?? []) counts[t.current_status] = (counts[t.current_status] ?? 0) + 1
    return counts
  }, [transformers])

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />

  if ((transformers ?? []).length === 0) {
    return <EmptyState icon={Zap} title="No transformers on record" description="This customer has no transformers registered yet." />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
            <StatusBadge status={status} label={TRANSFORMER_STATUS_LABELS[status as keyof typeof TRANSFORMER_STATUS_LABELS] ?? status} />
            <span className="font-medium text-foreground">{count}</span>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={transformers ?? []} />
    </div>
  )
}
