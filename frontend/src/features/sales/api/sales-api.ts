import { supabase } from '@/lib/supabase'
import type { CustomerFormValues, DeliveryChallanFormValues, QuotationFormValues, SalesInvoiceFormValues, SalesOrderFormValues, SalesPaymentFormValues } from '@/features/sales/schemas/sales-schemas'
import type {
  DeliveryChallanWithRelations,
  QuotationItemWithProduct,
  QuotationWithRelations,
  SalesInvoiceWithRelations,
  SalesOrderItemWithProduct,
  SalesOrderWithRelations,
} from '@/features/sales/types/sales-types'

// ---------- Customers ----------

export async function fetchCustomers() {
  const { data, error } = await supabase.from('customers').select('*').order('name')
  if (error) throw error
  return data
}

export async function createCustomer(values: CustomerFormValues) {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: values.name,
      contact_person: values.contact_person || null,
      email: values.email || null,
      phone: values.phone || null,
      billing_address: values.billing_address || null,
      shipping_address: values.shipping_address || null,
      gstin: values.gstin || null,
      pan_number: values.pan_number || null,
      state: values.state || null,
      state_code: values.state_code || null,
      credit_limit: values.credit_limit,
      credit_days: values.credit_days,
      status: values.status,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCustomer(id: string, values: Partial<CustomerFormValues> & { is_active?: boolean }) {
  const { error } = await supabase.from('customers').update(values).eq('id', id)
  if (error) throw error
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAllCustomers() {
  const { error } = await supabase.from('customers').delete().not('id', 'is', null)
  if (error) throw error
}

// ---------- Quotations ----------

export async function fetchQuotations(): Promise<QuotationWithRelations[]> {
  const { data, error } = await supabase
.from('quotations')
    .select('*, customer:customers(id,name,billing_address,shipping_address,gstin,pan_number,state,state_code,phone,email)')
    .order('quotation_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchQuotationItems(quotationId: string): Promise<QuotationItemWithProduct[]> {
  const { data, error } = await supabase
    .from('quotation_items')
    .select('*, product:products(id,sku,name,hsn_code,unit:units(short_code))')
    .eq('quotation_id', quotationId)
  if (error) throw error
  return data
}

export async function createQuotation(values: QuotationFormValues) {
  const { data: quotation, error } = await supabase
    .from('quotations')
    .insert({
      customer_id: values.customer_id,
      quotation_date: values.quotation_date,
      valid_until: values.valid_until || null,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('quotation_items').insert(
    values.items.map((item) => ({
      quotation_id: quotation.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      gst_rate: item.gst_rate,
    })),
  )
  if (itemsError) throw itemsError

  return quotation
}

export async function updateQuotationStatus(id: string, status: string, extra?: { approved_by?: string; approved_at?: string }) {
  const { error } = await supabase
    .from('quotations')
    .update({ status, ...extra })
    .eq('id', id)
  if (error) throw error
}

export async function deleteQuotation(id: string) {
  const { error } = await supabase.from('quotations').delete().eq('id', id)
  if (error) throw error
}

export async function convertQuotationToSalesOrder(quotationId: string, warehouseId: string, deliveryDate?: string) {
  const { data: quotation, error: quotationError } = await supabase.from('quotations').select('customer_id, notes').eq('id', quotationId).single()
  if (quotationError) throw quotationError

  const { data: items, error: itemsError } = await supabase.from('quotation_items').select('*').eq('quotation_id', quotationId)
  if (itemsError) throw itemsError

  const { data: so, error } = await supabase
    .from('sales_orders')
    .insert({
      customer_id: quotation.customer_id,
      quotation_id: quotationId,
      warehouse_id: warehouseId,
      order_date: new Date().toISOString().slice(0, 10),
      delivery_date: deliveryDate || null,
      notes: quotation.notes,
      status: 'confirmed',
    })
    .select()
    .single()
  if (error) throw error

  const { error: soItemsError } = await supabase.from('sales_order_items').insert(
    items.map((item) => ({
      sales_order_id: so.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      gst_rate: item.gst_rate,
    })),
  )
  if (soItemsError) throw soItemsError

  await updateQuotationStatus(quotationId, 'accepted')

  return so
}

// ---------- Sales Orders ----------

export async function fetchSalesOrders(): Promise<SalesOrderWithRelations[]> {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*, customer:customers(id,name,billing_address,shipping_address,gstin,pan_number,state,state_code,phone,email), warehouse:warehouses(id,name)')
    .order('order_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchSalesOrderItems(salesOrderId: string): Promise<SalesOrderItemWithProduct[]> {
  const { data, error } = await supabase
    .from('sales_order_items')
    .select('*, product:products(id,sku,name,hsn_code,unit:units(short_code))')
    .eq('sales_order_id', salesOrderId)
  if (error) throw error
  return data
}

export async function createSalesOrder(values: SalesOrderFormValues) {
  const { data: so, error } = await supabase
    .from('sales_orders')
    .insert({
      customer_id: values.customer_id,
      warehouse_id: values.warehouse_id,
      order_date: values.order_date,
      delivery_date: values.delivery_date || null,
      notes: values.notes || null,
      status: 'confirmed',
    })
    .select()
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('sales_order_items').insert(
    values.items.map((item) => ({
      sales_order_id: so.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      gst_rate: item.gst_rate,
    })),
  )
  if (itemsError) throw itemsError

  return so
}

export async function cancelSalesOrder(id: string) {
  const { error } = await supabase.from('sales_orders').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}

export async function deleteSalesOrder(id: string) {
  const { error } = await supabase.from('sales_orders').delete().eq('id', id)
  if (error) throw error
}

// ---------- Delivery Challans ----------

export async function fetchDeliverableSalesOrders(): Promise<SalesOrderWithRelations[]> {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*, customer:customers(id,name,billing_address,shipping_address,gstin,pan_number,state,state_code,phone,email), warehouse:warehouses(id,name)')
    .in('status', ['confirmed', 'partially_delivered'])
    .order('order_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchDeliveryChallans(): Promise<DeliveryChallanWithRelations[]> {
  const { data, error } = await supabase
    .from('delivery_challans')
    .select(
      '*, sales_order:sales_orders(id,so_number,customer:customers(id,name,billing_address,shipping_address,gstin,pan_number,state,state_code,phone,email)), warehouse:warehouses(id,name)',
    )
    .order('delivery_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createDeliveryChallan(values: DeliveryChallanFormValues) {
  const itemsToDeliver = values.items.filter((item) => item.quantity_delivered > 0)
  if (itemsToDeliver.length === 0) {
    throw new Error('Enter a quantity to deliver for at least one item')
  }

  const { data: so, error: soError } = await supabase.from('sales_orders').select('warehouse_id').eq('id', values.sales_order_id).single()
  if (soError) throw soError

  const { data: dc, error } = await supabase
    .from('delivery_challans')
    .insert({
      sales_order_id: values.sales_order_id,
      warehouse_id: so.warehouse_id,
      delivery_date: values.delivery_date,
      vehicle_number: values.vehicle_number || null,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('delivery_challan_items').insert(
    itemsToDeliver.map((item) => ({
      delivery_challan_id: dc.id,
      sales_order_item_id: item.sales_order_item_id,
      product_id: item.product_id,
      quantity_delivered: item.quantity_delivered,
    })),
  )
  if (itemsError) throw itemsError

  return dc
}

// ---------- Sales Invoices ----------

export async function fetchInvoiceableSalesOrders(): Promise<SalesOrderWithRelations[]> {
  const { data: invoicedSoIds, error: invoicedError } = await supabase.from('sales_invoices').select('sales_order_id')
  if (invoicedError) throw invoicedError

  const excludeIds = invoicedSoIds.map((i) => i.sales_order_id).filter(Boolean) as string[]

let query = supabase
    .from('sales_orders')
    .select('*, customer:customers(id,name,billing_address,shipping_address,gstin,pan_number,state,state_code,phone,email), warehouse:warehouses(id,name)')
    .in('status', ['delivered', 'partially_delivered', 'confirmed'])
    .order('order_date', { ascending: false })

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchSalesInvoices(): Promise<SalesInvoiceWithRelations[]> {
  const { data, error } = await supabase
.from('sales_invoices')
    .select('*, customer:customers(id,name,billing_address,shipping_address,gstin,pan_number,state,state_code,phone,email), sales_order:sales_orders(id,so_number)')
    .order('invoice_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchSalesInvoiceItems(invoiceId: string) {
  const { data, error } = await supabase
    .from('sales_invoice_items')
    .select('*, product:products(id,sku,name,hsn_code,unit:units(short_code))')
    .eq('sales_invoice_id', invoiceId)
  if (error) throw error
  return data
}

export async function createSalesInvoice(values: SalesInvoiceFormValues) {
  const { data: so, error: soError } = await supabase.from('sales_orders').select('customer_id').eq('id', values.sales_order_id).single()
  if (soError) throw soError

  const { data: soItems, error: soItemsError } = await supabase.from('sales_order_items').select('*').eq('sales_order_id', values.sales_order_id)
  if (soItemsError) throw soItemsError

  const { data: invoice, error } = await supabase
    .from('sales_invoices')
    .insert({
      sales_order_id: values.sales_order_id,
      delivery_challan_id: values.delivery_challan_id || null,
      customer_id: so.customer_id,
      invoice_date: values.invoice_date,
      due_date: values.due_date || null,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('sales_invoice_items').insert(
    soItems.map((item) => ({
      sales_invoice_id: invoice.id,
      sales_order_item_id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      gst_rate: item.gst_rate,
    })),
  )
  if (itemsError) throw itemsError

  // Items must exist before posting — see 20260731091000_sales_gl_posting migration for
  // why this can't just be an AFTER INSERT trigger on sales_invoices.
  const { error: postError } = await supabase.rpc('post_sales_invoice_to_ledger', { p_invoice_id: invoice.id })
  if (postError) throw postError

  await supabase.from('sales_orders').update({ status: 'invoiced' }).eq('id', values.sales_order_id)

  return invoice
}

export async function fetchSalesPayments(invoiceId: string) {
  const { data, error } = await supabase.from('sales_payments').select('*').eq('sales_invoice_id', invoiceId).order('payment_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createSalesPayment(invoiceId: string, values: SalesPaymentFormValues) {
  const { error } = await supabase.from('sales_payments').insert({
    sales_invoice_id: invoiceId,
    payment_date: values.payment_date,
    amount: values.amount,
    payment_method: values.payment_method,
    reference_number: values.reference_number || null,
    notes: values.notes || null,
  })
  if (error) throw error
}
