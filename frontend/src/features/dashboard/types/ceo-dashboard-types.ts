export type DashboardPeriod = 'today' | 'week' | 'month' | 'year'

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
}

export interface AgingBucket {
  current: number
  d1_30: number
  d31_60: number
  d60_plus: number
  total: number
}

export interface DashboardInvoice {
  id: string
  invoice_number: string
  invoice_type: string
  invoice_date: string
  due_date: string | null
  total: number
  amount_received: number
  status: string
  customer_id: string
  customer_name: string
  repair_job_id: string | null
  rental_agreement_id: string | null
}

export interface DashboardBill {
  id: string
  bill_number: string
  bill_date: string
  due_date: string | null
  total: number
  amount_paid: number
  status: string
  supplier_id: string
  supplier_name: string
}

export interface DashboardRepairJob {
  id: string
  job_number: string
  status: string
  current_stage: string | null
  customer_id: string
  customer_name: string
  created_at: string
  last_stage_at: string | null
}

export interface DashboardRentalAsset {
  id: string
  asset_code: string
  name: string
  status: string
}

/** Structural lookup ONLY -- resolves which machine a rental invoice belongs to
 * (sales_invoices.rental_agreement_id -> rental_asset_id). We do not use a formal Rental
 * Agreement process, so this intentionally carries no dates/status/customer -- those fields
 * on rental_agreements are unreliable and must never be read by the CEO dashboard. */
export interface DashboardRentalAssetLookup {
  id: string
  rental_asset_id: string
  asset_name: string
}

export interface DashboardRentalBooking {
  id: string
  booking_number: string
  rental_asset_id: string
  asset_name: string
  customer_id: string
  customer_name: string
  start_date: string
  end_date: string
  status: string
}

export interface DashboardStockAlert {
  product_id: string
  sku: string
  name: string
  quantity: number
  reorder_level: number
}
