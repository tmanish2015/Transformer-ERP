import { z } from 'zod'

export const industryTypes = [
  { value: 'transformer_repair', label: 'Transformer Repair' },
  { value: 'transformer_manufacturing', label: 'Transformer Manufacturing' },
  { value: 'transformer_rental', label: 'Transformer Rental' },
  { value: 'oil_filtration_rental', label: 'Oil Filtration Machine Rental' },
  { value: 'testing_laboratory', label: 'Electrical Testing Laboratory' },
  { value: 'electrical_services', label: 'Electrical Services / EPC Contractor' },
  { value: 'other', label: 'Other' },
] as const

export const companyOnboardingSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  industryType: z.enum(industryTypes.map((t) => t.value) as [string, ...string[]], {
    message: 'Select your industry type',
  }),
})
export type CompanyOnboardingFormValues = z.infer<typeof companyOnboardingSchema>
