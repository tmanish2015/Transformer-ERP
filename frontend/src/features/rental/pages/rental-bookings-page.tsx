import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CalendarCheck, FileSignature, Loader2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCancelRentalBooking, useRentalBookings } from '@/features/rental/hooks/use-rental-bookings'
import { RentalBookingFormDialog } from '@/features/rental/components/rental-booking-form-dialog'
import { RentalAgreementFormDialog } from '@/features/rental/components/rental-agreement-form-dialog'
import { RENTAL_BOOKING_STATUS_LABELS, type RentalBookingWithRelations } from '@/features/rental/types/rental-types'
import { useAuth } from '@/providers/auth-provider'

export function RentalBookingsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('rental.manage')
  const navigate = useNavigate()

  const { data: bookings, isLoading } = useRentalBookings()
  const cancelBooking = useCancelRentalBooking()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [agreementBooking, setAgreementBooking] = useState<RentalBookingWithRelations | null>(null)

  const columns: ColumnDef<RentalBookingWithRelations>[] = [
    { id: 'booking_number', header: ({ column }) => <DataTableColumnHeader column={column} title="Booking #" />, accessorFn: (row) => row.booking_number },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    { id: 'asset', header: 'Asset', cell: ({ row }) => `${row.original.rental_asset.asset_code} — ${row.original.rental_asset.name}` },
    {
      id: 'dates',
      header: 'Dates',
      cell: ({ row }) => `${new Date(row.original.start_date).toLocaleDateString()} – ${new Date(row.original.end_date).toLocaleDateString()}`,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={RENTAL_BOOKING_STATUS_LABELS[row.original.status as keyof typeof RENTAL_BOOKING_STATUS_LABELS]} />,
    },
    {
      id: 'actions',
      cell: ({ row }) =>
        canManage &&
        row.original.status === 'confirmed' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAgreementBooking(row.original)}>
              <FileSignature className="size-4" /> Create Agreement
            </Button>
            <Button variant="outline" size="sm" disabled={cancelBooking.isPending} onClick={() => cancelBooking.mutate(row.original.id)}>
              {cancelBooking.isPending && <Loader2 className="size-4 animate-spin" />}
              Cancel
            </Button>
          </div>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rental Bookings"
        description="Confirmed asset reservations."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/rental/agreements')}>
              <FileSignature /> View Agreements
            </Button>
            {canManage && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus /> New Booking
              </Button>
            )}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={bookings ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={CalendarCheck} title="No bookings yet" description="Book an available asset directly, or from a rental quotation." />}
      />

      <RentalBookingFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <RentalAgreementFormDialog open={Boolean(agreementBooking)} onOpenChange={(open) => !open && setAgreementBooking(null)} booking={agreementBooking} />
    </div>
  )
}
