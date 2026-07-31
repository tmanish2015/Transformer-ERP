import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { opportunitySchema, type OpportunityFormInput, type OpportunityFormValues } from '@/features/crm/schemas/crm-schemas'
import { useCreateOpportunity } from '@/features/crm/hooks/use-opportunities'
import { useCustomers } from '@/features/sales/hooks/use-customers'
import { useSiteSurveys } from '@/features/crm/hooks/use-site-surveys'

interface OpportunityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultSiteSurveyId?: string
}

export function OpportunityFormDialog({ open, onOpenChange, defaultSiteSurveyId }: OpportunityFormDialogProps) {
  const { data: customers } = useCustomers()
  const { data: surveys } = useSiteSurveys()
  const createOpportunity = useCreateOpportunity()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OpportunityFormInput, unknown, OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: { customer_id: '', site_survey_id: defaultSiteSurveyId ?? '', title: '', estimated_value: 0, expected_close_date: '', notes: '' },
  })

  const onSubmit = (values: OpportunityFormValues) => {
    createOpportunity.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Opportunity</DialogTitle>
          <DialogDescription>Open a sales opportunity to track through the pipeline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <Label>Site Survey (optional)</Label>
              <Controller
                control={control}
                name="site_survey_id"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      {surveys?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.survey_number} — {s.customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. 500 KVA transformer supply" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="estimated_value">Estimated Value</Label>
              <Input id="estimated_value" type="number" step="0.01" {...register('estimated_value')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expected_close_date">Expected Close</Label>
              <Input id="expected_close_date" type="date" {...register('expected_close_date')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opportunity_notes">Notes</Label>
            <Textarea id="opportunity_notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOpportunity.isPending}>
              {createOpportunity.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Opportunity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
