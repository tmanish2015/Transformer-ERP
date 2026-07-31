import type { Tables } from '@/types/database.types'

export type PurchaseOrder = Tables<'purchase_orders'>
export type PurchaseOrderItem = Tables<'purchase_order_items'>
export type GoodsReceipt = Tables<'goods_receipts'>
export type GoodsReceiptItem = Tables<'goods_receipt_items'>
export type PurchaseBill = Tables<'purchase_bills'>
export type PurchasePayment = Tables<'purchase_payments'>

export type PoStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'cancelled'

export type BillStatus = 'unpaid' | 'partially_paid' | 'paid'

export const PO_STATUS_LABELS: Record<PoStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  sent: 'Sent',
  partially_received: 'Partially Received',
  received: 'Received',
  cancelled: 'Cancelled',
}

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
}

export interface PurchaseOrderWithRelations extends PurchaseOrder {
  supplier: { id: string; name: string; phone: string | null; email: string | null; gstin: string | null; address: string | null }
  warehouse: { id: string; name: string }
}

export interface PurchaseOrderItemWithProduct extends PurchaseOrderItem {
  product: { id: string; sku: string; name: string; hsn_code: string | null; unit: { short_code: string } }
}

export interface PurchaseBillWithRelations extends PurchaseBill {
  supplier: { id: string; name: string }
  purchase_order: { id: string; po_number: string } | null
}

export function isBillOverdue(bill: Pick<PurchaseBill, 'due_date' | 'status'>): boolean {
  if (bill.status === 'paid' || !bill.due_date) return false
  return new Date(bill.due_date).getTime() < Date.now()
}
