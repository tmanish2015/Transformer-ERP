import { z } from 'zod'

export const repairJobSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  transformer_make: z.string().optional().or(z.literal('')),
  transformer_model: z.string().optional().or(z.literal('')),
  transformer_serial_no: z.string().optional().or(z.literal('')),
  transformer_capacity_kva: z.coerce.number().min(0).optional(),
  complaint: z.string().min(1, 'Complaint / reported issue is required'),
  pickup_required: z.boolean(),
  pickup_address: z.string().optional().or(z.literal('')),
  pickup_requested_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})
export type RepairJobFormValues = z.infer<typeof repairJobSchema>
export type RepairJobFormInput = z.input<typeof repairJobSchema>

export const estimateItemSchema = z.object({
  item_type: z.enum(['spare_part', 'labor', 'other']),
  product_id: z.string().optional().or(z.literal('')),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit_price: z.coerce.number().min(0),
  gst_rate: z.coerce.number().min(0).max(100),
})

export const repairEstimateSchema = z.object({
  repair_job_id: z.string().min(1, 'Job card is required'),
  estimate_date: z.string().min(1, 'Estimate date is required'),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(estimateItemSchema).min(1, 'Add at least one line item'),
})
export type RepairEstimateFormValues = z.infer<typeof repairEstimateSchema>
export type RepairEstimateFormInput = z.input<typeof repairEstimateSchema>

export const customerApprovalSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional().or(z.literal('')),
})
export type CustomerApprovalFormValues = z.infer<typeof customerApprovalSchema>

export const stageHistorySchema = z.object({
  stage: z.enum(['dismantling', 'core_inspection', 'coil_inspection', 'rewinding', 'core_assembly', 'tank_repair', 'painting', 'oil_filling', 'testing', 'qc', 'dispatch', 'installation']),
  notes: z.string().optional().or(z.literal('')),
})
export type StageHistoryFormValues = z.infer<typeof stageHistorySchema>

export const repairWarrantySchema = z.object({
  warranty_months: z.coerce.number().int().positive('Warranty period must be at least 1 month'),
  terms: z.string().optional().or(z.literal('')),
})
export type RepairWarrantyFormInput = z.input<typeof repairWarrantySchema>
export type RepairWarrantyFormValues = z.infer<typeof repairWarrantySchema>
