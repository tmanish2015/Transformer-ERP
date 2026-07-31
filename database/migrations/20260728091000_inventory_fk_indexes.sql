-- Migration: inventory_fk_indexes (20260728091000)
-- Every FK gets a dedicated index, plus company_id on every table (tenant-scoped
-- queries and RLS checks both filter by it on nearly every request).

create index units_company_id_idx on public.units(company_id);
create index categories_company_id_idx on public.categories(company_id);
create index categories_parent_id_idx on public.categories(parent_id);
create index brands_company_id_idx on public.brands(company_id);
create index warehouses_company_id_idx on public.warehouses(company_id);
create index suppliers_company_id_idx on public.suppliers(company_id);

create index products_company_id_idx on public.products(company_id);
create index products_category_id_idx on public.products(category_id);
create index products_brand_id_idx on public.products(brand_id);
create index products_unit_id_idx on public.products(unit_id);
create index products_sku_idx on public.products(sku);
create index products_barcode_idx on public.products(barcode);

create index product_suppliers_company_id_idx on public.product_suppliers(company_id);
create index product_suppliers_supplier_id_idx on public.product_suppliers(supplier_id);

create index product_batches_company_id_idx on public.product_batches(company_id);
create index product_batches_product_id_idx on public.product_batches(product_id);
create index product_batches_warehouse_id_idx on public.product_batches(warehouse_id);

create index serial_numbers_company_id_idx on public.serial_numbers(company_id);
create index serial_numbers_product_id_idx on public.serial_numbers(product_id);
create index serial_numbers_warehouse_id_idx on public.serial_numbers(current_warehouse_id);

create index scrap_entries_company_id_idx on public.scrap_entries(company_id);
create index scrap_entries_product_id_idx on public.scrap_entries(product_id);

create index stock_levels_company_id_idx on public.stock_levels(company_id);
create index stock_levels_warehouse_id_idx on public.stock_levels(warehouse_id);

create index stock_movements_company_id_idx on public.stock_movements(company_id);
create index stock_movements_product_id_idx on public.stock_movements(product_id);
create index stock_movements_warehouse_id_idx on public.stock_movements(warehouse_id);
create index stock_movements_batch_id_idx on public.stock_movements(batch_id);
create index stock_movements_created_by_idx on public.stock_movements(created_by);
create index stock_movements_created_at_idx on public.stock_movements(created_at desc);
