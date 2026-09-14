import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomer360Invoices, useCustomer360RentalAgreements, useCustomer360RentalQuotations } from '@/features/sales/hooks/use-customer-360'
import { RENTAL_AGREEMENT_STATUS_LABELS, RENTAL_BOOKING_STATUS_LABELS, RENTAL_QUOTATION_STATUS_LABELS, type RentalBookingWithRelations } from '@/features/rental/types/rental-types'

interface RentalTabProps {
  customerId: string
  active: boolean
  rentalBookings: RentalBookingWithRelations[] | undefined
}

// A booking is only "returned" once the Return Machine action flips its status to
// 'completed' -- until then it's open regardless of whatever value end_date holds,
// so days/return-date are only meaningful for non-confirmed (i.e. completed) bookings.
function rentalDays(startDate: string, endDate: string | null, status: string): number | null {
  if (status === 'confirmed' || !endDate) return null
  return Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1
}

export function RentalTab({ customerId, active, rentalBookings }: RentalTabProps) {
  const navigate = useNavigate()
  const { data: invoices } = useCustomer360Invoices(customerId)
  const { data: agreements, isLoading: agreementsLoading } = useCustomer360RentalAgreements(customerId, active)
  const { data: quotations, isLoading: quotationsLoading } = useCustomer360RentalQuotations(customerId, active)

  const activeRentals = useMemo(() => (rentalBookings ?? []).filter((b) => b.status === 'confirmed'), [rentalBookings])

  const invoiceForBooking = (bookingId: string) => (invoices ?? []).find((inv) => inv.rental_booking_id === bookingId)

  if (!rentalBookings) return <Skeleton className="h-64 w-full rounded-xl" />

  if (rentalBookings.length === 0 && (agreements ?? []).length === 0 && (quotations ?? []).length === 0) {
    return <EmptyState icon={Truck} title="No rental activity" description="This customer has no rental bookings, agreements, or quotations on record." />
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-3 text-sm font-medium text-foreground">Active Rentals</div>
        {activeRentals.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No active rentals for this customer right now.</p>
        ) : (
          <div className="divide-y divide-border">
            {activeRentals.map((b) => (
              <div key={b.id} className="grid grid-cols-2 gap-2 p-3 text-sm sm:grid-cols-5">
                <span className="text-foreground">{b.booking_number}</span>
                <span className="text-muted-foreground">{b.rental_asset?.name ?? 'Not available'}</span>
                <span className="text-muted-foreground">Start: {new Date(b.start_date).toLocaleDateString('en-IN')}</span>
                <StatusBadge status="open" label="Open / Return Date Pending" />
                <span className="text-muted-foreground">₹{b.rental_asset?.daily_rental_rate?.toLocaleString('en-IN') ?? 'Not available'}/day</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-3 text-sm font-medium text-foreground">Rental History</div>
        {(rentalBookings ?? []).length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No rental bookings recorded for this customer.</p>
        ) : (
          <div className="divide-y divide-border">
            {(rentalBookings ?? []).map((b) => {
              const isOpen = b.status === 'confirmed'
              const days = rentalDays(b.start_date, b.end_date, b.status)
              const invoice = invoiceForBooking(b.id)
              return (
                <div key={b.id} className="grid grid-cols-2 gap-2 p-3 text-sm sm:grid-cols-6">
                  <span className="text-foreground">{b.booking_number}</span>
                  <span className="text-muted-foreground">{b.rental_asset?.name ?? 'Not available'}</span>
                  <span className="text-muted-foreground">
                    {new Date(b.start_date).toLocaleDateString('en-IN')} – {!isOpen && b.end_date ? new Date(b.end_date).toLocaleDateString('en-IN') : 'Not available'}
                  </span>
                  <span className="text-muted-foreground">{isOpen ? 'Open / Return Date Pending' : days != null ? `${days} days` : 'Not available'}</span>
                  <StatusBadge status={b.status} label={RENTAL_BOOKING_STATUS_LABELS[b.status as keyof typeof RENTAL_BOOKING_STATUS_LABELS] ?? b.status} />
                  <button type="button" onClick={() => navigate('/sales/invoices')} className="text-left text-primary hover:underline disabled:text-muted-foreground disabled:no-underline" disabled={!invoice}>
                    {invoice ? `${invoice.invoice_number} · ₹${invoice.total.toLocaleString('en-IN')}` : 'Not invoiced yet'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-3 text-sm font-medium text-foreground">Rental Agreements</div>
          {agreementsLoading ? (
            <div className="p-4"><Skeleton className="h-16 w-full" /></div>
          ) : (agreements ?? []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No rental agreements recorded for this customer.</p>
          ) : (
            <div className="divide-y divide-border">
              {(agreements ?? []).map((a) => (
                <button key={a.id} type="button" onClick={() => navigate(`/rental/agreements/${a.id}`)} className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-muted/50">
                  <span className="text-foreground">{a.rental_asset?.asset_code ?? a.id}</span>
                  <StatusBadge status={a.status} label={RENTAL_AGREEMENT_STATUS_LABELS[a.status as keyof typeof RENTAL_AGREEMENT_STATUS_LABELS] ?? a.status} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-3 text-sm font-medium text-foreground">Rental Quotations</div>
          {quotationsLoading ? (
            <div className="p-4"><Skeleton className="h-16 w-full" /></div>
          ) : (quotations ?? []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No rental quotations recorded for this customer.</p>
          ) : (
            <div className="divide-y divide-border">
              {(quotations ?? []).map((q) => (
                <button key={q.id} type="button" onClick={() => navigate('/rental/quotations')} className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-muted/50">
                  <span className="text-foreground">{q.quotation_number}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">₹{q.total.toLocaleString('en-IN')}</span>
                    <StatusBadge status={q.status} label={RENTAL_QUOTATION_STATUS_LABELS[q.status as keyof typeof RENTAL_QUOTATION_STATUS_LABELS] ?? q.status} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
