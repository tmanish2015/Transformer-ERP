import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

export async function fetchCompany(companyId: string): Promise<Tables<'companies'>> {
  const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single()
  if (error) throw error
  return data
}

export async function updateCompany(companyId: string, updates: Partial<Tables<'companies'>>) {
  const { error } = await supabase.from('companies').update(updates).eq('id', companyId)
  if (error) throw error
}
