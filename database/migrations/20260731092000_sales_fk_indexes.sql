-- Migration: sales_fk_indexes (20260731092000)

create index customers_company_id_idx on public.customers(company_id);
create index customers_status_idx on public.customers(status);

create index quotations_company_id_idx on public.quotations(company_id);
create index quotations_customer_id_idx on public.quotations(customer_id);
create index quotations_status_idx on public.quotations(status);

create index quotation_items_company_id_idx on public.quotation_items(company_id);
create index quotation_items_quotation_id_idx on public.quotation_items(quotation_id);
create index quotation_items_product_id_idx on public.quotation_items(product_id);

create index sales_orders_company_id_idx on public.sales_orders(company_id);
create index sales_orders_customer_id_idx on public.sales_orders(customer_id);
create index sales_orders_quotation_id_idx on public.sales_orders(quotation_id);
create index sales_orders_warehouse_id_idx on public.sales_orders(warehouse_id);
create index sales_orders_status_idx on public.sales_orders(status);

create index sales_order_items_company_id_idx on public.sales_order_items(company_id);
create index sales_order_items_so_id_idx on public.sales_order_items(sales_order_id);
create index sales_order_items_product_id_idx on public.sales_order_items(product_id);

create index delivery_challans_company_id_idx on public.delivery_challans(company_id);
create index delivery_challans_so_id_idx on public.delivery_challans(sales_order_id);
create index delivery_challans_warehouse_id_idx on public.delivery_challans(warehouse_id);

create index delivery_challan_items_company_id_idx on public.delivery_challan_items(company_id);
create index delivery_challan_items_dc_id_idx on public.delivery_challan_items(delivery_challan_id);
create index delivery_challan_items_soi_id_idx on public.delivery_challan_items(sales_order_item_id);
create index delivery_challan_items_product_id_idx on public.delivery_challan_items(product_id);

create index sales_invoices_company_id_idx on public.sales_invoices(company_id);
create index sales_invoices_so_id_idx on public.sales_invoices(sales_order_id);
create index sales_invoices_dc_id_idx on public.sales_invoices(delivery_challan_id);
create index sales_invoices_customer_id_idx on public.sales_invoices(customer_id);
create index sales_invoices_status_idx on public.sales_invoices(status);

create index sales_invoice_items_company_id_idx on public.sales_invoice_items(company_id);
create index sales_invoice_items_invoice_id_idx on public.sales_invoice_items(sales_invoice_id);
create index sales_invoice_items_soi_id_idx on public.sales_invoice_items(sales_order_item_id);
create index sales_invoice_items_product_id_idx on public.sales_invoice_items(product_id);

create index sales_payments_company_id_idx on public.sales_payments(company_id);
create index sales_payments_invoice_id_idx on public.sales_payments(sales_invoice_id);
