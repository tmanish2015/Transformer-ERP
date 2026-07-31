-- Migration: testing_lab_storage (20260803091000)
-- Separate bucket from the generic 'documents' vault — certificate issuance is gated by
-- testing-lab.* permissions, not documents.*, so it gets its own tenant-scoped policies
-- rather than overloading the documents bucket's permission checks.

insert into storage.buckets (id, name, public)
values ('test-certificates', 'test-certificates', false)
on conflict (id) do nothing;

create policy test_certificates_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'test-certificates'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and public.has_permission('testing-lab.view')
  );

create policy test_certificates_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'test-certificates'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and public.has_permission('testing-lab.manage')
  );
