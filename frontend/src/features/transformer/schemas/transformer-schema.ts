import { z } from 'zod'

export const transformerFormSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  registration_no: z.string().min(1, 'Registration No is required'),
  serial_no: z.string().optional().or(z.literal('')),
  make: z.string().optional().or(z.literal('')),
  model: z.string().optional().or(z.literal('')),
  capacity_kva: z.coerce.number().positive('Capacity must be greater than zero'),
  voltage_ratio: z.string().optional().or(z.literal('')),
  phase: z.string().optional().or(z.literal('')),
  cooling_type: z.string().optional().or(z.literal('')),
  manufacturer: z.string().optional().or(z.literal('')),
// Preprocess empty string -> undefined so an intentionally-blank Manufacturing Year
  // is treated as "not provided" instead of being coerced to 0 (which would fail min(1900)).
  manufacturing_year: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().int().min(1900).max(2100).optional(),
  ),
  installation_date: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  current_status: z.enum(['IN SERVICE', 'IN REPAIR', 'OUT OF SERVICE', 'DECOMMISSIONED']),
  warranty_expiry: z.string().optional().or(z.literal('')),
  remarks: z.string().optional().or(z.literal('')),
})

export type TransformerFormValues = z.infer<typeof transformerFormSchema>
export type TransformerFormInput = z.input<typeof transformerFormSchema>
