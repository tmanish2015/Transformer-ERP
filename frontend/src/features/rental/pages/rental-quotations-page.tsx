import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { FileText, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRentalQuotations } from '@/features/rental/hooks/use-rental-quotations'
import { RentalQuotationFormDialog } from '@/features/rental/components/rental-quotation-form-dialog'
import { RentalQuotationDetailSheet } from '@/features/rental/components/rental-quotation-detail-sheet'
import { RENTAL_QUOTATION_STATUS_LABELS, type RentalQuotationWithRelations } from '@/features/rental/types/rental-types'
import { useAuth } from '@/providers/auth-provider'

export function RentalQuotationsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('rental.manage')
  const [searchParams, setSearchParams] = useSearchParams()
  const presetInquiryId = searchParams.get('inquiry') ?? undefined

  const { data: quotations, isLoading } = useRentalQuotations()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(Boolean(presetInquiryId))
  const [selectedQuotation, setSelectedQuotation] = useState<RentalQuotationWithRelations | null>(null)

  const columns: ColumnDef<RentalQuotationWithRelations>[] = [
    { id: 'quotation_number', header: ({ column }) => <DataTableColumnHeader column={column} title="Quotation #" />, accessorFn: (row) => row.quotation_number },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    {
      id: 'quotation_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      accessorFn: (row) => row.quotation_date,
      cell: ({ row }) => new Date(row.original.quotation_date).toLocaleDateString(),
    },
    { id: 'total', header: 'Total', cell: ({ row }) => `₹${row.original.total.toLocaleString('en-IN')}` },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={RENTAL_QUOTATION_STATUS_LABELS[row.original.status as keyof typeof RENTAL_QUOTATION_STATUS_LABELS]} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rental Quotations"
        description="Quote rental assets for customers and inquiries."
        actions={
          canManage && (
            <Button
              onClick={() => {
                setFormOpen(true)
              }}
            >
              <Plus /> New Quotation
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={quotations ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        onRowClick={(row) => setSelectedQuotation(row)}
        toolbar={() => <Input placeholder="Search quotations..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={FileText} title="No quotations yet" description="Create a quotation for a customer or from an open inquiry." />}
      />

      <RentalQuotationFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open && presetInquiryId) setSearchParams({})
        }}
        presetInquiryId={presetInquiryId}
      />
      <RentalQuotationDetailSheet open={Boolean(selectedQuotation)} onOpenChange={(open) => !open && setSelectedQuotation(null)} quotation={selectedQuotation} />
    </div>
  )
}
