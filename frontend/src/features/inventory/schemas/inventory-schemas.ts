import { z } from 'zod'

export const unitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  short_code: z.string().min(1, 'Short code is required').max(10),
})
export type UnitFormValues = z.infer<typeof unitSchema>

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
  parent_id: z.string().nullable().optional(),
})
export type CategoryFormValues = z.infer<typeof categorySchema>

export const brandSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})
export type BrandFormValues = z.infer<typeof brandSchema>

export const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(20),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
})
export type WarehouseFormValues = z.infer<typeof warehouseSchema>

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact_person: z.string().optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  gstin: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
})
export type SupplierFormValues = z.infer<typeof supplierSchema>

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
  category_id: z.string().nullable().optional(),
  brand_id: z.string().nullable().optional(),
  unit_id: z.string().min(1, 'Unit is required'),
  hsn_code: z.string().optional().or(z.literal('')),
  gst_rate: z.coerce.number().min(0).max(100),
  purchase_price: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0),
  barcode: z.string().optional().or(z.literal('')),
  reorder_level: z.coerce.number().min(0),
  reorder_quantity: z.coerce.number().min(0),
  is_batch_tracked: z.boolean(),
  is_serial_tracked: z.boolean(),
  is_active: z.boolean(),
})
export type ProductFormValues = z.infer<typeof productSchema>
export type ProductFormInput = z.input<typeof productSchema>

export const stockAdjustmentSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  movement_type: z.enum(['purchase', 'sale', 'adjustment', 'transfer_in', 'transfer_out', 'return']),
  quantity: z.coerce.number().refine((v) => v !== 0, 'Quantity cannot be zero'),
  notes: z.string().optional().or(z.literal('')),
})
export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>
export type StockAdjustmentFormInput = z.input<typeof stockAdjustmentSchema>

export const batchSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  batch_number: z.string().min(1, 'Batch number is required'),
  manufacture_date: z.string().optional().or(z.literal('')),
  expiry_date: z.string().optional().or(z.literal('')),
  quantity: z.coerce.number().min(0),
})
export type BatchFormValues = z.infer<typeof batchSchema>
export type BatchFormInput = z.input<typeof batchSchema>

export const serialNumberSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  serial_no: z.string().min(1, 'Serial number is required'),
  current_warehouse_id: z.string().nullable().optional(),
})
export type SerialNumberFormValues = z.infer<typeof serialNumberSchema>
