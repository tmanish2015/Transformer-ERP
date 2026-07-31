import type { Tables } from '@/types/database.types'

export type SiteSurvey = Tables<'site_surveys'>
export type Opportunity = Tables<'opportunities'>

export type SiteSurveyStatus = 'scheduled' | 'completed' | 'cancelled'
export type OpportunityStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

export const SITE_SURVEY_STATUS_LABELS: Record<SiteSurveyStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const OPPORTUNITY_STAGE_ORDER: OpportunityStage[] = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export interface NamedRef {
  id: string
  name: string
}

export interface SiteSurveyWithRelations extends SiteSurvey {
  customer: NamedRef
}

export interface OpportunityWithRelations extends Opportunity {
  customer: NamedRef
  site_survey: { id: string; survey_number: string } | null
}
