import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { repairJobSchema, type RepairJobFormInput, type RepairJobFormValues } from '@/features/workshop/schemas/workshop-schemas'
import { useCreateRepairJob } from '@/features/workshop/hooks/use-repair-jobs'
import { useCustomers } from '@/features/sales/hooks/use-customers'

interface RepairJobFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RepairJobFormDialog({ open, onOpenChange }: RepairJobFormDialogProps) {
  const { data: customers } = useCustomers()
  const createJob = useCreateRepairJob()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RepairJobFormInput, unknown, RepairJobFormValues>({
    resolver: zodResolver(repairJobSchema),
    defaultValues: {
      customer_id: '',
      transformer_make: '',
      transformer_model: '',
      transformer_serial_no: '',
      complaint: '',
      pickup_required: false,
      pickup_address: '',
      pickup_requested_date: '',
      notes: '',
    },
  })

  const pickupRequired = watch('pickup_required')

  const onSubmit = (values: RepairJobFormValues) => {
    createJob.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New Repair Job Card</DialogTitle>
          <DialogDescription>Record a customer complaint and open a repair job card.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Controller
              control={control}
              name="customer_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
            {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="transformer_make">Make</Label>
              <Input id="transformer_make" {...register('transformer_make')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transformer_model">Model</Label>
              <Input id="transformer_model" {...register('transformer_model')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transformer_capacity_kva">Capacity (kVA)</Label>
              <Input id="transformer_capacity_kva" type="number" step="0.01" {...register('transformer_capacity_kva')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transformer_serial_no">Serial Number</Label>
            <Input id="transformer_serial_no" {...register('transformer_serial_no')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="complaint">Complaint / Reported Issue</Label>
            <Textarea id="complaint" rows={3} {...register('complaint')} />
            {errors.complaint && <p className="text-xs text-destructive">{errors.complaint.message}</p>}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Pickup Required</p>
              <p className="text-xs text-muted-foreground">Customer needs the transformer collected from their site.</p>
            </div>
            <Controller control={control} name="pickup_required" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
          </div>

          {pickupRequired && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pickup_address">Pickup Address</Label>
                <Textarea id="pickup_address" rows={2} {...register('pickup_address')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pickup_requested_date">Requested Pickup Date</Label>
                <Input id="pickup_requested_date" type="date" {...register('pickup_requested_date')} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createJob.isPending}>
              {createJob.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Job Card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
