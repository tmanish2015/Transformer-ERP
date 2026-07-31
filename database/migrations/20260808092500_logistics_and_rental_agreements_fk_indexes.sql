-- Migration: logistics_and_rental_agreements_fk_indexes (20260808092500)

create index vehicles_company_id_idx on public.vehicles(company_id);
create index drivers_company_id_idx on public.drivers(company_id);
create index trips_company_id_idx on public.trips(company_id);
create index trips_vehicle_id_idx on public.trips(vehicle_id);
create index trips_driver_id_idx on public.trips(driver_id);
create index trips_reference_idx on public.trips(reference_type, reference_id);
create index trip_costs_company_id_idx on public.trip_costs(company_id);
create index trip_costs_trip_id_idx on public.trip_costs(trip_id);
create index trip_photos_trip_id_idx on public.trip_photos(trip_id);
create index customer_signatures_trip_id_idx on public.customer_signatures(trip_id);

create index rental_agreements_company_id_idx on public.rental_agreements(company_id);
create index rental_agreements_customer_id_idx on public.rental_agreements(customer_id);
create index rental_agreements_asset_id_idx on public.rental_agreements(rental_asset_id);
create index rental_dispatches_company_id_idx on public.rental_dispatches(company_id);
create index rental_dispatches_trip_id_idx on public.rental_dispatches(trip_id);
