import { supabase } from '@/lib/supabase'
import type { CustomerApprovalFormValues, RepairEstimateFormValues, RepairJobFormValues, RepairWarrantyFormValues, StageHistoryFormValues } from '@/features/workshop/schemas/workshop-schemas'
import type { RepairEstimateItemWithProduct, RepairEstimateWithRelations, RepairJobStageHistory, RepairJobWithRelations, RepairWarranty } from '@/features/workshop/types/workshop-types'

// ---------- Repair Jobs ----------

export async function fetchRepairJobs(): Promise<RepairJobWithRelations[]> {
  const { data, error } = await supabase.from('repair_jobs').select('*, customer:customers(id,name)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchRepairJob(id: string): Promise<RepairJobWithRelations> {
  const { data, error } = await supabase.from('repair_jobs').select('*, customer:customers(id,name)').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createRepairJob(values: RepairJobFormValues) {
  const { data, error } = await supabase
    .from('repair_jobs')
    .insert({
      customer_id: values.customer_id,
      transformer_make: values.transformer_make || null,
      transformer_model: values.transformer_model || null,
      transformer_serial_no: values.transformer_serial_no || null,
      transformer_capacity_kva: values.transformer_capacity_kva ?? null,
      complaint: values.complaint,
      pickup_required: values.pickup_required,
      pickup_address: values.pickup_required ? values.pickup_address || null : null,
      pickup_requested_date: values.pickup_required ? values.pickup_requested_date || null : null,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRepairJobStatus(id: string, status: string) {
  const { error } = await supabase.from('repair_jobs').update({ status }).eq('id', id)
  if (error) throw error
}

export async function markPickupCompleted(id: string, pickupCompletedDate: string) {
  const { error } = await supabase.from('repair_jobs').update({ pickup_completed_date: pickupCompletedDate, status: 'inspection' }).eq('id', id)
  if (error) throw error
}

export async function deleteRepairJob(id: string) {
  const { error } = await supabase.from('repair_jobs').delete().eq('id', id)
  if (error) throw error
}

// ---------- Repair Estimates ----------

export async function fetchRepairEstimates(): Promise<RepairEstimateWithRelations[]> {
  const { data, error } = await supabase
    .from('repair_estimates')
    .select('*, repair_job:repair_jobs(id,job_number,customer:customers(id,name))')
    .order('estimate_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchRepairEstimatesForJob(repairJobId: string): Promise<RepairEstimateWithRelations[]> {
  const { data, error } = await supabase
    .from('repair_estimates')
    .select('*, repair_job:repair_jobs(id,job_number,customer:customers(id,name))')
    .eq('repair_job_id', repairJobId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchRepairEstimateItems(estimateId: string): Promise<RepairEstimateItemWithProduct[]> {
  const { data, error } = await supabase
    .from('repair_estimate_items')
    .select('*, product:products(id,sku,name,unit:units(short_code))')
    .eq('repair_estimate_id', estimateId)
  if (error) throw error
  return data
}

export async function createRepairEstimate(values: RepairEstimateFormValues) {
  const { data: estimate, error } = await supabase
    .from('repair_estimates')
    .insert({
      repair_job_id: values.repair_job_id,
      estimate_date: values.estimate_date,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('repair_estimate_items').insert(
    values.items.map((item) => ({
      repair_estimate_id: estimate.id,
      item_type: item.item_type,
      product_id: item.item_type === 'spare_part' ? item.product_id || null : null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      gst_rate: item.gst_rate,
    })),
  )
  if (itemsError) throw itemsError

  await supabase.from('repair_jobs').update({ status: 'inspection' }).eq('id', values.repair_job_id).eq('status', 'received')

  return estimate
}

export async function sendEstimateToCustomer(id: string) {
  const { error } = await supabase.from('repair_estimates').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function recordCustomerApproval(id: string, values: CustomerApprovalFormValues) {
  const { error } = await supabase
    .from('repair_estimates')
    .update({
      status: values.approved ? 'customer_approved' : 'customer_rejected',
      customer_approval_notes: values.notes || null,
      customer_approved_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

// ---------- Repair Job Stage History ----------

export async function fetchStageHistory(repairJobId: string): Promise<RepairJobStageHistory[]> {
  const { data, error } = await supabase.from('repair_job_stage_history').select('*').eq('repair_job_id', repairJobId).order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addStageHistoryEntry(repairJobId: string, values: StageHistoryFormValues) {
  const { error } = await supabase.from('repair_job_stage_history').insert({ repair_job_id: repairJobId, stage: values.stage, notes: values.notes || null })
  if (error) throw error
}

// Company-wide, not job-scoped — used by the Repair TAT report to find each job's
// installation-stage timestamp without one query per job.
export async function fetchAllStageHistory(): Promise<RepairJobStageHistory[]> {
  const { data, error } = await supabase.from('repair_job_stage_history').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// ---------- Repair Invoicing ----------

export async function createRepairInvoice(repairJobId: string) {
  const { data: job, error: jobError } = await supabase.from('repair_jobs').select('customer_id, job_number').eq('id', repairJobId).single()
  if (jobError) throw jobError

  const { data: estimate, error: estimateError } = await supabase
    .from('repair_estimates')
    .select('id')
    .eq('repair_job_id', repairJobId)
    .eq('status', 'customer_approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (estimateError) throw estimateError
  if (!estimate) throw new Error('No customer-approved estimate found for this job')

  const { data: items, error: itemsError } = await supabase.from('repair_estimate_items').select('*').eq('repair_estimate_id', estimate.id)
  if (itemsError) throw itemsError

  const { data: invoice, error } = await supabase
    .from('sales_invoices')
    .insert({ customer_id: job.customer_id, repair_job_id: repairJobId, invoice_type: 'repair', notes: `Repair job ${job.job_number}` })
    .select()
    .single()
  if (error) throw error

  const { error: invoiceItemsError } = await supabase.from('sales_invoice_items').insert(
    items.map((item) => ({
      sales_invoice_id: invoice.id,
      product_id: item.product_id,
      description: item.product_id ? null : item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      gst_rate: item.gst_rate,
    })),
  )
  if (invoiceItemsError) throw invoiceItemsError

  // Items must exist before posting — same reasoning as createSalesInvoice.
  const { error: postError } = await supabase.rpc('post_sales_invoice_to_ledger', { p_invoice_id: invoice.id })
  if (postError) throw postError

  return invoice
}

export async function fetchInvoiceForRepairJob(repairJobId: string) {
  const { data, error } = await supabase.from('sales_invoices').select('*').eq('repair_job_id', repairJobId).maybeSingle()
  if (error) throw error
  return data
}

// ---------- Repair Warranties ----------

export async function fetchRepairWarranty(repairJobId: string): Promise<RepairWarranty | null> {
  const { data, error } = await supabase.from('repair_warranties').select('*').eq('repair_job_id', repairJobId).maybeSingle()
  if (error) throw error
  return data
}

export async function createRepairWarranty(repairJobId: string, values: RepairWarrantyFormValues) {
  // end_date is computed by trg_apply_repair_warranty_end_date (Postgres interval
  // arithmetic clamps month-end overflow correctly; JS Date.setMonth() does not — see
  // 20260806090000_repair_warranties_end_date_fix.sql).
  const { error } = await supabase.from('repair_warranties').insert({
    repair_job_id: repairJobId,
    warranty_months: values.warranty_months,
    terms: values.terms || null,
  })
  if (error) throw error
}
