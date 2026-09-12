import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { rentalBookingReturnSchema, type RentalBookingReturnFormValues } from '@/features/rental/schemas/rental-schemas'
import { useReturnRentalBooking } from '@/features/rental/hooks/use-rental-bookings'
import type { RentalBookingWithRelations } from '@/features/rental/types/rental-types'

interface RentalBookingReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: RentalBookingWithRelations | null
}

export function RentalBookingReturnDialog({ open, onOpenChange, booking }: RentalBookingReturnDialogProps) {
  const returnBooking = useReturnRentalBooking()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RentalBookingReturnFormValues>({
    resolver: zodResolver(rentalBookingReturnSchema),
    values: { actual_return_date: new Date().toISOString().slice(0, 10) },
  })

  const onSubmit = (values: RentalBookingReturnFormValues) => {
    if (!booking) return
    returnBooking.mutate(
      { id: booking.id, actualReturnDate: values.actual_return_date },
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
          <DialogDescription>{booking && `${booking.rental_asset.asset_code} — ${booking.rental_asset.name}, from ${booking.customer.name}.`}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="actual_return_date">Actual Return Date</Label>
            <Input id="actual_return_date" type="date" {...register('actual_return_date')} />
            {errors.actual_return_date && <p className="text-xs text-destructive">{errors.actual_return_date.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={returnBooking.isPending}>
              {returnBooking.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirm Return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
