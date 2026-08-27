import { supabase } from '@/lib/supabase'
import type {
  DashboardBill,
  DashboardCustomer,
  DashboardInvoice,
  DashboardRentalAssetLookup,
  DashboardRentalAsset,
  DashboardRentalBooking,
  DashboardRepairJob,
  DashboardStockAlert,
} from '@/features/dashboard/types/ceo-dashboard-types'

// Read-only aggregation queries for the CEO/Owner dashboard. Every function here reuses
// tables/columns that already exist for their owning module (sales_invoices, purchase_bills,
// repair_jobs, rental_assets/agreements, products/stock_levels) -- nothing new is written.

export async function fetchDashboardInvoices(): Promise<DashboardInvoice[]> {
  const { data, error } = await supabase
    .from('sales_invoices')
    .select('id, invoice_number, invoice_type, invoice_date, due_date, total, amount_received, status, customer_id, repair_job_id, rental_agreement_id, customer:customers(name)')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    invoice_number: r.invoice_number,
    invoice_type: r.invoice_type,
    invoice_date: r.invoice_date,
    due_date: r.due_date,
    total: r.total,
    amount_received: r.amount_received,
    status: r.status,
    customer_id: r.customer_id,
    customer_name: r.customer?.name ?? 'Unknown',
    repair_job_id: r.repair_job_id,
    rental_agreement_id: r.rental_agreement_id,
  }))
}

export async function fetchDashboardBills(): Promise<DashboardBill[]> {
  const { data, error } = await supabase.from('purchase_bills').select('id, bill_number, bill_date, due_date, total, amount_paid, status, supplier_id, supplier:suppliers(name)')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    bill_number: r.bill_number,
    bill_date: r.bill_date,
    due_date: r.due_date,
    total: r.total,
    amount_paid: r.amount_paid,
    status: r.status,
    supplier_id: r.supplier_id,
    supplier_name: r.supplier?.name ?? 'Unknown',
  }))
}

export async function fetchDashboardRepairJobs(): Promise<DashboardRepairJob[]> {
  const { data: jobs, error } = await supabase.from('repair_jobs').select('id, job_number, status, current_stage, customer_id, created_at, customer:customers(name)')
  if (error) throw error

  const { data: history, error: historyError } = await supabase
    .from('repair_job_stage_history')
    .select('repair_job_id, created_at')
    .order('created_at', { ascending: false })
  if (historyError) throw historyError

  const lastStageByJob = new Map<string, string>()
  for (const h of history ?? []) {
    if (!lastStageByJob.has(h.repair_job_id)) lastStageByJob.set(h.repair_job_id, h.created_at)
  }

  return (jobs ?? []).map((r) => ({
    id: r.id,
    job_number: r.job_number,
    status: r.status,
    current_stage: r.current_stage,
    customer_id: r.customer_id,
    customer_name: r.customer?.name ?? 'Unknown',
    created_at: r.created_at,
    last_stage_at: lastStageByJob.get(r.id) ?? null,
  }))
}

export async function fetchDashboardEstimatesAwaitingApproval(): Promise<number> {
  const { count, error } = await supabase.from('repair_estimates').select('id', { count: 'exact', head: true }).eq('status', 'sent')
  if (error) throw error
  return count ?? 0
}

export async function fetchDashboardRentalAssets(): Promise<DashboardRentalAsset[]> {
  const { data, error } = await supabase.from('rental_assets').select('id, asset_code, name, status')
  if (error) throw error
  return data ?? []
}

/** We do not use a formal Rental Agreement process, so this reads ONLY the id/rental_asset_id
 * columns of rental_agreements -- purely to resolve which machine a rental invoice belongs to
 * via sales_invoices.rental_agreement_id. Dates, status, and customer are deliberately never
 * read here; see DashboardRentalAssetLookup. */
export async function fetchDashboardRentalAssetLookup(): Promise<DashboardRentalAssetLookup[]> {
  const { data, error } = await supabase.from('rental_agreements').select('id, rental_asset_id, rental_asset:rental_assets(name)')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    rental_asset_id: r.rental_asset_id,
    asset_name: r.rental_asset?.name ?? 'Unknown',
  }))
}

// NOTE: rental_bookings.end_date is currently corrupted for every existing row (e.g.
// "60807-02-20") -- same data-quality issue as rental_agreements.end_date, just in a
// different table. status is reliable and is what the dashboard uses to determine "current";
// end_date is fetched but deliberately not rendered anywhere until that data is fixed.
export async function fetchDashboardRentalBookings(): Promise<DashboardRentalBooking[]> {
  const { data, error } = await supabase
    .from('rental_bookings')
    .select('id, booking_number, rental_asset_id, customer_id, start_date, end_date, status, rental_asset:rental_assets(name), customer:customers(name)')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    booking_number: r.booking_number,
    rental_asset_id: r.rental_asset_id,
    asset_name: r.rental_asset?.name ?? 'Unknown',
    customer_id: r.customer_id,
    customer_name: r.customer?.name ?? 'Unknown',
    start_date: r.start_date,
    end_date: r.end_date,
    status: r.status,
  }))
}

export async function fetchDashboardStockAlerts(): Promise<DashboardStockAlert[]> {
  const { data: products, error } = await supabase.from('products').select('id, sku, name, reorder_level, is_active').eq('is_active', true)
  if (error) throw error

  const { data: levels, error: levelsError } = await supabase.from('stock_levels').select('product_id, quantity')
  if (levelsError) throw levelsError

  const qtyByProduct = new Map<string, number>()
  for (const l of levels ?? []) {
    qtyByProduct.set(l.product_id, (qtyByProduct.get(l.product_id) ?? 0) + l.quantity)
  }

  return (products ?? [])
    .map((p) => ({
      product_id: p.id,
      sku: p.sku,
      name: p.name,
      quantity: qtyByProduct.get(p.id) ?? 0,
      reorder_level: p.reorder_level,
    }))
    .filter((p) => p.quantity <= p.reorder_level)
}

export async function fetchDashboardCustomers(): Promise<DashboardCustomer[]> {
  const { data, error } = await supabase.from('customers').select('id, name, created_at')
  if (error) throw error
  return data ?? []
}
