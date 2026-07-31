-- Licensing engine RPC functions. Ported from Tradeflow with one signature change:
-- get_my_entitlements() takes no argument (Tradeflow's single-tenant-per-project model
-- required a license_key parameter; here the caller's tenant is already resolvable via
-- current_company_id(), since license_customers.company_id is a direct FK).
--
-- Every write function manually re-checks has_permission('licensing.manage') in its
-- body: these are security definer functions, so RLS is bypassed for their internal
-- statements the same way has_permission() itself already does.

-- ---------- Entitlement read (called by every ERP user on login) ----------

create or replace function public.get_my_entitlements()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_customer record;
  v_subscription record;
  v_license record;
begin
  select * into v_customer from public.license_customers where company_id = public.current_company_id();
  if not found then
    return jsonb_build_object('valid', false, 'reason', 'no_license_customer_for_company');
  end if;

  select * into v_license from public.licenses
    where customer_id = v_customer.id
    order by issued_at desc
    limit 1;

  select * into v_subscription from public.customer_subscriptions
    where customer_id = v_customer.id
    order by created_at desc
    limit 1;

  if v_customer.status not in ('trial', 'active') then
    return jsonb_build_object('valid', false, 'reason', 'customer_' || v_customer.status, 'status', v_customer.status);
  end if;

  if v_license.id is not null and v_license.status <> 'active' then
    return jsonb_build_object('valid', false, 'reason', 'license_' || v_license.status);
  end if;

  if v_license.id is not null and v_license.expires_at is not null and v_license.expires_at < now() then
    return jsonb_build_object('valid', false, 'reason', 'license_expired');
  end if;

  return jsonb_build_object(
    'valid', true,
    'customer_id', v_customer.id,
    'status', v_customer.status,
    'plan', (
      select jsonb_build_object(
        'id', p.id, 'code', p.code, 'name', p.name,
        'max_users', p.max_users, 'max_branches', p.max_branches,
        'max_warehouses', p.max_warehouses, 'storage_limit_gb', p.storage_limit_gb
      )
      from public.plans p where p.id = v_subscription.plan_id
    ),
    'subscription_status', v_subscription.status,
    'trial_ends_at', v_subscription.trial_ends_at,
    'end_date', v_subscription.end_date,
    'license_expires_at', v_license.expires_at,
    'modules', (
      select coalesce(jsonb_agg(m.code), '[]'::jsonb)
      from public.customer_modules cm join public.modules m on m.id = cm.module_id
      where cm.customer_id = v_customer.id and cm.enabled = true
    ),
    'features', (
      select coalesce(jsonb_agg(f.code), '[]'::jsonb)
      from public.customer_features cf join public.features f on f.id = cf.feature_id
      where cf.customer_id = v_customer.id and cf.enabled = true
    ),
    'addons', (
      select coalesce(jsonb_agg(a.code), '[]'::jsonb)
      from public.customer_addons ca join public.addons a on a.id = ca.addon_id
      where ca.customer_id = v_customer.id and ca.status = 'active'
    )
  );
end;
$$;

-- ---------- Module dependency enforcement ----------

create or replace function public.can_activate_module(p_customer_id uuid, p_module_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.module_dependencies md
    where md.module_id = p_module_id
      and not exists (
        select 1 from public.customer_modules cm
        where cm.customer_id = p_customer_id
          and cm.module_id = md.depends_on_module_id
          and cm.enabled = true
      )
  )
$$;

