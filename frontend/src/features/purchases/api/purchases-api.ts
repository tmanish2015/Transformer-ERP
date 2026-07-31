import { supabase } from '@/lib/supabase'
import type { GoodsReceiptFormValues, PurchaseBillFormValues, PurchaseOrderFormValues, PurchasePaymentFormValues } from '@/features/purchases/schemas/purchase-schemas'
import type { PurchaseOrderItemWithProduct, PurchaseOrderWithRelations } from '@/features/purchases/types/purchase-types'

export async function fetchPurchaseOrders(): Promise<PurchaseOrderWithRelations[]> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(id,name,phone,email,gstin,address), warehouse:warehouses(id,name)')
    .order('order_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchPurchaseOrderItems(purchaseOrderId: string): Promise<PurchaseOrderItemWithProduct[]> {
  const { data, error } = await supabase
    .from('purchase_order_items')
    .select('*, product:products(id,sku,name,hsn_code,unit:units(short_code))')
    .eq('purchase_order_id', purchaseOrderId)
  if (error) throw error
  return data
}

export async function createPurchaseOrder(values: PurchaseOrderFormValues) {
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert({
      supplier_id: values.supplier_id,
      warehouse_id: values.warehouse_id,
      order_date: values.order_date,
      expected_date: values.expected_date || null,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('purchase_order_items').insert(
    values.items.map((item) => ({
      purchase_order_id: po.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      gst_rate: item.gst_rate,
    })),
  )
  if (itemsError) throw itemsError

  return po
}

export async function updatePurchaseOrderStatus(id: string, status: string, extra?: { approved_by?: string; approved_at?: string }) {
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status, ...extra })
    .eq('id', id)
  if (error) throw error
}

export async function deletePurchaseOrder(id: string) {
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
  if (error) throw error
}

export async function fetchReceivablePOs(): Promise<PurchaseOrderWithRelations[]> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(id,name,phone,email,gstin,address), warehouse:warehouses(id,name)')
    .in('status', ['approved', 'sent', 'partially_received'])
    .order('order_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createGoodsReceipt(values: GoodsReceiptFormValues) {
  const itemsToReceive = values.items.filter((item) => item.quantity_received > 0)
  if (itemsToReceive.length === 0) {
    throw new Error('Enter a received quantity for at least one item')
  }

  const { data: po, error: poError } = await supabase.from('purchase_orders').select('warehouse_id').eq('id', values.purchase_order_id).single()
  if (poError) throw poError

  const { data: grn, error } = await supabase
    .from('goods_receipts')
    .insert({
      purchase_order_id: values.purchase_order_id,
      warehouse_id: po.warehouse_id,
      received_date: values.received_date,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('goods_receipt_items').insert(
    itemsToReceive.map((item) => ({
      goods_receipt_id: grn.id,
      purchase_order_item_id: item.purchase_order_item_id,
      product_id: item.product_id,
      quantity_received: item.quantity_received,
    })),
  )
  if (itemsError) throw itemsError

  return grn
}

export async function fetchGoodsReceipts() {
  const { data, error } = await supabase
    .from('goods_receipts')
    .select('*, purchase_order:purchase_orders(id,po_number,supplier:suppliers(id,name)), warehouse:warehouses(id,name)')
    .order('received_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchBillablePOs(): Promise<PurchaseOrderWithRelations[]> {
  const { data: billedPoIds, error: billedError } = await supabase.from('purchase_bills').select('purchase_order_id')
  if (billedError) throw billedError

  const excludeIds = billedPoIds.map((b) => b.purchase_order_id).filter(Boolean) as string[]

  let query = supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(id,name,phone,email,gstin,address), warehouse:warehouses(id,name)')
    .in('status', ['received', 'partially_received'])
    .order('order_date', { ascending: false })

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchPurchaseBills() {
  const { data, error } = await supabase
    .from('purchase_bills')
    .select('*, supplier:suppliers(id,name), purchase_order:purchase_orders(id,po_number)')
    .order('bill_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createPurchaseBill(values: PurchaseBillFormValues) {
  const { data: po, error: poError } = await supabase.from('purchase_orders').select('supplier_id, subtotal, tax_total, total').eq('id', values.purchase_order_id).single()
  if (poError) throw poError

  const { data: bill, error } = await supabase
    .from('purchase_bills')
    .insert({
      purchase_order_id: values.purchase_order_id,
      supplier_id: po.supplier_id,
      bill_date: values.bill_date,
      due_date: values.due_date || null,
      subtotal: po.subtotal,
      tax_total: po.tax_total,
      total: po.total,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return bill
}

export async function fetchPurchasePayments(billId: string) {
  const { data, error } = await supabase.from('purchase_payments').select('*').eq('purchase_bill_id', billId).order('payment_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createPurchasePayment(billId: string, values: PurchasePaymentFormValues) {
  const { error } = await supabase.from('purchase_payments').insert({
    purchase_bill_id: billId,
    payment_date: values.payment_date,
    amount: values.amount,
    payment_method: values.payment_method,
    reference_number: values.reference_number || null,
    notes: values.notes || null,
  })
  if (error) throw error
}
