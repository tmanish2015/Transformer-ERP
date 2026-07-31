-- Migration: rental_fk_indexes (20260807091500)

create index rental_assets_company_id_idx on public.rental_assets(company_id);
create index rental_assets_category_id_idx on public.rental_assets(category_id);
create index rental_assets_status_idx on public.rental_assets(status);
create index rental_asset_status_log_company_id_idx on public.rental_asset_status_log(company_id);
create index rental_asset_status_log_asset_id_idx on public.rental_asset_status_log(rental_asset_id);
create index rental_inquiries_company_id_idx on public.rental_inquiries(company_id);
create index rental_inquiries_customer_id_idx on public.rental_inquiries(customer_id);
create index rental_quotations_company_id_idx on public.rental_quotations(company_id);
create index rental_quotations_customer_id_idx on public.rental_quotations(customer_id);
create index rental_quotations_inquiry_id_idx on public.rental_quotations(rental_inquiry_id);
create index rental_quotation_items_company_id_idx on public.rental_quotation_items(company_id);
create index rental_quotation_items_quotation_id_idx on public.rental_quotation_items(rental_quotation_id);
create index rental_quotation_items_asset_id_idx on public.rental_quotation_items(rental_asset_id);
create index rental_bookings_company_id_idx on public.rental_bookings(company_id);
create index rental_bookings_customer_id_idx on public.rental_bookings(customer_id);
create index rental_bookings_asset_id_idx on public.rental_bookings(rental_asset_id);
create index rental_bookings_quotation_id_idx on public.rental_bookings(rental_quotation_id);
