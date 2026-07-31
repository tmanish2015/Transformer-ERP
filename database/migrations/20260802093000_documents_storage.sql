-- Migration: documents_storage (20260802093000)
-- Private bucket; every object path is prefixed <company_id>/<reference_type>/<reference_id>/<filename>
-- so the same current_company_id()-scoped tenancy check used everywhere else in this
-- project applies to storage.objects too, via storage.foldername()'s first segment.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy documents_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and public.has_permission('documents.view')
  );

create policy documents_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and public.has_permission('documents.manage')
  );

create policy documents_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and public.has_permission('documents.manage')
  );
