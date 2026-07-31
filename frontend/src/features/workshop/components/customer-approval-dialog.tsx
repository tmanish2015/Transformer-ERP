import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { customerApprovalSchema, type CustomerApprovalFormValues } from '@/features/workshop/schemas/workshop-schemas'
import { useRecordCustomerApproval } from '@/features/workshop/hooks/use-repair-estimates'

interface CustomerApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  estimateId: string
}

export function CustomerApprovalDialog({ open, onOpenChange, estimateId }: CustomerApprovalDialogProps) {
  const recordApproval = useRecordCustomerApproval()

  const { register, handleSubmit, reset, setValue } = useForm<CustomerApprovalFormValues>({
    resolver: zodResolver(customerApprovalSchema),
    defaultValues: { approved: true, notes: '' },
  })

  const submitDecision = (approved: boolean) =>
    handleSubmit((values) => {
      recordApproval.mutate(
        { id: estimateId, values: { ...values, approved } },
        {
          onSuccess: () => {
            onOpenChange(false)
            reset()
          },
        },
      )
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Customer Decision</DialogTitle>
          <DialogDescription>Record whether the customer approved or rejected this estimate.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="approval_notes">Notes</Label>
            <Textarea id="approval_notes" rows={3} placeholder="Optional customer remarks" {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={recordApproval.isPending} onClick={() => { setValue('approved', false); submitDecision(false)() }}>
              {recordApproval.isPending && <Loader2 className="size-4 animate-spin" />}
              Reject
            </Button>
            <Button type="button" disabled={recordApproval.isPending} onClick={() => { setValue('approved', true); submitDecision(true)() }}>
              {recordApproval.isPending && <Loader2 className="size-4 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
