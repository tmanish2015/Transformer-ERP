import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { repairWarrantySchema, type RepairWarrantyFormInput, type RepairWarrantyFormValues } from '@/features/workshop/schemas/workshop-schemas'
import { useCreateRepairWarranty } from '@/features/workshop/hooks/use-repair-warranty'

interface AddWarrantyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repairJobId: string
}

export function AddWarrantyDialog({ open, onOpenChange, repairJobId }: AddWarrantyDialogProps) {
  const createWarranty = useCreateRepairWarranty(repairJobId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RepairWarrantyFormInput, unknown, RepairWarrantyFormValues>({
    resolver: zodResolver(repairWarrantySchema),
    defaultValues: { warranty_months: 6, terms: '' },
  })

  const onSubmit = (values: RepairWarrantyFormValues) => {
    createWarranty.mutate(values, {
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
          <DialogTitle>Add Warranty</DialogTitle>
          <DialogDescription>Records the warranty period starting today.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="warranty_months">Warranty Period (months)</Label>
            <Input id="warranty_months" type="number" min="1" {...register('warranty_months')} />
            {errors.warranty_months && <p className="text-xs text-destructive">{errors.warranty_months.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warranty_terms">Terms</Label>
            <Textarea id="warranty_terms" rows={3} placeholder="Optional warranty terms/conditions" {...register('terms')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createWarranty.isPending}>
              {createWarranty.isPending && <Loader2 className="size-4 animate-spin" />}
              Save Warranty
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
