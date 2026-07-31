import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { rentalDamageAssessmentSchema, type RentalDamageAssessmentFormInput, type RentalDamageAssessmentFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalDamageAssessment } from '@/features/rental/hooks/use-rental-damage-assessments'

interface RentalDamageAssessmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inspectionId: string
}

export function RentalDamageAssessmentDialog({ open, onOpenChange, inspectionId }: RentalDamageAssessmentDialogProps) {
  const createDamage = useCreateRentalDamageAssessment(inspectionId)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RentalDamageAssessmentFormInput, unknown, RentalDamageAssessmentFormValues>({
    resolver: zodResolver(rentalDamageAssessmentSchema),
    defaultValues: { description: '', estimated_repair_cost: 0, charged_to_customer: true },
  })

  const onSubmit = (values: RentalDamageAssessmentFormValues) => {
    createDamage.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Damage Item</DialogTitle>
          <DialogDescription>Record a specific damage found during inspection.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="damage_description">Description</Label>
            <Textarea id="damage_description" rows={2} {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimated_repair_cost">Estimated Repair Cost</Label>
            <Input id="estimated_repair_cost" type="number" step="0.01" {...register('estimated_repair_cost')} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Charge to Customer</p>
            <Controller control={control} name="charged_to_customer" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDamage.isPending}>
              {createDamage.isPending && <Loader2 className="size-4 animate-spin" />}
              Add Damage Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
