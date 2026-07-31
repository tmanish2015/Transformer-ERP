import { z } from 'zod'

export const siteSurveySchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  scheduled_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})
export type SiteSurveyFormValues = z.infer<typeof siteSurveySchema>

export const siteSurveyCompletionSchema = z.object({
  conducted_date: z.string().min(1, 'Conducted date is required'),
  findings: z.string().min(1, 'Findings are required'),
})
export type SiteSurveyCompletionFormValues = z.infer<typeof siteSurveyCompletionSchema>

export const opportunitySchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  site_survey_id: z.string().optional().or(z.literal('')),
  title: z.string().min(1, 'Title is required'),
  estimated_value: z.coerce.number().min(0),
  expected_close_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})
export type OpportunityFormValues = z.infer<typeof opportunitySchema>
export type OpportunityFormInput = z.input<typeof opportunitySchema>
