import { z } from 'zod'

export const maintenanceScheduleSchema = z.object({
  reference_id: z.string().min(1, 'Asset is required'),
  frequency_days: z.coerce.number().int().positive('Frequency must be at least 1 day'),
  next_due_at: z.string().min(1, 'Next due date is required'),
  notes: z.string().optional().or(z.literal('')),
})
export type MaintenanceScheduleFormInput = z.input<typeof maintenanceScheduleSchema>
export type MaintenanceScheduleFormValues = z.infer<typeof maintenanceScheduleSchema>

export const maintenanceVisitSchema = z.object({
  visited_at: z.string().min(1, 'Visit date is required'),
  status: z.enum(['scheduled', 'completed', 'skipped']),
  notes: z.string().optional().or(z.literal('')),
})
export type MaintenanceVisitFormValues = z.infer<typeof maintenanceVisitSchema>
