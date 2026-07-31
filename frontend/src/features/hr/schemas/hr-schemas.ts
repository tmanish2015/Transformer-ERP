import { z } from 'zod'

export const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role_title: z.string().optional().or(z.literal('')),
  skill_tags: z.string().optional().or(z.literal('')),
})
export type EmployeeFormValues = z.infer<typeof employeeSchema>

export const dailyAllocationSchema = z.object({
  employee_id: z.string().min(1, 'Technician is required'),
  allocation_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional().or(z.literal('')),
})
export type DailyAllocationFormValues = z.infer<typeof dailyAllocationSchema>