create or replace function public.toggle_customer_module(p_customer_id uuid, p_module_id uuid, p_enable boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('licensing.manage') then
    raise exception 'permission denied';
  end if;

  if p_enable and not public.can_activate_module(p_customer_id, p_module_id) then
    raise exception 'Cannot enable this module: one or more required dependency modules are not enabled for this customer';
  end if;

  insert into public.customer_modules (customer_id, module_id, enabled, source)
  values (p_customer_id, p_module_id, p_enable, 'manual')
  on conflict (customer_id, module_id) do update set enabled = p_enable, source = 'manual';
end;
$$;

-- ---------- Plan-defaults materialization (internal helper, not directly callable) ----------

create or replace function public.apply_plan_defaults(p_customer_id uuid, p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.customer_modules where customer_id = p_customer_id and source = 'plan';
  delete from public.customer_features where customer_id = p_customer_id and source = 'plan';

  insert into public.customer_modules (customer_id, module_id, enabled, source)
  select p_customer_id, pm.module_id, true, 'plan'
  from public.plan_modules pm
  where pm.plan_id = p_plan_id
  on conflict (customer_id, module_id) do nothing;

  insert into public.customer_features (customer_id, feature_id, enabled, source)
  select p_customer_id, pf.feature_id, true, 'plan'
  from public.plan_features pf
  where pf.plan_id = p_plan_id
  on conflict (customer_id, feature_id) do nothing;
end;
$$;

-- ---------- Customer lifecycle ----------

create or replace function public.activate_customer(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('licensing.manage') then
    raise exception 'permission denied';
  end if;

  update public.license_customers set status = 'active', updated_at = now() where id = p_customer_id;
  update public.customer_subscriptions set status = 'active', updated_at = now()
    where customer_id = p_customer_id and status in ('trialing', 'past_due', 'suspended');
  update public.licenses set status = 'active' where customer_id = p_customer_id;

  insert into public.license_logs (license_id, event, notes)
    select id, 'activated', 'Customer activated'
    from public.licenses where customer_id = p_customer_id order by issued_at desc limit 1;
end;
$$;

create or replace function public.suspend_customer(p_customer_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('licensing.manage') then
    raise exception 'permission denied';
  end if;

  update public.license_customers set status = 'suspended', updated_at = now() where id = p_customer_id;
  update public.customer_subscriptions set status = 'suspended', updated_at = now() where customer_id = p_customer_id;
  update public.licenses set status = 'revoked' where customer_id = p_customer_id and status = 'active';

  insert into public.license_logs (license_id, event, notes)
    select id, 'suspended', p_reason
    from public.licenses where customer_id = p_customer_id order by issued_at desc limit 1;
end;
$$;

create or replace function public.expire_customer(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('licensing.manage') then
    raise exception 'permission denied';
  end if;

  update public.license_customers set status = 'expired', updated_at = now() where id = p_customer_id;
  update public.customer_subscriptions set status = 'expired', updated_at = now() where customer_id = p_customer_id;
  update public.licenses set status = 'expired' where customer_id = p_customer_id and status = 'active';

  insert into public.license_logs (license_id, event, notes)
    select id, 'expired', 'Customer expired'
    from public.licenses where customer_id = p_customer_id order by issued_at desc limit 1;
end;
$$;

create or replace function public.renew_customer(p_customer_id uuid, p_new_end_date date, p_new_expires_at timestamptz default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('licensing.manage') then
    raise exception 'permission denied';
  end if;

  update public.license_customers set status = 'active', updated_at = now() where id = p_customer_id;
  update public.customer_subscriptions
    set status = 'active', end_date = p_new_end_date, updated_at = now()
    where customer_id = p_customer_id;
  update public.licenses
    set status = 'active', expires_at = coalesce(p_new_expires_at, expires_at)
    where customer_id = p_customer_id;

  insert into public.license_logs (license_id, event, notes)
    select id, 'renewed', 'Renewed through ' || p_new_end_date::text
    from public.licenses where customer_id = p_customer_id order by issued_at desc limit 1;
end;
$$;

create or replace function public.change_customer_plan(p_customer_id uuid, p_new_plan_id uuid, p_event text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('licensing.manage') then
    raise exception 'permission denied';
  end if;

  update public.customer_subscriptions set plan_id = p_new_plan_id, updated_at = now() where customer_id = p_customer_id;
  perform public.apply_plan_defaults(p_customer_id, p_new_plan_id);

  insert into public.license_logs (license_id, event, notes)
    select id, p_event, 'Plan changed to ' || (select code from public.plans where id = p_new_plan_id)
    from public.licenses where customer_id = p_customer_id order by issued_at desc limit 1;
end;
$$;

create or replace function public.upgrade_plan(p_customer_id uuid, p_new_plan_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  select public.change_customer_plan(p_customer_id, p_new_plan_id, 'upgraded');
$$;

create or replace function public.downgrade_plan(p_customer_id uuid, p_new_plan_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  select public.change_customer_plan(p_customer_id, p_new_plan_id, 'downgraded');
$$;

-- ---------- Lockdown: only the intended entrypoints are callable by clients ----------

revoke execute on function public.get_my_entitlements() from public, anon, authenticated;
revoke execute on function public.can_activate_module(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.toggle_customer_module(uuid, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.apply_plan_defaults(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.activate_customer(uuid) from public, anon, authenticated;
revoke execute on function public.suspend_customer(uuid, text) from public, anon, authenticated;
revoke execute on function public.expire_customer(uuid) from public, anon, authenticated;
revoke execute on function public.renew_customer(uuid, date, timestamptz) from public, anon, authenticated;
revoke execute on function public.change_customer_plan(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.upgrade_plan(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.downgrade_plan(uuid, uuid) from public, anon, authenticated;

-- get_my_entitlements: every authenticated ERP user needs this (it's how their own app
-- resolves its own entitlements) — deliberately not gated by licensing.view.
grant execute on function public.get_my_entitlements() to authenticated;
grant execute on function public.can_activate_module(uuid, uuid) to authenticated;

-- Everything else is licensing.manage-gated inside the function body, but the EXECUTE
-- grant itself still has to exist for authenticated callers to reach the body at all
-- (PostgREST rejects the call before that point otherwise).
grant execute on function public.toggle_customer_module(uuid, uuid, boolean) to authenticated;
grant execute on function public.activate_customer(uuid) to authenticated;
grant execute on function public.suspend_customer(uuid, text) to authenticated;
grant execute on function public.expire_customer(uuid) to authenticated;
grant execute on function public.renew_customer(uuid, date, timestamptz) to authenticated;
grant execute on function public.upgrade_plan(uuid, uuid) to authenticated;
grant execute on function public.downgrade_plan(uuid, uuid) to authenticated;
