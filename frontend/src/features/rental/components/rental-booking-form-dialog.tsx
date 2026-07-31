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
import { useCreateRentalBooking } from '@/features/rental/hooks/use-rental-bookings'
import { useAvailableRentalAssets } from '@/features/rental/hooks/use-rental-assets'
import { useCustomers } from '@/features/sales/hooks/use-customers'

interface RentalBookingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetCustomerId?: string
  presetAssetId?: string
  presetAssetLabel?: string
  rentalQuotationId?: string
}

export function RentalBookingFormDialog({ open, onOpenChange, presetCustomerId, presetAssetId, presetAssetLabel, rentalQuotationId }: RentalBookingFormDialogProps) {
  const { data: customers } = useCustomers()
  const { data: availableAssets } = useAvailableRentalAssets()
  const createBooking = useCreateRentalBooking()

  const [customerId, setCustomerId] = useState(presetCustomerId ?? '')
  const [customerError, setCustomerError] = useState(false)

  useEffect(() => {
    if (open) setCustomerId(presetCustomerId ?? '')
  }, [open, presetCustomerId])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RentalBookingFormValues>({
    resolver: zodResolver(rentalBookingSchema),
    values: {
      rental_asset_id: presetAssetId ?? '',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
      notes: '',
    },
  })

  const onSubmit = (values: RentalBookingFormValues) => {
    if (!customerId) {
      setCustomerError(true)
      return
    }
    createBooking.mutate(
      { customerId, values, rentalQuotationId },
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
          <DialogTitle>Confirm Booking</DialogTitle>
          <DialogDescription>Reserves the asset for the given date range.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!presetCustomerId && (
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={customerId}
                onValueChange={(v) => {
                  setCustomerId(v ?? '')
                  setCustomerError(false)
                }}
              >
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
              {customerError && <p className="text-xs text-destructive">Customer is required</p>}
            </div>
          )}

          {presetAssetId ? (
            <div className="space-y-1.5">
              <Label>Asset</Label>
              <p className="rounded-md border border-border px-3 py-2 text-sm text-foreground">{presetAssetLabel}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Asset</Label>
              <Controller
                control={control}
                name="rental_asset_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an available asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAssets?.map((a) => (
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" type="date" {...register('start_date')} />
              {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" type="date" {...register('end_date')} />
              {errors.end_date && <p className="text-xs text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="booking_notes">Notes</Label>
            <Textarea id="booking_notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBooking.isPending}>
              {createBooking.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirm Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
