import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { rentalBookingSchema, type RentalBookingFormValues } from '@/features/rental/schemas/rental-schemas'
import { useUpdateRentalBooking } from '@/features/rental/hooks/use-rental-bookings'
import { useAvailableRentalAssets } from '@/features/rental/hooks/use-rental-assets'
import { useCustomers } from '@/features/sales/hooks/use-customers'
import type { RentalBookingWithRelations } from '@/features/rental/types/rental-types'

interface RentalBookingEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: RentalBookingWithRelations | null
  locked: boolean
}

export function RentalBookingEditDialog({ open, onOpenChange, booking, locked }: RentalBookingEditDialogProps) {
  const { data: customers } = useCustomers()
  const { data: availableAssets } = useAvailableRentalAssets()
  const updateBooking = useUpdateRentalBooking()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RentalBookingFormValues>({
    resolver: zodResolver(rentalBookingSchema),
    values: {
      rental_asset_id: booking?.rental_asset_id ?? '',
      location_from: booking?.location_from ?? '',
      destination: booking?.destination ?? '',
      start_date: booking?.start_date ?? '',
      end_date: booking?.end_date ?? '',
      notes: booking?.notes ?? '',
    },
  })

  // customer_id isn't part of rentalBookingSchema (New Booking manages it the
  // same way, outside the zod-validated field set), so it's tracked locally
  // and sent alongside the validated values on submit.
  const [customerId, setCustomerId] = useState(booking?.customer_id ?? '')

  useEffect(() => {
    if (open) setCustomerId(booking?.customer_id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking?.customer_id])

  if (!booking) return null

  // The asset dropdown must include the booking's current asset even though
  // it's not in the "available" pool (it's held by this very booking).
  const assetOptions = availableAssets?.some((a) => a.id === booking.rental_asset_id)
    ? availableAssets
    : [...(availableAssets ?? []), booking.rental_asset]

  const onSubmit = (values: RentalBookingFormValues) => {
    updateBooking.mutate(
      { id: booking.id, customerId, values },
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Booking — {booking.booking_number}</DialogTitle>
          <DialogDescription>
            {locked
              ? 'Customer, asset, and start date are locked because an agreement or invoice already exists for this booking.'
              : 'Admin-only. Changes are validated against asset availability and date consistency on save.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? '')} items={(customers ?? []).map((c) => ({ value: c.id, label: c.name }))} disabled={locked}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Asset</Label>
            <Controller
              control={control}
              name="rental_asset_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} items={assetOptions.map((a) => ({ value: a.id, label: `${a.asset_code} — ${a.name}` }))} disabled={locked}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.asset_code} — {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.rental_asset_id && <p className="text-xs text-destructive">{errors.rental_asset_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit_location_from">Location From</Label>
              <Input id="edit_location_from" placeholder="e.g. Jaipur Warehouse" {...register('location_from')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_destination">Destination</Label>
              <Input id="edit_destination" placeholder="e.g. Kota, Rajasthan" {...register('destination')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit_start_date">Start Date</Label>
              <Input id="edit_start_date" type="date" disabled={locked} {...register('start_date')} />
              {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_end_date">Expected/Return Date (Optional)</Label>
              <Input id="edit_end_date" type="date" {...register('end_date')} />
              {errors.end_date && <p className="text-xs text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit_notes">Notes</Label>
            <Textarea id="edit_notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateBooking.isPending}>
              {updateBooking.isPending && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
