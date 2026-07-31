-- Redefines create_company_and_admin() (first introduced in company_signup_rpc, before
-- the licensing schema existed) to also provision a trial license_customers row + a
-- trialing subscription to the 'starter' plan, and materialize that plan's default
-- module/feature entitlements. Without this, a brand new company would have no
-- license_customers row at all and get_my_entitlements() would return invalid=true
-- for every user in it, immediately locking them out of every module.

create or replace function public.create_company_and_admin(p_company_name text, p_industry_type text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_admin_role_id uuid;
  v_customer_id uuid;
  v_starter_plan_id uuid;
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

  select id into v_starter_plan_id from public.plans where code = 'starter';

  insert into public.license_customers (company_id, status)
  values (v_company_id, 'trial')
  returning id into v_customer_id;

  insert into public.customer_subscriptions (customer_id, plan_id, status, trial_ends_at)
  values (v_customer_id, v_starter_plan_id, 'trialing', now() + interval '14 days');

  insert into public.licenses (customer_id, license_key, status)
  values (v_customer_id, (select license_key from public.license_customers where id = v_customer_id), 'active');

  perform public.apply_plan_defaults(v_customer_id, v_starter_plan_id);

  return v_company_id;
end;
$$;

revoke all on function public.create_company_and_admin(text, text) from public, anon;
grant execute on function public.create_company_and_admin(text, text) to authenticated;
