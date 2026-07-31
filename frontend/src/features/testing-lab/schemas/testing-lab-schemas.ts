import { z } from 'zod'

export const testResultSchema = z.object({
  parameter_key: z.string().min(1),
  parameter_label: z.string().min(1),
  value: z.string().min(1, 'Value is required'),
  unit: z.string().optional().or(z.literal('')),
  pass_fail: z.enum(['pass', 'fail', 'na']),
})

export const testReportSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  repair_job_id: z.string().optional().or(z.literal('')),
  production_order_id: z.string().optional().or(z.literal('')),
  test_type_id: z.string().min(1, 'Test type is required'),
  tested_at: z.string().min(1, 'Test date is required'),
  notes: z.string().optional().or(z.literal('')),
  results: z.array(testResultSchema).min(1, 'Add at least one result'),
})
export type TestReportFormValues = z.infer<typeof testReportSchema>
export type TestReportFormInput = z.input<typeof testReportSchema>
