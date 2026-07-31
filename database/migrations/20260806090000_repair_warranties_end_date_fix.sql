-- Migration: repair_warranties_end_date_fix (20260806090000)
--
-- Bug: the frontend was computing end_date via JS Date.setMonth(), which doesn't clamp
-- day-of-month — a warranty started Jan 31 + 1 month landed on Mar 3, not Feb 28/29.
-- Postgres's own interval arithmetic clamps correctly, so end_date is now computed here
-- instead of trusting whatever the client sends.

alter table public.repair_warranties alter column end_date drop not null;

create or replace function public.apply_repair_warranty_end_date()
returns trigger
language plpgsql
as $$
begin
  new.end_date := (new.start_date + (new.warranty_months || ' months')::interval)::date;
  return new;
end;
$$;

create trigger trg_apply_repair_warranty_end_date
before insert on public.repair_warranties
for each row execute function public.apply_repair_warranty_end_date();
