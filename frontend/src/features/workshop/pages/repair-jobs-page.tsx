import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRepairJobs } from '@/features/workshop/hooks/use-repair-jobs'
import { RepairJobFormDialog } from '@/features/workshop/components/repair-job-form-dialog'
import { REPAIR_JOB_STATUS_LABELS, type RepairJobWithRelations } from '@/features/workshop/types/workshop-types'
import { useAuth } from '@/providers/auth-provider'

export function RepairJobsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('workshop.manage')
  const navigate = useNavigate()

  const { data: jobs, isLoading } = useRepairJobs()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)

  const filtered = useMemo(() => (jobs ?? []).filter((j) => (statusFilter === 'all' ? true : j.status === statusFilter)), [jobs, statusFilter])

  const columns: ColumnDef<RepairJobWithRelations>[] = [
    {
      id: 'job_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Job #" />,
      accessorFn: (row) => row.job_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => navigate(`/workshop/jobs/${row.original.id}`)}>
          {row.original.job_number}
        </button>
      ),
    },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    {
      id: 'transformer',
      header: 'Transformer',
      cell: ({ row }) => [row.original.transformer_make, row.original.transformer_model].filter(Boolean).join(' ') || <span className="text-muted-foreground">—</span>,
    },
    { id: 'complaint', header: 'Complaint', cell: ({ row }) => <span className="line-clamp-1 max-w-xs">{row.original.complaint}</span> },
    {
      id: 'pickup_required',
      header: 'Pickup',
      cell: ({ row }) => (row.original.pickup_required ? (row.original.pickup_completed_date ? 'Collected' : 'Pending') : <span className="text-muted-foreground">—</span>),
    },
    {
      id: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Received" />,
      accessorFn: (row) => row.created_at,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={REPAIR_JOB_STATUS_LABELS[row.original.status as keyof typeof REPAIR_JOB_STATUS_LABELS]} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair Job Cards"
        description="Track transformer repair jobs from intake to completion."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Job Card
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
        onRowClick={(row) => navigate(`/workshop/jobs/${row.id}`)}
        toolbar={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search job cards..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(REPAIR_JOB_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={Wrench} title="No job cards yet" description="Open your first repair job card to start tracking a customer's transformer." />}
      />

      <RepairJobFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
