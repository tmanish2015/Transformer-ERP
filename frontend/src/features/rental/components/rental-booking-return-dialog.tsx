import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { rentalBookingReturnSchema, type RentalBookingReturnFormInput, type RentalBookingReturnFormValues } from '@/features/rental/schemas/rental-schemas'
import { useReturnRentalBookingAndInvoice } from '@/features/rental/hooks/use-rental-bookings'
import type { RentalBookingWithRelations } from '@/features/rental/types/rental-types'

interface RentalBookingReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: RentalBookingWithRelations | null
}

// Inclusive of both the start date and the return date (matches the same
// convention used when invoicing from an agreement or a quotation).
function rentalDaysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1
}

export function RentalBookingReturnDialog({ open, onOpenChange, booking }: RentalBookingReturnDialogProps) {
  const returnAndInvoice = useReturnRentalBookingAndInvoice()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<RentalBookingReturnFormInput, unknown, RentalBookingReturnFormValues>({
    resolver: zodResolver(rentalBookingReturnSchema),
    values: {
      actual_return_date: new Date().toISOString().slice(0, 10),
      daily_rate: booking?.rental_asset.daily_rental_rate ?? 0,
    },
  })

  const actualReturnDate = watch('actual_return_date')
  const dailyRate = Number(watch('daily_rate')) || 0
  const dateBeforeStart = Boolean(booking && actualReturnDate && actualReturnDate < booking.start_date)
  const rentalDays = booking && actualReturnDate && !dateBeforeStart ? Math.max(0, rentalDaysBetween(booking.start_date, actualReturnDate)) : 0
  const total = rentalDays * dailyRate

  const onSubmit = (values: RentalBookingReturnFormValues) => {
    if (!booking) return
    if (values.actual_return_date < booking.start_date) {
      setError('actual_return_date', { message: 'Return date cannot be earlier than the start date' })
      return
    }
    returnAndInvoice.mutate(
      { booking, actualReturnDate: values.actual_return_date, rentalDays: rentalDaysBetween(booking.start_date, values.actual_return_date), dailyRate: values.daily_rate },
      {
        onSuccess: () => {
          onOpenChange(false)
          reset()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Return Machine</DialogTitle>
          <DialogDescription>
            {booking && (
              <>
                {booking.booking_number} — {booking.rental_asset.asset_code} ({booking.rental_asset.name}) for {booking.customer.name}. Start Date:{' '}
                {new Date(booking.start_date).toLocaleDateString()}.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="actual_return_date">Actual Return Date</Label>
            <Input id="actual_return_date" type="date" {...register('actual_return_date')} />
            {errors.actual_return_date && <p className="text-xs text-destructive">{errors.actual_return_date.message}</p>}
            {!errors.actual_return_date && dateBeforeStart && <p className="text-xs text-destructive">Return date cannot be earlier than the start date</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Rental Days</Label>
            <p className="rounded-md border border-border px-3 py-2 text-sm text-foreground">{rentalDays > 0 ? `${rentalDays} Days` : '—'}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="daily_rate">Rate Per Day (₹)</Label>
            <Input id="daily_rate" type="number" step="0.01" min="0.01" {...register('daily_rate')} />
            {errors.daily_rate && <p className="text-xs text-destructive">{errors.daily_rate.message}</p>}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total Rental Amount</span>
            <span className="font-semibold text-foreground">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={returnAndInvoice.isPending || rentalDays <= 0}>
              {returnAndInvoice.isPending && <Loader2 className="size-4 animate-spin" />}
              Generate Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
