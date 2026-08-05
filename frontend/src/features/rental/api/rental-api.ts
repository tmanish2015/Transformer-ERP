import { supabase } from '@/lib/supabase'
import { createTrip } from '@/features/logistics/api/logistics-api'
import type {
  RentalAgreementFormValues,
  RentalAssetCategoryFormValues,
  RentalAssetFormValues,
  RentalBookingFormValues,
  RentalDamageAssessmentFormValues,
  RentalDispatchFormValues,
  RentalInquiryFormValues,
  RentalInspectionFormValues,
  RentalQuotationFormValues,
  RentalReturnFormValues,
} from '@/features/rental/schemas/rental-schemas'
import type {
  RentalAgreementWithRelations,
  RentalAssetCategory,
  RentalAssetStatusLog,
  RentalAssetWithCategory,
  RentalBookingWithRelations,
  RentalDamageAssessment,
  RentalDispatch,
  RentalInquiryWithRelations,
  RentalInspection,
  RentalQuotationItemWithAsset,
  RentalQuotationWithRelations,
  RentalReturn,
} from '@/features/rental/types/rental-types'

// ---------- Asset Categories ----------

export async function fetchRentalAssetCategories(): Promise<RentalAssetCategory[]> {
  const { data, error } = await supabase.from('rental_asset_categories').select('*').order('name')
  if (error) throw error
  return data
}

