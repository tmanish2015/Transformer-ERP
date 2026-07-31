import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { rentalAgreementSchema, type RentalAgreementFormInput, type RentalAgreementFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalAgreement } from '@/features/rental/hooks/use-rental-agreements'
import type { RentalBookingWithRelations } from '@/features/rental/types/rental-types'

interface RentalAgreementFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: RentalBookingWithRelations | null
}

export function RentalAgreementFormDialog({ open, onOpenChange, booking }: RentalAgreementFormDialogProps) {
  const createAgreement = useCreateRentalAgreement()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RentalAgreementFormInput, unknown, RentalAgreementFormValues>({
    resolver: zodResolver(rentalAgreementSchema),
    defaultValues: {
      security_deposit: 0,
      late_return_charge_rate: 0,
      operator_provided: false,
      operator_charge_rate: 0,
      fuel_charge_rate: 0,
      notes: '',
    },
  })

  const operatorProvided = watch('operator_provided')

  if (!booking) return null

  const onSubmit = (values: RentalAgreementFormValues) => {
    createAgreement.mutate(
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Rental Agreement</DialogTitle>
          <DialogDescription>
            {booking.rental_asset.asset_code} — {booking.rental_asset.name} for {booking.customer.name}, {new Date(booking.start_date).toLocaleDateString()} to{' '}
            {new Date(booking.end_date).toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="security_deposit">Security Deposit</Label>
              <Input id="security_deposit" type="number" step="0.01" {...register('security_deposit')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="late_return_charge_rate">Late Return Charge / Day</Label>
              <Input id="late_return_charge_rate" type="number" step="0.01" {...register('late_return_charge_rate')} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Operator Provided</p>
              <p className="text-xs text-muted-foreground">Company provides an operator with the machine.</p>
            </div>
            <Controller control={control} name="operator_provided" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="operator_charge_rate">Operator Charge / Day</Label>
              <Input id="operator_charge_rate" type="number" step="0.01" disabled={!operatorProvided} {...register('operator_charge_rate')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fuel_charge_rate">Fuel Charge / Day</Label>
              <Input id="fuel_charge_rate" type="number" step="0.01" {...register('fuel_charge_rate')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agreement_notes">Notes</Label>
            <Textarea id="agreement_notes" rows={2} {...register('notes')} />
          </div>

          {errors.security_deposit && <p className="text-xs text-destructive">{errors.security_deposit.message}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAgreement.isPending}>
              {createAgreement.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Agreement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
