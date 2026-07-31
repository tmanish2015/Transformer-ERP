import { supabase } from '@/lib/supabase'
import type { AccountFormValues, JournalEntryFormValues } from '@/features/finance/schemas/finance-schemas'
import type { JournalEntryLineWithAccount, JournalEntryWithLines } from '@/features/finance/types/finance-types'

// ---------- Chart of Accounts ----------

export async function fetchChartOfAccounts() {
  const { data, error } = await supabase.from('chart_of_accounts').select('*').order('code')
  if (error) throw error
  return data
}

export async function createAccount(values: AccountFormValues) {
  const { error } = await supabase.from('chart_of_accounts').insert({
    code: values.code,
    name: values.name,
    account_type: values.account_type,
    account_group: values.account_group,
    parent_id: values.parent_id || null,
    is_group: values.is_group,
    opening_balance: values.opening_balance ?? 0,
    opening_balance_type: values.opening_balance_type,
  })
  if (error) throw error
}

export async function updateAccount(id: string, values: Partial<AccountFormValues>) {
  const { error } = await supabase
    .from('chart_of_accounts')
    .update({ ...values, parent_id: values.parent_id || null })
    .eq('id', id)
  if (error) throw error
}

export async function deleteAccount(id: string) {
  const { error } = await supabase.from('chart_of_accounts').delete().eq('id', id)
  if (error) throw error
}

// ---------- Journal Entries ----------

export async function fetchJournalEntries() {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchJournalEntryDetail(id: string): Promise<JournalEntryWithLines> {
  const { data: entry, error } = await supabase.from('journal_entries').select('*').eq('id', id).single()
  if (error) throw error

  const { data: lines, error: linesError } = await supabase
    .from('journal_entry_lines')
    .select('*, account:chart_of_accounts(id,code,name,account_type)')
    .eq('journal_entry_id', id)
    .order('created_at')
  if (linesError) throw linesError

  return { ...entry, lines: lines as unknown as JournalEntryLineWithAccount[] }
}

// Bulk-joined ledger lines, used by Journal Entries and Financial Reports pages
export async function fetchAllLedgerLines() {
  const { data, error } = await supabase
    .from('journal_entry_lines')
    .select('*, account:chart_of_accounts(id,code,name,account_type,account_group), journal_entry:journal_entries(entry_number,entry_date,narration,status,voucher_type)')
    .order('created_at')
  if (error) throw error
  return data
}

export async function createJournalEntry(values: JournalEntryFormValues, createdBy: string) {
  const { data: entry, error } = await supabase
    .from('journal_entries')
    .insert({
      voucher_type: 'journal',
      entry_date: values.entry_date,
      narration: values.narration || null,
      reference_type: 'manual',
      status: 'posted',
      approval_status: 'pending',
      created_by: createdBy,
    })
    .select()
    .single()
  if (error) throw error

  const { error: linesError } = await supabase.from('journal_entry_lines').insert(
    values.lines.map((l) => ({
      journal_entry_id: entry.id,
      account_id: l.account_id,
      debit: l.debit || 0,
      credit: l.credit || 0,
      description: l.description || null,
    })),
  )
  if (linesError) throw linesError

  return entry
}

export async function approveJournalEntry(id: string, approvedBy: string) {
  const { error } = await supabase
    .from('journal_entries')
    .update({ approval_status: 'approved', approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function rejectJournalEntry(id: string) {
  const { error } = await supabase.from('journal_entries').update({ approval_status: 'rejected' }).eq('id', id)
  if (error) throw error
}

export async function cancelJournalEntry(id: string) {
  const { error } = await supabase.from('journal_entries').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}
