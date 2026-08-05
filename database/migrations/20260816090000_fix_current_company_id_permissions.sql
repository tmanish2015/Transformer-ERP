-- Migration: fix_current_company_id_permissions (20260816090000)
--
-- Repairs the EXECUTE grant on the tenant-scoping helper public.current_company_id().
--
-- Background
-- ----------
-- public.current_company_id() (defined in 20260727100500_auth_rbac_schema.sql) is the
-- building block every RLS policy uses to scope rows to the caller's tenant:
--
--   company_id = public.current_company_id() AND public.has_permission('...')
--
-- It is a SECURITY DEFINER function that returns the caller's profiles.company_id:
--
--   create or replace function public.current_company_id()
--   returns uuid
--   language sql
--   stable
--   security definer
--   set search_path = public
--   as $$
--     select company_id from public.profiles where id = auth.uid()
--   $$;
--
-- Problem
-- -------
-- If the `authenticated` role loses EXECUTE on this function (e.g. the function was
-- re-created without re-granting, or an out-of-band REVOKE was applied), every RLS
-- policy that references it fails for logged-in users with:
--
--   permission denied for function current_company_id
--
-- Note: the anon role is intentionally NOT granted EXECUTE. Anonymous requests carry
-- no user identity (auth.uid() is null) and must never be able to resolve a tenant.
--
-- Fix (permission only)
-- ---------------------
-- 1. Revoke any accidental EXECUTE from `public` / `anon`.
-- 2. Grant EXECUTE to `authenticated` only.
--
-- No function body, ownership, schema, or RLS policy is changed by this migration.
-- RLS continues to be enforced exactly as before.

-- 1) Drop any accidental anon/public access.
revoke all on function public.current_company_id() from public, anon;

-- 2) Grant EXECUTE to authenticated users only (the role all signed-in app users get).
grant execute on function public.current_company_id() to authenticated;

-- ---------------------------------------------------------------------------
-- Verification queries (paste into the Supabase SQL Editor AFTER applying the fix)
-- ---------------------------------------------------------------------------

-- (A) ACL audit: expected result is exactly one row — grantee `authenticated`.
--     There must be NO `anon` row and NO `PUBLIC` row.
select
  n.nspname                                             as schema_name,
  p.proname                                             as function_name,
  coalesce(r.rolname, 'PUBLIC')                         as grantee,
  acl.privilege_type,
  acl.is_grantable
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
left join pg_roles r on r.oid = acl.grantee
where n.nspname = 'public'
  and p.proname = 'current_company_id'
order by grantee;

-- (B) Functional check — MUST be run with an authenticated user's JWT, e.g. from a
--     Supabase client / PostgREST after signing in (running it as postgres in the SQL
--     editor only proves the function exists, not the grant). From a client:
--
--     select public.current_company_id();
--
--     or, once the user belongs to a company, the app's insert:
--
--     insert into public.units (name, short_code) values ('TEST_UNIT', 'TU01');
--
--     A signed-in user whose profiles.company_id is NULL will still be blocked by RLS
--     (company_id = NULL is never true) — that is correct tenancy behaviour, not a
--     permission error. Use the verification script (_verify_auth_insert.mjs) to
--     exercise both the function grant and the RLS-gated insert end to end.

