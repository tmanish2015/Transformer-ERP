-- Migration: company_signup_rpc (20260727101000)
--
-- Bridges the chicken-and-egg gap between "a user exists in auth.users / profiles" and
-- "a company row exists for them to belong to". Called once, immediately after
-- supabase.auth.signUp() succeeds, by the onboarding wizard's first step.

create or replace function public.create_company_and_admin(p_company_name text, p_industry_type text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_admin_role_id uuid;
begin
  if exists (select 1 from public.profiles where id = auth.uid() and company_id is not null) then
    raise exception 'This account already belongs to a company';
  end if;

  insert into public.companies (name, industry_type)
  values (p_company_name, p_industry_type)
  returning id into v_company_id;

  select id into v_admin_role_id from public.roles where key = 'admin';

  perform set_config('app.bypass_profile_protection', 'on', true);

  update public.profiles
  set company_id = v_company_id, role_id = v_admin_role_id
  where id = auth.uid();

  return v_company_id;
end;
$$;

revoke all on function public.create_company_and_admin(text, text) from public, anon;
grant execute on function public.create_company_and_admin(text, text) to authenticated;
