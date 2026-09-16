import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CalendarCheck, FileSignature, IndianRupee, Loader2, Pencil, PackageCheck, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCancelRentalBooking, useInvoicedBookingIds, useRentalBookings } from '@/features/rental/hooks/use-rental-bookings'
import { useRentalAgreements } from '@/features/rental/hooks/use-rental-agreements'
import { RentalBookingFormDialog } from '@/features/rental/components/rental-booking-form-dialog'
import { RentalBookingEditDialog } from '@/features/rental/components/rental-booking-edit-dialog'
import { RentalAgreementFormDialog } from '@/features/rental/components/rental-agreement-form-dialog'
import { RentalBookingInvoiceDialog } from '@/features/rental/components/rental-booking-invoice-dialog'
import { RentalBookingReturnDialog } from '@/features/rental/components/rental-booking-return-dialog'
import { RENTAL_BOOKING_STATUS_LABELS, type RentalBookingWithRelations } from '@/features/rental/types/rental-types'
import { useAuth } from '@/providers/auth-provider'

export function RentalBookingsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('rental.manage')
  // Distinct from rental.manage (also held by Rental Coordinator, who can
  // cancel/return/invoice) -- editing a booking's own fields is admin-only.
  const canEdit = hasPermission('rental.booking.edit')
  const navigate = useNavigate()

  const { data: bookings, isLoading } = useRentalBookings()
  const { data: invoicedIds } = useInvoicedBookingIds()
  const { data: agreements } = useRentalAgreements()
  const cancelBooking = useCancelRentalBooking()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [agreementBooking, setAgreementBooking] = useState<RentalBookingWithRelations | null>(null)
  const [invoiceBooking, setInvoiceBooking] = useState<RentalBookingWithRelations | null>(null)
  const [returnBooking, setReturnBooking] = useState<RentalBookingWithRelations | null>(null)
  const [editBooking, setEditBooking] = useState<RentalBookingWithRelations | null>(null)

  // Bookings that already have a rental agreement -- editing customer/asset/start
  // date on these would desync from the agreement's own recorded terms, so the
  // edit dialog locks those three fields (server-enforced too, via the trigger).
  const agreementBookingIds = new Set((agreements ?? []).map((a) => a.rental_booking_id))

  const columns: ColumnDef<RentalBookingWithRelations>[] = [
    { id: 'booking_number', header: ({ column }) => <DataTableColumnHeader column={column} title="Booking #" />, accessorFn: (row) => row.booking_number },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.customer.name },
    { id: 'asset', header: 'Asset', cell: ({ row }) => `${row.original.rental_asset.asset_code} — ${row.original.rental_asset.name}` },
    { id: 'location_from', header: 'From', cell: ({ row }) => row.original.location_from || <span className="text-muted-foreground">—</span> },
    { id: 'destination', header: 'Destination', cell: ({ row }) => row.original.destination || <span className="text-muted-foreground">—</span> },
    {
      id: 'dates',
      header: 'Dates',
      cell: ({ row }) =>
        `${new Date(row.original.start_date).toLocaleDateString()} – ${row.original.end_date ? new Date(row.original.end_date).toLocaleDateString() : 'Open'}`,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} label={RENTAL_BOOKING_STATUS_LABELS[row.original.status as keyof typeof RENTAL_BOOKING_STATUS_LABELS]} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        if (!canManage) return null
        if (row.original.status === 'confirmed') {
          return (
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditBooking(row.original)}>
                  <Pencil className="size-4" /> Edit
                </Button>
              )}
              {row.original.end_date && (
                <Button variant="outline" size="sm" onClick={() => setAgreementBooking(row.original)}>
                  <FileSignature className="size-4" /> Create Agreement
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setReturnBooking(row.original)}>
                <PackageCheck className="size-4" /> Return Machine
              </Button>
              <Button variant="outline" size="sm" disabled={cancelBooking.isPending} onClick={() => cancelBooking.mutate(row.original.id)}>
                {cancelBooking.isPending && <Loader2 className="size-4 animate-spin" />}
                Cancel
              </Button>
            </div>
          )
        }
        if (row.original.status === 'completed' && !invoicedIds?.has(row.original.id)) {
          return (
            <Button variant="outline" size="sm" onClick={() => setInvoiceBooking(row.original)}>
              <IndianRupee className="size-4" /> Generate Invoice
            </Button>
          )
        }
        return null
      },
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
      <RentalBookingInvoiceDialog open={Boolean(invoiceBooking)} onOpenChange={(open) => !open && setInvoiceBooking(null)} booking={invoiceBooking} />
      <RentalBookingReturnDialog open={Boolean(returnBooking)} onOpenChange={(open) => !open && setReturnBooking(null)} booking={returnBooking} />
      <RentalBookingEditDialog
        open={Boolean(editBooking)}
        onOpenChange={(open) => !open && setEditBooking(null)}
        booking={editBooking}
        locked={editBooking ? agreementBookingIds.has(editBooking.id) || invoicedIds?.has(editBooking.id) === true : false}
      />
    </div>
  )
}
