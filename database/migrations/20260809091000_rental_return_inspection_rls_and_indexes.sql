-- Migration: rental_return_inspection_rls_and_indexes (20260809091000)

alter table public.rental_returns enable row level security;
alter table public.rental_inspections enable row level security;
alter table public.rental_damage_assessments enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['rental_returns', 'rental_inspections', 'rental_damage_assessments'];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'rental.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'rental.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'rental.manage', 'rental.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'rental.manage'
    );
  end loop;
end $$;

create index rental_returns_company_id_idx on public.rental_returns(company_id);
create index rental_returns_agreement_id_idx on public.rental_returns(rental_agreement_id);
create index rental_returns_trip_id_idx on public.rental_returns(trip_id);
create index rental_inspections_company_id_idx on public.rental_inspections(company_id);
create index rental_inspections_return_id_idx on public.rental_inspections(rental_return_id);
create index rental_damage_assessments_company_id_idx on public.rental_damage_assessments(company_id);
create index rental_damage_assessments_inspection_id_idx on public.rental_damage_assessments(rental_inspection_id);
