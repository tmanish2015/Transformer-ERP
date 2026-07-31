-- Migration: document_numbering (20260729090000)
--
-- Generic per-company sequential document numbering, used by every module that needs
-- one (journal entries now; purchase orders, invoices, repair job cards, rental
-- agreements, etc. in later sprints — see docs-architecture/09-api-design.md). Tradeflow
-- uses a plain Postgres sequence per document type since it's one project per customer;
-- that would make numbers jump unpredictably across companies here (company B's first
-- journal entry might read "JE-000047"), so this uses a per-(company, sequence_key)
-- counter table with an atomic upsert instead.

create table public.document_sequences (
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  sequence_key text not null,
  last_value bigint not null default 0,
  primary key (company_id, sequence_key)
);

alter table public.document_sequences enable row level security;

create policy "document_sequences_select" on public.document_sequences
  for select to authenticated using (company_id = public.current_company_id());

-- No insert/update/delete policy: only reachable via next_document_number() below.

create or replace function public.next_document_number(p_sequence_key text, p_prefix text, p_pad int default 6)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next bigint;
begin
  insert into public.document_sequences (company_id, sequence_key, last_value)
  values (public.current_company_id(), p_sequence_key, 1)
  on conflict (company_id, sequence_key) do update set last_value = public.document_sequences.last_value + 1
  returning last_value into v_next;

  return p_prefix || '-' || lpad(v_next::text, p_pad, '0');
end;
$$;

revoke all on function public.next_document_number(text, text, int) from public, anon;
grant execute on function public.next_document_number(text, text, int) to authenticated;
