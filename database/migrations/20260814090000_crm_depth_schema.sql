-- Migration: crm_depth_schema (20260814090000)
--
-- Phase 5 Sprint 20 per docs-architecture/06-sprint-planning.md. site_surveys and
-- opportunities get their own crm.view/crm.manage permissions — Sprint 6 gated
-- customers/quotations under sales.* instead of the crm licensing module they were
-- meant for; these new, genuinely relationship/pipeline entities (not transactional
-- documents) get the module's own permission pair. Existing tables are untouched.

create table public.site_surveys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  survey_number text not null default public.next_document_number('site_survey', 'SVY'),
  customer_id uuid not null references public.customers(id),
  scheduled_date date,
  conducted_date date,
  conducted_by uuid references auth.users(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  findings text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, survey_number)
);

create trigger trg_site_surveys_set_updated_at
before update on public.site_surveys
for each row execute function public.set_updated_at();

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  opportunity_number text not null default public.next_document_number('opportunity', 'OPP'),
  customer_id uuid not null references public.customers(id),
  site_survey_id uuid references public.site_surveys(id),
  title text not null,
  estimated_value numeric(12,2) not null default 0,
  stage text not null default 'new' check (stage in ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  expected_close_date date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, opportunity_number)
);

create trigger trg_opportunities_set_updated_at
before update on public.opportunities
for each row execute function public.set_updated_at();

-- Winning an opportunity is a meaningful signal that the customer is no longer just a
-- lead/prospect — same pattern as apply_repair_estimate_status advancing a job card.
create or replace function public.apply_opportunity_won()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage = 'won' and old.stage <> 'won' then
    update public.customers set status = 'active' where id = new.customer_id and status in ('lead', 'prospect');
  end if;
  return new;
end;
$$;

create trigger trg_apply_opportunity_won
after update on public.opportunities
for each row execute function public.apply_opportunity_won();

revoke all on function public.apply_opportunity_won() from public, anon, authenticated;

insert into public.permissions (key, module, description) values
  ('crm.view', 'crm', 'View site surveys and opportunities'),
  ('crm.manage', 'crm', 'Manage site surveys and the opportunity pipeline');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'crm.view' and r.key in ('super_admin', 'admin', 'accountant', 'workshop_manager', 'rental_coordinator');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'crm.manage' and r.key in ('super_admin', 'admin', 'workshop_manager', 'rental_coordinator');

alter table public.site_surveys enable row level security;
alter table public.opportunities enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['site_surveys', 'opportunities'];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'crm.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'crm.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'crm.manage', 'crm.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'crm.manage'
    );
  end loop;
end $$;

create index site_surveys_company_id_idx on public.site_surveys(company_id);
create index site_surveys_customer_id_idx on public.site_surveys(customer_id);
create index opportunities_company_id_idx on public.opportunities(company_id);
create index opportunities_customer_id_idx on public.opportunities(customer_id);
create index opportunities_site_survey_id_idx on public.opportunities(site_survey_id);
