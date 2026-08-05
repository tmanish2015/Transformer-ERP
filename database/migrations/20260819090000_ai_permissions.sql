-- Migration: ai_permissions (20260819090000)
--
-- Adds the `ai.view` permission for the AI Business Assistant module. This is the
-- read/use gate for the AI Assistant feature area. Following the established
-- two-tier permission convention (see 20260728090500_inventory_rls_and_permissions.sql),
-- but the AI assistant is a read/query/chat surface, not a data-entry module, so it
-- gets a single `ai.view` tier for now (future `ai.manage` can gate admin actions like
-- clearing history or managing saved prompts).

insert into public.permissions (key, module, description) values
  ('ai.view', 'ai', 'Use the AI Business Assistant (query and chat)');

-- Every role except `unassigned` can use the assistant (it is a read-only surface
-- scoped to the tenant; the assistant's own queries are further constrained by the
-- caller's existing module permissions via RLS).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'ai.view' and r.key <> 'unassigned';
