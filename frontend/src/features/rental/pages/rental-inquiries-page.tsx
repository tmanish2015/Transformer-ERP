import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { MessageSquareText, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRentalInquiries } from '@/features/rental/hooks/use-rental-inquiries'
import { RentalInquiryFormDialog } from '@/features/rental/components/rental-inquiry-form-dialog'
import { RENTAL_INQUIRY_STATUS_LABELS, type RentalInquiryWithRelations } from '@/features/rental/types/rental-types'
import { useAuth } from '@/providers/auth-provider'

export function RentalInquiriesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('rental.manage')
  const navigate = useNavigate()

  const { data: inquiries, isLoading } = useRentalInquiries()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const columns: ColumnDef<RentalInquiryWithRelations>[] = [
    { id: 'inquiry_number', header: ({ column }) => <DataTableColumnHeader column={column} title="Inquiry #" />, accessorFn: (row) => row.inquiry_number },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    { id: 'category', header: 'Category', cell: ({ row }) => row.original.category?.name ?? <span className="text-muted-foreground">—</span> },
    { id: 'requirement', header: 'Requirement', cell: ({ row }) => <span className="line-clamp-1 max-w-xs">{row.original.requirement}</span> },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={RENTAL_INQUIRY_STATUS_LABELS[row.original.status as keyof typeof RENTAL_INQUIRY_STATUS_LABELS]} />,
    },
    {
      id: 'actions',
      cell: ({ row }) =>
        canManage &&
        row.original.status === 'open' && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/rental/quotations?inquiry=${row.original.id}`)
            }}
          >
            Quote
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rental Inquiries"
        description="Customer requests for rental equipment."
        actions={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New Inquiry
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={inquiries ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search inquiries..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={MessageSquareText} title="No inquiries yet" description="Capture a customer's rental requirement to get started." />}
      />

      <RentalInquiryFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
