import { z } from 'zod'

export const poItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit_price: z.coerce.number().min(0),
  gst_rate: z.coerce.number().min(0).max(100),
})

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  order_date: z.string().min(1, 'Order date is required'),
  expected_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(poItemSchema).min(1, 'Add at least one line item'),
})
export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>
export type PurchaseOrderFormInput = z.input<typeof purchaseOrderSchema>

export const receiveItemSchema = z.object({
  purchase_order_item_id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  hsn_code: z.string().nullable().optional(),
  outstanding: z.number(),
  quantity_received: z.coerce.number().min(0),
})

export const goodsReceiptSchema = z.object({
  purchase_order_id: z.string().min(1, 'Purchase order is required'),
  received_date: z.string().min(1, 'Received date is required'),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(receiveItemSchema).min(1),
})
export type GoodsReceiptFormValues = z.infer<typeof goodsReceiptSchema>
export type GoodsReceiptFormInput = z.input<typeof goodsReceiptSchema>

export const purchaseBillSchema = z.object({
  purchase_order_id: z.string().min(1, 'Purchase order is required'),
  bill_date: z.string().min(1, 'Bill date is required'),
  due_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})
export type PurchaseBillFormValues = z.infer<typeof purchaseBillSchema>
export type PurchaseBillFormInput = z.input<typeof purchaseBillSchema>

export const purchasePaymentSchema = z.object({
  payment_date: z.string().min(1, 'Payment date is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payment_method: z.enum(['cash', 'bank_transfer', 'cheque', 'upi']),
  reference_number: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})
export type PurchasePaymentFormValues = z.infer<typeof purchasePaymentSchema>
export type PurchasePaymentFormInput = z.input<typeof purchasePaymentSchema>
