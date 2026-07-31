import { supabase } from '@/lib/supabase'
import type { CompanyOnboardingFormValues } from '@/features/settings/schemas/company-schemas'

export async function createCompanyAndAdmin(values: CompanyOnboardingFormValues) {
  const { data, error } = await supabase.rpc('create_company_and_admin', {
    p_company_name: values.companyName,
    p_industry_type: values.industryType,
  })
  if (error) throw error
  return data
}
