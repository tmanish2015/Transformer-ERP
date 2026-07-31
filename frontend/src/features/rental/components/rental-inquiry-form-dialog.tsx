import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { rentalInquirySchema, type RentalInquiryFormValues } from '@/features/rental/schemas/rental-schemas'
import { useCreateRentalInquiry } from '@/features/rental/hooks/use-rental-inquiries'
import { useRentalAssetCategories } from '@/features/rental/hooks/use-rental-asset-categories'
import { useCustomers } from '@/features/sales/hooks/use-customers'

interface RentalInquiryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RentalInquiryFormDialog({ open, onOpenChange }: RentalInquiryFormDialogProps) {
  const { data: customers } = useCustomers()
  const { data: categories } = useRentalAssetCategories()
  const createInquiry = useCreateRentalInquiry()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RentalInquiryFormValues>({
    resolver: zodResolver(rentalInquirySchema),
    defaultValues: { customer_id: '', category_id: '', requirement: '', required_from: '', required_to: '', notes: '' },
  })

  const onSubmit = (values: RentalInquiryFormValues) => {
    createInquiry.mutate(values, {
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
          <DialogTitle>New Rental Inquiry</DialogTitle>
          <DialogDescription>Capture what a customer is asking to rent.</DialogDescription>
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
              <Label>Category</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="requirement">Requirement</Label>
            <Textarea id="requirement" rows={3} placeholder="What does the customer need?" {...register('requirement')} />
            {errors.requirement && <p className="text-xs text-destructive">{errors.requirement.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="required_from">Required From</Label>
              <Input id="required_from" type="date" {...register('required_from')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="required_to">Required To</Label>
              <Input id="required_to" type="date" {...register('required_to')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inquiry_notes">Notes</Label>
            <Textarea id="inquiry_notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInquiry.isPending}>
              {createInquiry.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Inquiry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
