import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact_person: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  billing_address: z.string().optional().or(z.literal('')),
  shipping_address: z.string().optional().or(z.literal('')),
  gstin: z.string().optional().or(z.literal('')),
  credit_limit: z.coerce.number().min(0),
  credit_days: z.coerce.number().min(0),
  status: z.enum(['lead', 'prospect', 'active', 'inactive', 'churned']),
})
export type CustomerFormValues = z.infer<typeof customerSchema>
export type CustomerFormInput = z.input<typeof customerSchema>

export const quotationItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit_price: z.coerce.number().min(0),
  discount_percent: z.coerce.number().min(0).max(100),
  gst_rate: z.coerce.number().min(0).max(100),
})

export const quotationSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  quotation_date: z.string().min(1, 'Quotation date is required'),
  valid_until: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(quotationItemSchema).min(1, 'Add at least one line item'),
})
export type QuotationFormValues = z.infer<typeof quotationSchema>
export type QuotationFormInput = z.input<typeof quotationSchema>

export const salesOrderItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit_price: z.coerce.number().min(0),
  discount_percent: z.coerce.number().min(0).max(100),
  gst_rate: z.coerce.number().min(0).max(100),
})

export const salesOrderSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  order_date: z.string().min(1, 'Order date is required'),
  delivery_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(salesOrderItemSchema).min(1, 'Add at least one line item'),
})
export type SalesOrderFormValues = z.infer<typeof salesOrderSchema>
export type SalesOrderFormInput = z.input<typeof salesOrderSchema>

export const deliverItemSchema = z.object({
  sales_order_item_id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  hsn_code: z.string().nullable().optional(),
  outstanding: z.number(),
  quantity_delivered: z.coerce.number().min(0),
})

export const deliveryChallanSchema = z.object({
  sales_order_id: z.string().min(1, 'Sales order is required'),
  delivery_date: z.string().min(1, 'Delivery date is required'),
  vehicle_number: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(deliverItemSchema).min(1),
})
export type DeliveryChallanFormValues = z.infer<typeof deliveryChallanSchema>
export type DeliveryChallanFormInput = z.input<typeof deliveryChallanSchema>

export const salesInvoiceSchema = z.object({
  sales_order_id: z.string().min(1, 'Sales order is required'),
  delivery_challan_id: z.string().optional().or(z.literal('')),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})
export type SalesInvoiceFormValues = z.infer<typeof salesInvoiceSchema>
export type SalesInvoiceFormInput = z.input<typeof salesInvoiceSchema>

export const salesPaymentSchema = z.object({
  payment_date: z.string().min(1, 'Payment date is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payment_method: z.enum(['cash', 'bank_transfer', 'cheque', 'upi']),
  reference_number: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})
export type SalesPaymentFormValues = z.infer<typeof salesPaymentSchema>
export type SalesPaymentFormInput = z.input<typeof salesPaymentSchema>
