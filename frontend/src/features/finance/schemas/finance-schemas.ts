import { z } from 'zod'

export const accountSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  account_type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  account_group: z.enum([
    'current_asset',
    'fixed_asset',
    'current_liability',
    'long_term_liability',
    'capital',
    'direct_income',
    'indirect_income',
    'direct_expense',
    'indirect_expense',
    'cogs',
  ]),
  parent_id: z.string().optional().or(z.literal('')),
  is_group: z.boolean(),
  opening_balance: z.coerce.number().min(0).optional(),
  opening_balance_type: z.enum(['debit', 'credit']),
})
export type AccountFormValues = z.infer<typeof accountSchema>
export type AccountFormInput = z.input<typeof accountSchema>

export const journalLineSchema = z.object({
  account_id: z.string().min(1, 'Account is required'),
  debit: z.coerce.number().min(0).optional(),
  credit: z.coerce.number().min(0).optional(),
  description: z.string().optional().or(z.literal('')),
})

export const journalEntrySchema = z
  .object({
    entry_date: z.string().min(1, 'Date is required'),
    narration: z.string().optional().or(z.literal('')),
    lines: z.array(journalLineSchema).min(2, 'Add at least two lines'),
  })
  .refine(
    (data) => {
      const totalDebit = data.lines.reduce((sum, l) => sum + (l.debit || 0), 0)
      const totalCredit = data.lines.reduce((sum, l) => sum + (l.credit || 0), 0)
      return Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0
    },
    { message: 'Total debit must equal total credit and be greater than zero', path: ['lines'] },
  )
export type JournalEntryFormValues = z.infer<typeof journalEntrySchema>
export type JournalEntryFormInput = z.input<typeof journalEntrySchema>
