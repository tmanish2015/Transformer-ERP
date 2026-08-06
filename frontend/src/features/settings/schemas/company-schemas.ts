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

// Fields printed on shared PDFs (invoices, POs, quotations, ledgers) — company header,
// GST/PAN, bank details for payment instructions, terms, and the signatory line.
export const companySettingsSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  company_email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  company_phone: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  logo_url: z.string().optional().or(z.literal('')),
  company_address: z.string().optional().or(z.literal('')),
  gstin: z.string().optional().or(z.literal('')),
  pan_number: z.string().optional().or(z.literal('')),
  bank_name: z.string().optional().or(z.literal('')),
  account_number: z.string().optional().or(z.literal('')),
  ifsc_code: z.string().optional().or(z.literal('')),
  branch_name: z.string().optional().or(z.literal('')),
  authorized_signatory: z.string().optional().or(z.literal('')),
  terms_conditions: z.string().optional().or(z.literal('')),
})
export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>
