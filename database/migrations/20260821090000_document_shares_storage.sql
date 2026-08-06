-- Migration: document_shares_storage (20260821090000)
--
-- Bucket for PDFs generated client-side (Quotation, Purchase Order, Sales Invoice,
-- Customer Ledger) when a user shares a document via email or WhatsApp. Private bucket,
-- company-scoped by path prefix — same convention as test-certificates. A signed URL is
-- generated per share (see frontend/src/lib/share-api.ts) rather than making the bucket
-- public, so a customer's financial document isn't permanently world-readable.

insert into storage.buckets (id, name, public)
values ('document-shares', 'document-shares', false)
on conflict (id) do nothing;

create policy document_shares_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'document-shares'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and (public.has_permission('sales.view') or public.has_permission('purchases.view'))
  );

create policy document_shares_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'document-shares'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and (public.has_permission('sales.manage') or public.has_permission('purchases.manage'))
  );
