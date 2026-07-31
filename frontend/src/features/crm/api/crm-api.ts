import { supabase } from '@/lib/supabase'
import type { OpportunityFormValues, SiteSurveyCompletionFormValues, SiteSurveyFormValues } from '@/features/crm/schemas/crm-schemas'
import type { OpportunityStage, OpportunityWithRelations, SiteSurveyWithRelations } from '@/features/crm/types/crm-types'

// ---------- Site Surveys ----------

export async function fetchSiteSurveys(): Promise<SiteSurveyWithRelations[]> {
  const { data, error } = await supabase.from('site_surveys').select('*, customer:customers(id,name)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchSiteSurvey(id: string): Promise<SiteSurveyWithRelations> {
  const { data, error } = await supabase.from('site_surveys').select('*, customer:customers(id,name)').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createSiteSurvey(values: SiteSurveyFormValues) {
  const { data, error } = await supabase
    .from('site_surveys')
    .insert({
      customer_id: values.customer_id,
      scheduled_date: values.scheduled_date || null,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeSiteSurvey(id: string, values: SiteSurveyCompletionFormValues) {
  const { error } = await supabase
    .from('site_surveys')
    .update({ status: 'completed', conducted_date: values.conducted_date, findings: values.findings })
    .eq('id', id)
  if (error) throw error
}

export async function cancelSiteSurvey(id: string) {
  const { error } = await supabase.from('site_surveys').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}

export async function deleteSiteSurvey(id: string) {
  const { error } = await supabase.from('site_surveys').delete().eq('id', id)
  if (error) throw error
}

// ---------- Opportunities ----------

export async function fetchOpportunities(): Promise<OpportunityWithRelations[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, customer:customers(id,name), site_survey:site_surveys(id,survey_number)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchOpportunity(id: string): Promise<OpportunityWithRelations> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, customer:customers(id,name), site_survey:site_surveys(id,survey_number)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createOpportunity(values: OpportunityFormValues) {
  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      customer_id: values.customer_id,
      site_survey_id: values.site_survey_id || null,
      title: values.title,
      estimated_value: values.estimated_value,
      expected_close_date: values.expected_close_date || null,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateOpportunityStage(id: string, stage: OpportunityStage) {
  const { error } = await supabase.from('opportunities').update({ stage }).eq('id', id)
  if (error) throw error
}

export async function deleteOpportunity(id: string) {
  const { error } = await supabase.from('opportunities').delete().eq('id', id)
  if (error) throw error
}
