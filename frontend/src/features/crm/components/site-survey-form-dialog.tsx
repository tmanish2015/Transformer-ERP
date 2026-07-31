import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { siteSurveySchema, type SiteSurveyFormValues } from '@/features/crm/schemas/crm-schemas'
import { useCreateSiteSurvey } from '@/features/crm/hooks/use-site-surveys'
import { useCustomers } from '@/features/sales/hooks/use-customers'

interface SiteSurveyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SiteSurveyFormDialog({ open, onOpenChange }: SiteSurveyFormDialogProps) {
  const { data: customers } = useCustomers()
  const createSurvey = useCreateSiteSurvey()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteSurveyFormValues>({
    resolver: zodResolver(siteSurveySchema),
    defaultValues: { customer_id: '', scheduled_date: '', notes: '' },
  })

  const onSubmit = (values: SiteSurveyFormValues) => {
    createSurvey.mutate(values, {
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
          <DialogTitle>New Site Survey</DialogTitle>
          <DialogDescription>Schedule a site visit to assess a customer's requirement.</DialogDescription>
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

          <div className="space-y-1.5">
            <Label htmlFor="scheduled_date">Scheduled Date</Label>
            <Input id="scheduled_date" type="date" {...register('scheduled_date')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="survey_notes">Notes</Label>
            <Textarea id="survey_notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSurvey.isPending}>
              {createSurvey.isPending && <Loader2 className="size-4 animate-spin" />}
              Schedule Survey
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
