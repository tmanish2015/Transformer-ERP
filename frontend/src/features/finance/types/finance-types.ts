import type { Tables } from '@/types/database.types'

export type ChartOfAccount = Tables<'chart_of_accounts'>
export type JournalEntry = Tables<'journal_entries'>
export type JournalEntryLine = Tables<'journal_entry_lines'>

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'
export type VoucherType = 'journal' | 'receipt' | 'payment' | 'contra'
export type JournalStatus = 'draft' | 'posted' | 'cancelled'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  income: 'Income',
  expense: 'Expense',
}

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  journal: 'Journal',
  receipt: 'Receipt',
  payment: 'Payment',
  contra: 'Contra',
}

export const JOURNAL_STATUS_LABELS: Record<JournalStatus, string> = {
  draft: 'Draft',
  posted: 'Posted',
  cancelled: 'Cancelled',
}

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export interface ChartOfAccountWithChildren extends ChartOfAccount {
  children: ChartOfAccountWithChildren[]
}

export function buildAccountTree(accounts: ChartOfAccount[]): ChartOfAccountWithChildren[] {
  const map = new Map<string, ChartOfAccountWithChildren>(accounts.map((a) => [a.id, { ...a, children: [] }]))
  const roots: ChartOfAccountWithChildren[] = []
  for (const acc of map.values()) {
    if (acc.parent_id && map.has(acc.parent_id)) {
      map.get(acc.parent_id)!.children.push(acc)
    } else {
      roots.push(acc)
    }
  }
  return roots
}

export interface JournalEntryLineWithAccount extends JournalEntryLine {
  account: { id: string; code: string; name: string; account_type: AccountType }
}

export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalEntryLineWithAccount[]
}