export async function createRentalAssetCategory(values: RentalAssetCategoryFormValues) {
  const { data, error } = await supabase
    .from('rental_asset_categories')
    .insert({ name: values.name, description: values.description || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRentalAssetCategory(id: string, values: Partial<RentalAssetCategoryFormValues> & { is_active?: boolean }) {
  const { data, error } = await supabase
    .from('rental_asset_categories')
    .update({
      ...(values.name !== undefined ? { name: values.name } : {}),
      ...(values.description !== undefined ? { description: values.description || null } : {}),
      ...(values.is_active !== undefined ? { is_active: values.is_active } : {}),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRentalAssetCategory(id: string) {
  const { error } = await supabase.from('rental_asset_categories').delete().eq('id', id)
  if (error) throw error
}

// ---------- Assets ----------

export async function fetchRentalAssets(): Promise<RentalAssetWithCategory[]> {
  const { data, error } = await supabase.from('rental_assets').select('*, category:rental_asset_categories(id,name)').order('name')
  if (error) throw error
  return data
}

export async function fetchAvailableRentalAssets(): Promise<RentalAssetWithCategory[]> {
  const { data, error } = await supabase.from('rental_assets').select('*, category:rental_asset_categories(id,name)').eq('status', 'available').order('name')
  if (error) throw error
  return data
}

export async function fetchRentalAsset(id: string): Promise<RentalAssetWithCategory> {
  const { data, error } = await supabase.from('rental_assets').select('*, category:rental_asset_categories(id,name)').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createRentalAsset(values: RentalAssetFormValues) {
  const { data, error } = await supabase
    .from('rental_assets')
    .insert({
      category_id: values.category_id || null,
      name: values.name,
      serial_number: values.serial_number || null,
      current_location: values.current_location || null,
      purchase_cost: values.purchase_cost ?? null,
      daily_rental_rate: values.daily_rental_rate,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRentalAsset(id: string, values: Partial<RentalAssetFormValues>) {
  const { data, error } = await supabase
    .from('rental_assets')
    .update({
      ...(values.category_id !== undefined ? { category_id: values.category_id || null } : {}),
      ...(values.name !== undefined ? { name: values.name } : {}),
      ...(values.serial_number !== undefined ? { serial_number: values.serial_number || null } : {}),
      ...(values.current_location !== undefined ? { current_location: values.current_location || null } : {}),
      ...(values.purchase_cost !== undefined ? { purchase_cost: values.purchase_cost ?? null } : {}),
      ...(values.daily_rental_rate !== undefined ? { daily_rental_rate: values.daily_rental_rate } : {}),
      ...(values.notes !== undefined ? { notes: values.notes || null } : {}),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRentalAsset(id: string) {
  const { error } = await supabase.from('rental_assets').delete().eq('id', id)
  if (error) throw error
}

export async function fetchRentalAssetStatusLog(assetId: string): Promise<RentalAssetStatusLog[]> {
  const { data, error } = await supabase.from('rental_asset_status_log').select('*').eq('rental_asset_id', assetId).order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// Company-wide, not asset-scoped — used by the Idle Machine report to find each
// asset's most recent status change without one query per asset.
export async function fetchAllRentalAssetStatusLog(): Promise<RentalAssetStatusLog[]> {
  const { data, error } = await supabase.from('rental_asset_status_log').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// ---------- Inquiries ----------

export async function fetchRentalInquiries(): Promise<RentalInquiryWithRelations[]> {
  const { data, error } = await supabase
    .from('rental_inquiries')
    .select('*, customer:customers(id,name), category:rental_asset_categories(id,name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createRentalInquiry(values: RentalInquiryFormValues) {
  const { data, error } = await supabase
    .from('rental_inquiries')
    .insert({
      customer_id: values.customer_id,
      category_id: values.category_id || null,
      requirement: values.requirement,
      required_from: values.required_from || null,
      required_to: values.required_to || null,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function closeRentalInquiry(id: string) {
  const { error } = await supabase.from('rental_inquiries').update({ status: 'closed' }).eq('id', id)
  if (error) throw error
}

// ---------- Quotations ----------

export async function fetchRentalQuotations(): Promise<RentalQuotationWithRelations[]> {
  const { data, error } = await supabase
    .from('rental_quotations')
    .select('*, customer:customers(id,name), rental_inquiry:rental_inquiries(id,inquiry_number)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchRentalQuotationItems(quotationId: string): Promise<RentalQuotationItemWithAsset[]> {
  const { data, error } = await supabase
    .from('rental_quotation_items')
    .select('*, rental_asset:rental_assets(id,asset_code,name)')
    .eq('rental_quotation_id', quotationId)
  if (error) throw error
  return data
}

export async function createRentalQuotation(values: RentalQuotationFormValues) {
  const { data: quotation, error } = await supabase
    .from('rental_quotations')
    .insert({
      customer_id: values.customer_id,
      rental_inquiry_id: values.rental_inquiry_id || null,
      quotation_date: values.quotation_date,
      valid_until: values.valid_until || null,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('rental_quotation_items').insert(
    values.items.map((item) => ({
      rental_quotation_id: quotation.id,
      rental_asset_id: item.rental_asset_id,
      rental_days: item.rental_days,
      daily_rate: item.daily_rate,
      gst_rate: item.gst_rate,
    })),
  )
  if (itemsError) throw itemsError

  return quotation
}

export async function sendRentalQuotation(id: string) {
  const { error } = await supabase.from('rental_quotations').update({ status: 'sent' }).eq('id', id)
  if (error) throw error
}

// ---------- Bookings ----------

export async function fetchRentalBookings(): Promise<RentalBookingWithRelations[]> {
  const { data, error } = await supabase
    .from('rental_bookings')
    .select('*, customer:customers(id,name), rental_asset:rental_assets(id,asset_code,name), rental_quotation:rental_quotations(id,quotation_number)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createRentalBooking(customerId: string, values: RentalBookingFormValues, rentalQuotationId?: string) {
  const { data, error } = await supabase
    .from('rental_bookings')
    .insert({
      customer_id: customerId,
      rental_asset_id: values.rental_asset_id,
      start_date: values.start_date,
      end_date: values.end_date,
      notes: values.notes || null,
      rental_quotation_id: rentalQuotationId || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cancelRentalBooking(id: string) {
  const { error } = await supabase.from('rental_bookings').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}

// ---------- Agreements ----------

export async function fetchRentalAgreements(): Promise<RentalAgreementWithRelations[]> {
  const { data, error } = await supabase
    .from('rental_agreements')
    .select('*, customer:customers(id,name), rental_asset:rental_assets(id,asset_code,name,status), rental_booking:rental_bookings(id,booking_number)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchRentalAgreement(id: string): Promise<RentalAgreementWithRelations> {
  const { data, error } = await supabase
    .from('rental_agreements')
    .select('*, customer:customers(id,name), rental_asset:rental_assets(id,asset_code,name,status), rental_booking:rental_bookings(id,booking_number)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createRentalAgreement(booking: RentalBookingWithRelations, values: RentalAgreementFormValues) {
  const { data, error } = await supabase
    .from('rental_agreements')
    .insert({
      rental_booking_id: booking.id,
      customer_id: booking.customer_id,
      rental_asset_id: booking.rental_asset_id,
      start_date: booking.start_date,
      end_date: booking.end_date,
      security_deposit: values.security_deposit,
      late_return_charge_rate: values.late_return_charge_rate,
      operator_provided: values.operator_provided,
      operator_charge_rate: values.operator_charge_rate,
      fuel_charge_rate: values.fuel_charge_rate,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------- Dispatch ----------

export async function fetchRentalDispatchForAgreement(agreementId: string): Promise<RentalDispatch | null> {
  const { data, error } = await supabase.from('rental_dispatches').select('*').eq('rental_agreement_id', agreementId).maybeSingle()
  if (error) throw error
  return data
}

export async function createRentalDispatch(agreementId: string, values: RentalDispatchFormValues) {
  const { data: dispatch, error } = await supabase
    .from('rental_dispatches')
    .insert({ rental_agreement_id: agreementId, dispatch_condition_notes: values.dispatch_condition_notes || null })
    .select()
    .single()
  if (error) throw error

  const trip = await createTrip('delivery', 'rental_dispatch', dispatch.id, {
    vehicle_id: values.vehicle_id,
    driver_id: values.driver_id,
    notes: values.dispatch_condition_notes,
  })

  const { data: updatedDispatch, error: updateError } = await supabase.from('rental_dispatches').update({ trip_id: trip.id }).eq('id', dispatch.id).select().single()
  if (updateError) throw updateError
  return updatedDispatch
}

// ---------- Return ----------

export async function fetchRentalReturnForAgreement(agreementId: string): Promise<RentalReturn | null> {
  const { data, error } = await supabase.from('rental_returns').select('*').eq('rental_agreement_id', agreementId).maybeSingle()
  if (error) throw error
  return data
}

export async function createRentalReturn(agreementId: string, values: RentalReturnFormValues) {
  const { data: rentalReturn, error } = await supabase
    .from('rental_returns')
    .insert({ rental_agreement_id: agreementId, return_condition_notes: values.return_condition_notes || null })
    .select()
    .single()
  if (error) throw error

  const trip = await createTrip('pickup', 'rental_return', rentalReturn.id, {
    vehicle_id: values.vehicle_id,
    driver_id: values.driver_id,
    notes: values.return_condition_notes,
  })

  const { data: updatedReturn, error: updateError } = await supabase.from('rental_returns').update({ trip_id: trip.id }).eq('id', rentalReturn.id).select().single()
  if (updateError) throw updateError
  return updatedReturn
}

// ---------- Inspection ----------

export async function fetchRentalInspectionForReturn(returnId: string): Promise<RentalInspection | null> {
  const { data, error } = await supabase.from('rental_inspections').select('*').eq('rental_return_id', returnId).maybeSingle()
  if (error) throw error
  return data
}

export async function createRentalInspection(returnId: string, values: RentalInspectionFormValues) {
  const { data, error } = await supabase
    .from('rental_inspections')
    .insert({ rental_return_id: returnId, condition_rating: values.condition_rating, notes: values.notes || null })
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------- Damage Assessments ----------

export async function fetchDamageAssessmentsForInspection(inspectionId: string): Promise<RentalDamageAssessment[]> {
  const { data, error } = await supabase.from('rental_damage_assessments').select('*').eq('rental_inspection_id', inspectionId).order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createRentalDamageAssessment(inspectionId: string, values: RentalDamageAssessmentFormValues) {
  const { data, error } = await supabase
    .from('rental_damage_assessments')
    .insert({
      rental_inspection_id: inspectionId,
      description: values.description,
      estimated_repair_cost: values.estimated_repair_cost,
      charged_to_customer: values.charged_to_customer,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------- Rental Invoicing ----------

export async function fetchInvoiceForRentalAgreement(agreementId: string) {
  const { data, error } = await supabase.from('sales_invoices').select('*').eq('rental_agreement_id', agreementId).maybeSingle()
  if (error) throw error
  return data
}

export async function createRentalInvoice(agreement: RentalAgreementWithRelations) {
  // Build the invoice line items from the calculate_rental_invoice RPC. This is the
  // single source of truth for the rental line arithmetic (base rental, operator/fuel
  // charges, late-return charge, and customer-chargeable damage items) — the frontend
  // does not duplicate it. The RPC looks up the asset's daily rate via rental_asset_id.
  const { data: lines, error: rpcError } = await supabase.rpc('calculate_rental_invoice', {
    p_agreement_id: agreement.id,
  })
  if (rpcError) throw rpcError

  const lineItems = (lines ?? []) as { description: string; quantity: number; unit_price: number; gst_rate: number }[]

  const { data: invoice, error } = await supabase
    .from('sales_invoices')
    .insert({ customer_id: agreement.customer_id, rental_agreement_id: agreement.id, invoice_type: 'rental', notes: `Rental agreement ${agreement.agreement_number}` })
    .select()
    .single()
  if (error) throw error

const { error: itemsError } = await supabase.from('sales_invoice_items').insert(
    lineItems.map((line) => ({
      sales_invoice_id: invoice.id,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      gst_rate: line.gst_rate,
    })),
  )
  if (itemsError) throw itemsError

  const { error: postError } = await supabase.rpc('post_sales_invoice_to_ledger', { p_invoice_id: invoice.id })
  if (postError) throw postError

  return invoice
}
