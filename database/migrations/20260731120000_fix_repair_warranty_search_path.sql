-- Migration: fix_repair_warranty_search_path (20260731120000)
--
-- apply_repair_warranty_end_date() was missing `set search_path = public`,
-- flagged by Supabase security advisor as function_search_path_mutable.

create or replace function public.apply_repair_warranty_end_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.end_date := (new.start_date + (new.warranty_months || ' months')::interval)::date;
  return new;
end;
$$;
