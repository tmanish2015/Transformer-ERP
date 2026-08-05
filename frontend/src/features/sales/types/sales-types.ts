import type { Tables } from '@/types/database.types'

export type Customer = Tables<'customers'>
export type Quotation = Tables<'quotations'>
export type QuotationItem = Tables<'quotation_items'>
export type SalesOrder = Tables<'sales_orders'>
export type SalesOrderItem = Tables<'sales_order_items'>
export type DeliveryChallan = Tables<'delivery_challans'>
export type DeliveryChallanItem = Tables<'delivery_challan_items'>
export type SalesInvoice = Tables<'sales_invoices'>
export type SalesInvoiceItem = Tables<'sales_invoice_items'>
export type SalesPayment = Tables<'sales_payments'>

export type CustomerStatus = 'lead' | 'prospect' | 'active' | 'inactive' | 'churned'
export type QuotationStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'expired'
export type SoStatus = 'draft' | 'confirmed' | 'partially_delivered' | 'delivered' | 'invoiced' | 'cancelled'
export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid'
export type InvoiceType = 'standard' | 'amc' | 'rental' | 'repair'

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  active: 'Active',
  inactive: 'Inactive',
  churned: 'Churned',
}

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
}

export const SO_STATUS_LABELS: Record<SoStatus, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  partially_delivered: 'Partially Delivered',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  cancelled: 'Cancelled',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  standard: 'Standard',
  amc: 'AMC',
  rental: 'Rental',
  repair: 'Repair',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
}

export interface NamedRef {
  id: string
  name: string
}

export interface CustomerWithTax extends NamedRef {
  billing_address: string | null
  shipping_address: string | null
  gstin: string | null
  pan_number: string | null
  state: string | null
  state_code: string | null
  phone: string | null
  email: string | null
}

export interface QuotationWithRelations extends Quotation {
  customer: CustomerWithTax
}

export interface QuotationItemWithProduct extends QuotationItem {
  product: { id: string; sku: string; name: string; hsn_code: string | null; unit: { short_code: string } }
}

export interface SalesOrderWithRelations extends SalesOrder {
  customer: CustomerWithTax
  warehouse: NamedRef
}

export interface SalesOrderItemWithProduct extends SalesOrderItem {
  product: { id: string; sku: string; name: string; hsn_code: string | null; unit: { short_code: string } }
}

export interface DeliveryChallanWithRelations extends DeliveryChallan {
  sales_order: { id: string; so_number: string; customer: CustomerWithTax }
  warehouse: NamedRef
}

export interface SalesInvoiceWithRelations extends SalesInvoice {
  customer: CustomerWithTax
  sales_order: { id: string; so_number: string } | null
}

export interface SalesInvoiceItemWithProduct extends SalesInvoiceItem {
  product: { id: string; sku: string; name: string; hsn_code: string | null; unit: { short_code: string } } | null
}

export function isInvoiceOverdue(invoice: Pick<SalesInvoice, 'due_date' | 'status'>): boolean {
  if (invoice.status === 'paid' || !invoice.due_date) return false
  return new Date(invoice.due_date).getTime() < Date.now()
}

export function outstandingAmount(invoice: Pick<SalesInvoice, 'total' | 'amount_received'>): number {
  return invoice.total - invoice.amount_received
}
