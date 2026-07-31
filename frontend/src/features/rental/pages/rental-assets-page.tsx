import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Truck } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRentalAssets } from '@/features/rental/hooks/use-rental-assets'
import { RentalAssetFormDialog } from '@/features/rental/components/rental-asset-form-dialog'
import { RENTAL_ASSET_STATUS_LABELS, type RentalAssetWithCategory } from '@/features/rental/types/rental-types'
import { useAuth } from '@/providers/auth-provider'

export function RentalAssetsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('rental.manage')
  const navigate = useNavigate()

  const { data: assets, isLoading } = useRentalAssets()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)

  const filtered = (assets ?? []).filter((a) => (statusFilter === 'all' ? true : a.status === statusFilter))

  const columns: ColumnDef<RentalAssetWithCategory>[] = [
    {
      id: 'asset_code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Asset Code" />,
      accessorFn: (row) => row.asset_code,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => navigate(`/rental/assets/${row.original.id}`)}>
          {row.original.asset_code}
        </button>
      ),
    },
    { accessorKey: 'name', header: 'Name' },
    { id: 'category', header: 'Category', cell: ({ row }) => row.original.category?.name ?? <span className="text-muted-foreground">—</span> },
    { id: 'location', header: 'Location', cell: ({ row }) => row.original.current_location ?? <span className="text-muted-foreground">—</span> },
    {
      id: 'daily_rental_rate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Daily Rate" />,
      accessorFn: (row) => row.daily_rental_rate,
      cell: ({ row }) => `₹${row.original.daily_rental_rate.toLocaleString('en-IN')}`,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={RENTAL_ASSET_STATUS_LABELS[row.original.status as keyof typeof RENTAL_ASSET_STATUS_LABELS]} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rental Assets"
        description="Machines and equipment available for rental."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Add Asset
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
        onRowClick={(row) => navigate(`/rental/assets/${row.id}`)}
        toolbar={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(RENTAL_ASSET_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        emptyState={<EmptyState icon={Truck} title="No rental assets yet" description="Add your first machine to start renting it out." />}
      />

      <RentalAssetFormDialog open={formOpen} onOpenChange={setFormOpen} asset={null} />
    </div>
  )
}
