import { z } from 'zod'

export const bomLineSchema = z.object({
  raw_material_product_id: z.string().min(1, 'Raw material is required'),
  qty: z.coerce.number().positive('Quantity must be greater than 0'),
  unit_id: z.string().min(1, 'Unit is required'),
})

export const bomSchema = z.object({
  product_id: z.string().min(1, 'Finished product is required'),
  name: z.string().optional().or(z.literal('')),
  lines: z.array(bomLineSchema).min(1, 'Add at least one raw material line'),
})
export type BomFormInput = z.input<typeof bomSchema>
export type BomFormValues = z.infer<typeof bomSchema>

export const productionOrderSchema = z.object({
  bom_id: z.string().min(1, 'BOM is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  notes: z.string().optional().or(z.literal('')),
})
export type ProductionOrderFormInput = z.input<typeof productionOrderSchema>
export type ProductionOrderFormValues = z.infer<typeof productionOrderSchema>

export const productionStageHistorySchema = z.object({
  stage: z.enum(['winding', 'assembly', 'testing', 'painting', 'packing', 'dispatch']),
  notes: z.string().optional().or(z.literal('')),
})
export type ProductionStageHistoryFormValues = z.infer<typeof productionStageHistorySchema>
