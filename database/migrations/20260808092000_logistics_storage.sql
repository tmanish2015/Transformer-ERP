-- Migration: logistics_storage (20260808092000)
-- Same tenant-scoped-by-path-prefix pattern as the documents/test-certificates buckets.

insert into storage.buckets (id, name, public)
values ('logistics', 'logistics', false)
on conflict (id) do nothing;

create policy logistics_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'logistics'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and public.has_permission('logistics.view')
  );

create policy logistics_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logistics'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and public.has_permission('logistics.manage')
  );
