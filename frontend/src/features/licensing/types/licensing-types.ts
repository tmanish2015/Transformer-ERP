import type { Tables } from '@/types/database.types'

export type Plan = Tables<'plans'>
export type IndustryPack = Tables<'industry_packs'>
export type Module = Tables<'modules'>
export type Feature = Tables<'features'>
export type Addon = Tables<'addons'>
export type LicenseCustomer = Tables<'license_customers'>
export type CustomerSubscription = Tables<'customer_subscriptions'>
export type License = Tables<'licenses'>
export type LicenseLog = Tables<'license_logs'>

export interface EntitlementPlan {
  id: string
  code: string
  name: string
  max_users: number | null
  max_branches: number | null
  max_warehouses: number | null
  storage_limit_gb: number | null
}

/** Shape returned by the get_my_entitlements() RPC. */
export interface Entitlements {
  valid: boolean
  reason?: string
  status?: string
  customer_id?: string
  plan?: EntitlementPlan | null
  subscription_status?: string | null
  trial_ends_at?: string | null
  end_date?: string | null
  license_expires_at?: string | null
  modules?: string[]
  features?: string[]
  addons?: string[]
}

export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  trial: 'Trial',
  active: 'Active',
  suspended: 'Suspended',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  trialing: 'Trialing',
  active: 'Active',
  past_due: 'Past Due',
  suspended: 'Suspended',
  expired: 'Expired',
  cancelled: 'Cancelled',
}
