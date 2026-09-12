import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { rentalBookingInvoiceSchema, type RentalBookingInvoiceFormInput, type RentalBookingInvoiceFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalInvoiceFromBooking } from '@/features/rental/hooks/use-rental-invoice'
import type { RentalBookingWithRelations } from '@/features/rental/types/rental-types'

interface RentalBookingInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: RentalBookingWithRelations | null
}

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1)
}

export function RentalBookingInvoiceDialog({ open, onOpenChange, booking }: RentalBookingInvoiceDialogProps) {
  const createInvoice = useCreateRentalInvoiceFromBooking()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RentalBookingInvoiceFormInput, unknown, RentalBookingInvoiceFormValues>({
    resolver: zodResolver(rentalBookingInvoiceSchema),
    values: {
      rental_days: booking ? daysBetween(booking.start_date, booking.end_date) : 1,
      daily_rate: booking?.rental_asset.daily_rental_rate ?? 0,
      gst_rate: 18,
    },
  })

  const rentalDays = Number(watch('rental_days')) || 0
  const dailyRate = Number(watch('daily_rate')) || 0
  const gstRate = Number(watch('gst_rate')) || 0
  const total = rentalDays * dailyRate * (1 + gstRate / 100)

  const onSubmit = (values: RentalBookingInvoiceFormValues) => {
    if (!booking) return
    createInvoice.mutate(
      { booking, values },
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
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>{booking && `${booking.rental_asset.asset_code} — ${booking.rental_asset.name}, for ${booking.customer.name}.`}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rental_days">Days</Label>
              <Input id="rental_days" type="number" step="1" min="1" {...register('rental_days')} />
              {errors.rental_days && <p className="text-xs text-destructive">{errors.rental_days.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="daily_rate">Daily Rate (₹)</Label>
              <Input id="daily_rate" type="number" step="0.01" min="0" {...register('daily_rate')} />
              {errors.daily_rate && <p className="text-xs text-destructive">{errors.daily_rate.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gst_rate">GST %</Label>
            <Input id="gst_rate" type="number" step="0.01" min="0" max="100" {...register('gst_rate')} />
            {errors.gst_rate && <p className="text-xs text-destructive">{errors.gst_rate.message}</p>}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Invoice Total</span>
            <span className="font-semibold text-foreground">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending && <Loader2 className="size-4 animate-spin" />}
              Generate Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
