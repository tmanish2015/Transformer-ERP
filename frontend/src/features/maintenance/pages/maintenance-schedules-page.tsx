import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CalendarClock, ClipboardList, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMaintenanceSchedules } from '@/features/maintenance/hooks/use-maintenance-schedules'
import { MaintenanceScheduleFormDialog } from '@/features/maintenance/components/maintenance-schedule-form-dialog'
import { MaintenanceVisitDialog } from '@/features/maintenance/components/maintenance-visit-dialog'
import type { MaintenanceSchedule } from '@/features/maintenance/types/maintenance-types'
import { useRentalAssets } from '@/features/rental/hooks/use-rental-assets'
import { useAuth } from '@/providers/auth-provider'

export function MaintenanceSchedulesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('maintenance.manage')

  const { data: schedules, isLoading } = useMaintenanceSchedules('rental_asset')
  const { data: assets } = useRentalAssets()
  const assetsById = useMemo(() => new Map((assets ?? []).map((a) => [a.id, a])), [assets])

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [visitScheduleId, setVisitScheduleId] = useState<string | null>(null)

  const columns: ColumnDef<MaintenanceSchedule>[] = [
    {
      id: 'asset',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Asset" />,
      cell: ({ row }) => {
        const asset = assetsById.get(row.original.reference_id)
        return asset ? `${asset.asset_code} — ${asset.name}` : <span className="text-muted-foreground">Unknown asset</span>
      },
    },
    { accessorKey: 'frequency_days', header: 'Frequency (days)' },
    {
      id: 'next_due_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Next Due" />,
      accessorFn: (row) => row.next_due_at,
      cell: ({ row }) => {
        const dueDate = new Date(row.original.next_due_at)
        const isOverdue = dueDate.getTime() < Date.now()
        return <span className={isOverdue ? 'font-medium text-chart-critical' : 'text-foreground'}>{dueDate.toLocaleDateString()}</span>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => setVisitScheduleId(row.original.id)}>
          <ClipboardList className="size-4" /> Visits
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Schedules"
        description="Recurring maintenance for rental assets."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Schedule
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={schedules ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search schedules..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={CalendarClock} title="No maintenance schedules yet" description="Set up a recurring maintenance schedule for a rental asset." />}
      />

      <MaintenanceScheduleFormDialog open={formOpen} onOpenChange={setFormOpen} />
      {visitScheduleId && <MaintenanceVisitDialog open={Boolean(visitScheduleId)} onOpenChange={(open) => !open && setVisitScheduleId(null)} scheduleId={visitScheduleId} />}
    </div>
  )
}
