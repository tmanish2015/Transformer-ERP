import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { transformerFormSchema, type TransformerFormInput, type TransformerFormValues } from '@/features/transformer/schemas/transformer-schema'
import { useCreateTransformer, useUpdateTransformer } from '@/features/transformer/hooks/use-transformers'
import { useCustomers } from '@/features/sales/hooks/use-customers'
import { TRANSFORMER_STATUS_LABELS, type TransformerStatus, type TransformerWithCustomer } from '@/features/transformer/types/transformer-types'

const DEFAULT_VALUES: TransformerFormValues = {
  customer_id: '',
  registration_no: '',
  serial_no: '',
  make: '',
  model: '',
  capacity_kva: 0,
  voltage_ratio: '',
  phase: '',
  cooling_type: '',
  manufacturer: '',
  manufacturing_year: undefined,
  installation_date: '',
  location: '',
  current_status: 'IN SERVICE',
  warranty_expiry: '',
  remarks: '',
}

interface TransformerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transformer: TransformerWithCustomer | null
}

export function TransformerFormDialog({ open, onOpenChange, transformer }: TransformerFormDialogProps) {
  const { data: customers } = useCustomers()
  const createTransformer = useCreateTransformer()
  const updateTransformer = useUpdateTransformer()
  const isPending = createTransformer.isPending || updateTransformer.isPending

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransformerFormInput, unknown, TransformerFormValues>({
    resolver: zodResolver(transformerFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      reset(
        transformer
          ? {
              customer_id: transformer.customer_id,
              registration_no: transformer.registration_no,
              serial_no: transformer.serial_no ?? '',
              make: transformer.make ?? '',
              model: transformer.model ?? '',
              capacity_kva: transformer.capacity_kva ?? 0,
              voltage_ratio: transformer.voltage_ratio ?? '',
              phase: transformer.phase ?? '',
              cooling_type: transformer.cooling_type ?? '',
              manufacturer: transformer.manufacturer ?? '',
              manufacturing_year: transformer.manufacturing_year ?? undefined,
              installation_date: transformer.installation_date ?? '',
              location: transformer.location ?? '',
              current_status: (transformer.current_status as TransformerStatus) ?? 'IN SERVICE',
              warranty_expiry: transformer.warranty_expiry ?? '',
              remarks: transformer.remarks ?? '',
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, transformer, reset])

  const onSubmit = (values: TransformerFormValues) => {
    const onSuccess = () => onOpenChange(false)
    if (transformer) {
      updateTransformer.mutate({ id: transformer.id, values }, { onSuccess })
    } else {
      createTransformer.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{transformer ? 'Edit Transformer' : 'New Transformer'}</DialogTitle>
          <DialogDescription>
            {transformer ? `Editing ${transformer.registration_no}` : 'Create a transformer master record.'}
          </DialogDescription>
        </DialogHeader>

        <form id="transformer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Controller
                control={control}
                name="customer_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{customers?.find((c) => c.id === field.value)?.name ?? 'Select Customer'}</SelectValue>
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

            <div className="space-y-1.5">
              <Label htmlFor="registration_no">Registration No.</Label>
              <Input id="registration_no" {...register('registration_no')} />
              {errors.registration_no && <p className="text-xs text-destructive">{errors.registration_no.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="serial_no">Serial No.</Label>
              <Input id="serial_no" {...register('serial_no')} />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="current_status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as TransformerStatus)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRANSFORMER_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="make">Make</Label>
              <Input id="make" {...register('make')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Input id="model" {...register('model')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity_kva">Capacity (kVA)</Label>
              <Input id="capacity_kva" type="number" step="0.01" {...register('capacity_kva')} />
              {errors.capacity_kva && <p className="text-xs text-destructive">{errors.capacity_kva.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="voltage_ratio">Voltage Ratio</Label>
              <Input id="voltage_ratio" {...register('voltage_ratio')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phase">Phase</Label>
              <Input id="phase" {...register('phase')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cooling_type">Cooling Type</Label>
              <Input id="cooling_type" {...register('cooling_type')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input id="manufacturer" {...register('manufacturer')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manufacturing_year">Manufacturing Year</Label>
              <Input id="manufacturing_year" type="number" {...register('manufacturing_year')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="installation_date">Installation Date</Label>
              <Input id="installation_date" type="date" {...register('installation_date')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
              <Input id="warranty_expiry" type="date" {...register('warranty_expiry')} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register('location')} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" rows={3} {...register('remarks')} />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="transformer-form" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {transformer ? 'Save changes' : 'Create transformer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
