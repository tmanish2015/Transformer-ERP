-- Migration: documents_rls_and_permissions (20260802092500)
-- 'documents' is already seeded as its own licensing module code. Permissions granted
-- to the same role set as workshop for now since repair_job is the only reference_type
-- in active use this sprint — widen the grant list as other modules start writing here.

insert into public.permissions (key, module, description) values
  ('documents.view', 'documents', 'View uploaded documents'),
  ('documents.manage', 'documents', 'Upload and delete documents');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'documents.view' and r.key in ('super_admin', 'admin', 'workshop_manager', 'technician', 'accountant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'documents.manage' and r.key in ('super_admin', 'admin', 'workshop_manager');

alter table public.documents enable row level security;

create policy documents_select on public.documents
  for select to authenticated
  using (company_id = public.current_company_id() and public.has_permission('documents.view'));

create policy documents_insert on public.documents
  for insert to authenticated
  with check (company_id = public.current_company_id() and public.has_permission('documents.manage'));

create policy documents_delete on public.documents
  for delete to authenticated
  using (company_id = public.current_company_id() and public.has_permission('documents.manage'));

create index documents_company_id_idx on public.documents(company_id);
create index documents_reference_idx on public.documents(reference_type, reference_id);
