import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { testReportSchema, type TestReportFormInput, type TestReportFormValues } from '@/features/testing-lab/schemas/testing-lab-schemas'
import type { TestTypeParameter } from '@/features/testing-lab/types/testing-lab-types'
import { useCreateTestReport } from '@/features/testing-lab/hooks/use-test-reports'
import { useTestTypes } from '@/features/testing-lab/hooks/use-test-types'
import { useCustomers } from '@/features/sales/hooks/use-customers'
import { useRepairJob, useRepairJobs } from '@/features/workshop/hooks/use-repair-jobs'
import { useProductionOrders } from '@/features/manufacturing/hooks/use-production-orders'

interface TestReportFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repairJobId?: string
  productionOrderId?: string
}

export function TestReportFormDialog({ open, onOpenChange, repairJobId, productionOrderId }: TestReportFormDialogProps) {
  const { data: customers } = useCustomers()
  const { data: testTypes } = useTestTypes()
  const { data: jobs } = useRepairJobs()
  const { data: presetJob } = useRepairJob(repairJobId)
  const { data: productionOrders } = useProductionOrders()
  const createReport = useCreateTestReport()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TestReportFormInput, unknown, TestReportFormValues>({
    resolver: zodResolver(testReportSchema),
    defaultValues: {
      customer_id: '',
      repair_job_id: repairJobId ?? '',
      production_order_id: productionOrderId ?? '',
      test_type_id: '',
      tested_at: new Date().toISOString().slice(0, 10),
      notes: '',
      results: [],
    },
  })

  const { fields, replace } = useFieldArray({ control, name: 'results' })
  const testTypeId = watch('test_type_id')

  useEffect(() => {
    if (open) {
      reset({
        customer_id: '',
        repair_job_id: repairJobId ?? '',
        production_order_id: productionOrderId ?? '',
        test_type_id: '',
        tested_at: new Date().toISOString().slice(0, 10),
        notes: '',
        results: [],
      })
    }
  }, [open, repairJobId, productionOrderId, reset])

  useEffect(() => {
    if (presetJob) setValue('customer_id', presetJob.customer_id)
  }, [presetJob, setValue])

  useEffect(() => {
    const type = testTypes?.find((t) => t.id === testTypeId)
    if (type) {
      const params = (type.parameters as unknown as TestTypeParameter[]) ?? []
      replace(params.map((p) => ({ parameter_key: p.key, parameter_label: p.label, unit: p.unit, value: '', pass_fail: 'na' as const })))
    }
  }, [testTypeId, testTypes, replace])

  const onSubmit = (values: TestReportFormValues) => {
    createReport.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Test Report</DialogTitle>
          <DialogDescription>Record test results — usable for a walk-in lab customer, a post-repair test, or a factory acceptance test on a production order.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-10rem)]">
          <form id="test-report-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Controller
                  control={control}
                  name="customer_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={Boolean(repairJobId)}>
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
                <Label>Repair Job (optional)</Label>
                <Controller
                  control={control}
                  name="repair_job_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={Boolean(repairJobId) || Boolean(productionOrderId)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Walk-in (no repair job)" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs?.map((j) => (
                          <SelectItem key={j.id} value={j.id}>
                            {j.job_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Production Order (optional — factory acceptance test)</Label>
              <Controller
                control={control}
                name="production_order_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={Boolean(productionOrderId) || Boolean(repairJobId)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No production order" />
                    </SelectTrigger>
                    <SelectContent>
                      {productionOrders?.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.order_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Test Type</Label>
                <Controller
                  control={control}
                  name="test_type_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent>
                        {testTypes?.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.test_type_id && <p className="text-xs text-destructive">{errors.test_type_id.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tested_at">Tested At</Label>
                <Input id="tested_at" type="date" {...register('tested_at')} />
              </div>
            </div>

            {fields.length > 0 && (
              <div className="space-y-2">
                <Label>Results</Label>
                {errors.results?.message && <p className="text-xs text-destructive">{errors.results.message}</p>}
                <div className="rounded-lg border border-border">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead className="w-32">Value</TableHead>
                        <TableHead className="w-20">Unit</TableHead>
                        <TableHead className="w-28">Verdict</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell className="text-sm text-foreground">{field.parameter_label}</TableCell>
                          <TableCell>
                            <Input {...register(`results.${index}.value`)} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{field.unit || '—'}</TableCell>
                          <TableCell>
                            <Controller
                              control={control}
                              name={`results.${index}.pass_fail`}
                              render={({ field: verdictField }) => (
                                <Select value={verdictField.value} onValueChange={verdictField.onChange}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pass">Pass</SelectItem>
                                    <SelectItem value="fail">Fail</SelectItem>
                                    <SelectItem value="na">N/A</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={2} {...register('notes')} />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="test-report-form" disabled={createReport.isPending}>
            {createReport.isPending && <Loader2 className="size-4 animate-spin" />}
            Create Test Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
