import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { FileSignature } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Input } from '@/components/ui/input'
import { useRentalAgreements } from '@/features/rental/hooks/use-rental-agreements'
import { RENTAL_AGREEMENT_STATUS_LABELS, RENTAL_ASSET_STATUS_LABELS, type RentalAgreementWithRelations } from '@/features/rental/types/rental-types'

export function RentalAgreementsPage() {
  const navigate = useNavigate()
  const { data: agreements, isLoading } = useRentalAgreements()
  const [search, setSearch] = useState('')

  const columns: ColumnDef<RentalAgreementWithRelations>[] = [
    {
      id: 'agreement_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Agreement #" />,
      accessorFn: (row) => row.agreement_number,
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline" onClick={() => navigate(`/rental/agreements/${row.original.id}`)}>
          {row.original.agreement_number}
        </button>
      ),
    },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    { id: 'asset', header: 'Asset', cell: ({ row }) => `${row.original.rental_asset.asset_code} — ${row.original.rental_asset.name}` },
    {
      id: 'dates',
      header: 'Dates',
      cell: ({ row }) => `${new Date(row.original.start_date).toLocaleDateString()} – ${new Date(row.original.end_date).toLocaleDateString()}`,
    },
    {
      id: 'asset_status',
      header: 'Asset Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.rental_asset.status} label={RENTAL_ASSET_STATUS_LABELS[row.original.rental_asset.status as keyof typeof RENTAL_ASSET_STATUS_LABELS]} />
      ),
    },
    {
      id: 'status',
      header: 'Agreement Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={RENTAL_AGREEMENT_STATUS_LABELS[row.original.status as keyof typeof RENTAL_AGREEMENT_STATUS_LABELS]} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Rental Agreements" description="Active and past rental contracts." />

      <DataTable
        columns={columns}
        data={agreements ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        onRowClick={(row) => navigate(`/rental/agreements/${row.id}`)}
        toolbar={() => <Input placeholder="Search agreements..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={FileSignature} title="No agreements yet" description="Create one from a confirmed booking." />}
      />
    </div>
  )
}
