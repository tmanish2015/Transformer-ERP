import { supabase } from '@/lib/supabase'
import type { Entitlements } from '@/features/licensing/types/licensing-types'

/**
 * Resolves the current user's company's entitlements via get_my_entitlements(), which
 * looks up the caller's tenant through current_company_id() server-side — no client-side
 * license-key lookup needed (unlike Tradeflow's single-tenant-per-project model). Returns
 * {valid:false} rather than throwing when the company has no license_customers row yet
 * (e.g. mid-onboarding), so a fresh signup degrades gracefully instead of erroring.
 */
export async function fetchMyEntitlements(): Promise<Entitlements> {
  const { data, error } = await supabase.rpc('get_my_entitlements')
  if (error) throw error
  return data as unknown as Entitlements
}
