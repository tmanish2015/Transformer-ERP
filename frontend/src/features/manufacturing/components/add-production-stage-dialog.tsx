import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { productionStageHistorySchema, type ProductionStageHistoryFormValues } from '@/features/manufacturing/schemas/manufacturing-schemas'
import { PRODUCTION_STAGE_LABELS, PRODUCTION_STAGE_ORDER } from '@/features/manufacturing/types/manufacturing-types'
import { useAddProductionStageHistoryEntry } from '@/features/manufacturing/hooks/use-production-stage-history'

interface AddProductionStageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
}

export function AddProductionStageDialog({ open, onOpenChange, orderId }: AddProductionStageDialogProps) {
  const addStage = useAddProductionStageHistoryEntry(orderId)

  const { control, register, handleSubmit, reset } = useForm<ProductionStageHistoryFormValues>({
    resolver: zodResolver(productionStageHistorySchema),
    defaultValues: { stage: 'winding', notes: '' },
  })

  const onSubmit = (values: ProductionStageHistoryFormValues) => {
    addStage.mutate(values, {
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
          <DialogTitle>Log Production Stage</DialogTitle>
          <DialogDescription>The first stage logged consumes raw materials; logging Dispatch completes the order and produces serial-tracked output.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Controller
              control={control}
              name="stage"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTION_STAGE_ORDER.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {PRODUCTION_STAGE_LABELS[stage]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stage_notes">Notes</Label>
            <Textarea id="stage_notes" rows={3} placeholder="Optional remarks" {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addStage.isPending}>
              {addStage.isPending && <Loader2 className="size-4 animate-spin" />}
              Log Stage
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
