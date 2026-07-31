-- Migration: finance_fk_indexes (20260729091500)

create index chart_of_accounts_company_id_idx on public.chart_of_accounts(company_id);
create index chart_of_accounts_parent_id_idx on public.chart_of_accounts(parent_id);

create index journal_entries_company_id_idx on public.journal_entries(company_id);
create index journal_entries_reference_idx on public.journal_entries(reference_type, reference_id);
create index journal_entries_party_idx on public.journal_entries(party_type, party_id);
create index journal_entries_date_idx on public.journal_entries(entry_date);

create index journal_entry_lines_company_id_idx on public.journal_entry_lines(company_id);
create index journal_entry_lines_entry_id_idx on public.journal_entry_lines(journal_entry_id);
create index journal_entry_lines_account_id_idx on public.journal_entry_lines(account_id);
