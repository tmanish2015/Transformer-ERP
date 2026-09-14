// Read-only aggregation layer for the Customer 360 dashboard. Every function here
// filters an EXISTING table by customer_id (directly, or via an inner join for tables
// that only reference a customer indirectly) -- no new tables, no duplicated data.
// RLS (company_id = current_company_id()) already scopes every one of these queries;
// nothing here adds an explicit company_id filter, matching how every other API file
// in this codebase relies on RLS alone.
import { supabase } from '@/lib/supabase'
import type { Customer } from '@/features/sales/types/sales-types'
import type { OpportunityWithRelations, SiteSurveyWithRelations } from '@/features/crm/types/crm-types'
import type { Quotation, SalesOrder, SalesInvoice, SalesPayment } from '@/features/sales/types/sales-types'
import type { TransformerWithCustomer } from '@/features/transformer/types/transformer-types'
import type { RentalInquiryWithRelations, RentalQuotationWithRelations, RentalBookingWithRelations, RentalAgreementWithRelations } from '@/features/rental/types/rental-types'
import type { RepairJob, RepairEstimate } from '@/features/workshop/types/workshop-types'
import type { TestReportWithRelations } from '@/features/testing-lab/types/testing-lab-types'

export async function fetchCustomerById(customerId: string): Promise<Customer> {
  const { data, error } = await supabase.from('customers').select('*').eq('id', customerId).single()
  if (error) throw error
  return data
}

export async function fetchSalesOrdersForCustomer(customerId: string): Promise<SalesOrder[]> {
  const { data, error } = await supabase.from('sales_orders').select('*').eq('customer_id', customerId).order('order_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchSalesInvoicesForCustomer(customerId: string): Promise<SalesInvoice[]> {
  const { data, error } = await supabase.from('sales_invoices').select('*').eq('customer_id', customerId).order('invoice_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchSalesPaymentsForCustomer(customerId: string): Promise<(SalesPayment & { sales_invoice: { invoice_number: string } })[]> {
  const { data, error } = await supabase
    .from('sales_payments')
    .select('*, sales_invoice:sales_invoices!inner(invoice_number, customer_id)')
    .eq('sales_invoice.customer_id', customerId)
    .order('payment_date', { ascending: false })
  if (error) throw error
  return data as (SalesPayment & { sales_invoice: { invoice_number: string } })[]
}

export async function fetchRentalBookingsForCustomer(customerId: string): Promise<RentalBookingWithRelations[]> {
  const { data, error } = await supabase
    .from('rental_bookings')
    .select('*, customer:customers(id,name), rental_asset:rental_assets(id,asset_code,name,daily_rental_rate), rental_quotation:rental_quotations(id,quotation_number)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as RentalBookingWithRelations[]
}

export async function fetchRepairJobsForCustomer(customerId: string): Promise<RepairJob[]> {
  const { data, error } = await supabase.from('repair_jobs').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchOpportunitiesForCustomer(customerId: string): Promise<OpportunityWithRelations[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, customer:customers(id,name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as OpportunityWithRelations[]
}

export async function fetchSiteSurveysForCustomer(customerId: string): Promise<SiteSurveyWithRelations[]> {
  const { data, error } = await supabase
    .from('site_surveys')
    .select('*, customer:customers(id,name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as SiteSurveyWithRelations[]
}

export async function fetchQuotationsForCustomer(customerId: string): Promise<Quotation[]> {
  const { data, error } = await supabase.from('quotations').select('*').eq('customer_id', customerId).order('quotation_date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchTransformersForCustomer(customerId: string): Promise<TransformerWithCustomer[]> {
  const { data, error } = await supabase
    .from('transformers')
    .select('*, customer:customers(id,name)')
    .eq('customer_id', customerId)
    .order('registration_no')
  if (error) throw error
  return data as TransformerWithCustomer[]
}

export async function fetchRentalInquiriesForCustomer(customerId: string): Promise<RentalInquiryWithRelations[]> {
  const { data, error } = await supabase
    .from('rental_inquiries')
    .select('*, customer:customers(id,name), category:rental_asset_categories(id,name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as RentalInquiryWithRelations[]
}

export async function fetchRentalQuotationsForCustomer(customerId: string): Promise<RentalQuotationWithRelations[]> {
  const { data, error } = await supabase
    .from('rental_quotations')
    .select('*, customer:customers(id,name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as RentalQuotationWithRelations[]
}

export async function fetchRentalAgreementsForCustomer(customerId: string): Promise<RentalAgreementWithRelations[]> {
  const { data, error } = await supabase
    .from('rental_agreements')
    .select('*, customer:customers(id,name), rental_asset:rental_assets(id,asset_code,name,status), rental_booking:rental_bookings(id,booking_number)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as RentalAgreementWithRelations[]
}

export async function fetchRepairEstimatesForCustomer(customerId: string): Promise<(RepairEstimate & { repair_job: { id: string; job_number: string } })[]> {
  const { data, error } = await supabase
    .from('repair_estimates')
    .select('*, repair_job:repair_jobs!inner(id, job_number, customer_id)')
    .eq('repair_job.customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as (RepairEstimate & { repair_job: { id: string; job_number: string } })[]
}

export interface TestReportWithCertificate extends TestReportWithRelations {
  test_certificate: { id: string; certificate_number: string; storage_path: string } | null
}

export async function fetchTestReportsForCustomer(customerId: string): Promise<TestReportWithCertificate[]> {
  const { data, error } = await supabase
    .from('test_reports')
    .select('*, customer:customers(id,name), repair_job:repair_jobs(id,job_number), production_order:production_orders(id,order_number), test_type:test_types(id,name,code), test_certificate:test_certificates(id,certificate_number,storage_path)')
    .eq('customer_id', customerId)
    .order('tested_at', { ascending: false })
  if (error) throw error
  return data as unknown as TestReportWithCertificate[]
}
