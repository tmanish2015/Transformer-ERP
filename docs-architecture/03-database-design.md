# Database Design

## 0. Multi-tenancy — the one deliberate departure from Tradeflow

Tradeflow ships one Supabase project per customer. Transformer-AI-ERP must be **row-level multi-tenant in a single project** (spec requirement). Convention for every operational table (mirrors Tradeflow's other conventions exactly otherwise):

```sql
create table public.<table> (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  -- domain columns --
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz  -- see soft-delete note below
);
create index <table>_company_id_idx on public.<table>(company_id);
```

`default public.current_company_id()` is load-bearing, not decorative: client code (ported from Tradeflow's `api/*.ts` files) never sets `company_id` explicitly on insert, so the column must populate itself from the caller's session. RLS's `with check (company_id = current_company_id())` still guards against a caller passing a different `company_id` outright. Applied starting with the inventory module (Sprint 3); retrofit onto any earlier table only if it turns out to need client-side inserts.

RLS policy generator (same `do $$ loop` mechanism as Tradeflow, extended with tenant scoping):

```sql
execute format(
  'create policy %I on public.%I for select to authenticated using (company_id = current_company_id() and has_permission(%L))',
  tbl || '_select', tbl, module || '.view'
);
```

`current_company_id()` — new `stable security definer` function reading `profiles.company_id` for `auth.uid()` (a profile belongs to exactly one company; cross-company users are out of scope for v1). This is the multi-tenant equivalent of Tradeflow's `has_permission()` — same lockdown treatment (`revoke all ... grant execute to authenticated`, `set search_path = public`).

**Per-company seed data — another deliberate departure from Tradeflow.** Tradeflow seeds things like the chart of accounts as a one-shot migration `insert` (fine for it — one company ever). That can't work here: a migration runs once at deploy time, but every company that signs up afterward needs its own copy of that seed data. The fix, established in Sprint 4 (`seed_default_chart_of_accounts`): write the seed as a `security definer` function taking `p_company_id`, then call it from `create_company_and_admin()` at signup — the same function gets extended (redefined via `create or replace`) each time a new module needs its own per-company seed (licensing's trial provisioning did this first; finance's COA is the second). Any future module with "every company needs a default copy of X" data follows this pattern, not a static insert migration.

**Per-company document numbering — `next_document_number()`.** Same reasoning as above applies to sequence numbers: Tradeflow uses a plain Postgres `sequence` per document type, which would make numbers jump unpredictably across companies here. Instead, `document_sequences(company_id, sequence_key, last_value)` + `next_document_number(p_sequence_key, p_prefix, p_pad)` (introduced in Sprint 4 for journal entries) gives every company its own contiguous numbering per document type via an atomic upsert. Every future document type (PO, invoice, repair job card, rental agreement, etc.) calls this instead of defining its own sequence.

**Soft delete**: unlike Tradeflow (hard deletes only), add `deleted_at timestamptz` to master data and document-header tables (customers, rental_assets, products, employees, repair_jobs, etc.) — repair/rental/testing history must never disappear, even if a record is "removed" from active lists. Line-item/child tables (journal_entry_lines, test_report_results) stay hard-delete-free-but-no-soft-delete-column, matching Tradeflow's line-item pattern (they live and die with their parent).

Everything else — `gen_random_uuid()` PKs, `created_at`/`updated_at` via trigger, one dedicated `_fk_indexes.sql` migration per module, `security definer` + explicit `revoke/grant execute` + `set search_path = public` lockdown on every function, dedicated numbering sequences (`next_repair_job_number()`, `next_rental_agreement_number()`, etc.) — copied verbatim from Tradeflow's conventions (see Reference Architecture Survey §6).

## 1. Licensing sub-schema — reused wholesale, new seed data only

Copy `plans / industry_packs / modules / module_dependencies / features / addons / license_customers / customer_subscriptions / customer_modules / customer_features / customer_addons / licenses / license_logs` and all 3 RPCs (`get_my_entitlements`, lifecycle mutators, `can_activate_module`/`apply_plan_defaults`) unchanged. `license_customers` now maps 1:1 to the new `companies` table (formerly the single-row `company_settings`). New seed data only:

- **Industry packs**: Repair Workshop Pack, Manufacturing Pack, Rental Pack, Testing Lab Pack, Logistics Pack.
- **Modules**: rental, workshop, manufacturing, testing-lab, maintenance, logistics, hr, documents (each with `module_dependencies` — e.g. `workshop` depends on `inventory` + `finance`; `rental` depends on `inventory` + `finance`; `testing-lab` depends on `crm`).
- **Plans**: e.g. Starter (CRM+Sales+Inventory+Finance only), Workshop Pro (+workshop+testing-lab), Rental Pro (+rental+maintenance+logistics), Enterprise (everything).

## 2. Per-module table inventory (high-level; full DDL deferred to per-migration implementation)

### rental
`rental_asset_categories(id, company_id, name)`, `rental_assets(id, company_id, category_id, asset_code, qr_code, serial_number, status enum[available|booked|dispatched|running|returned|maintenance|retired], current_location, purchase_cost, ...)`, `rental_inquiries`, `rental_quotations` + lines, `rental_bookings`, `rental_agreements` (+ security_deposit, late_return_charge_rate, operator_charge_rate, fuel_charge_rate terms), `rental_dispatches`, `rental_returns`, `rental_inspections`, `rental_damage_assessments`, `rental_invoices` (sales_invoices with `invoice_type='rental'`, FK to agreement), `asset_maintenance_schedules`, `asset_calibration_schedules`, `asset_insurance_policies`. Status-transition trigger (mirrors Tradeflow's stock-reconciliation-trigger pattern) moves `rental_assets.status` and writes an `rental_asset_status_log` row on every lifecycle step (inquiry→quotation→booking→agreement→dispatch→running→return→inspection→invoice→available).

### workshop
`repair_jobs` (header: customer_id, transformer_asset_ref, complaint, pickup_request, status), `repair_estimates` + lines, `repair_estimate_approvals`, `repair_job_stage_history` (one row per stage: dismantling/core-inspection/coil-inspection/rewinding/core-assembly/tank-repair/painting/oil-filling/testing/qc/dispatch/installation — append-only, mirrors `license_logs` audit-trail pattern), `repair_warranties`. Auto-posting trigger fires GL entries on `repair_jobs.status = 'invoiced'` (same pattern as Tradeflow's sales-invoice auto-posting trigger).

### manufacturing
`boms(id, company_id, product_id, version)`, `bom_lines(bom_id, raw_material_product_id, qty, unit_id)`, `production_orders(id, company_id, product_id, bom_id, qty, status)`, `production_stage_history` (winding/assembly/testing/painting/packing/dispatch — same append-only pattern as `repair_job_stage_history`), `raw_material_requirements` (derived from BOM explosion, view or materialized on order creation).

### testing-lab
`test_types(id, code, name, parameters jsonb)` (seed: IR, TR, winding-resistance, magnetizing-current, oil-BDV, HV-test, vector-group, load-test, temp-rise), `test_reports(id, company_id, customer_id, repair_job_id nullable, rental_asset_id nullable, test_type_id, tested_by, tested_at, status)`, `test_report_results(report_id, parameter_key, value, unit, pass_fail)`, `test_certificates(report_id, pdf_storage_path, certificate_number, issued_at)` — `certificate_number` via dedicated sequence (`next_test_certificate_number()`), PDF generated via the reused `pdf-export.ts` pattern or a new edge function.

### maintenance
`maintenance_schedules(id, company_id, reference_type enum[rental_asset|manufactured_unit], reference_id, frequency_days, next_due_at)`, `maintenance_visits(schedule_id, technician_id, visited_at, status)`, `maintenance_checklists(id, name)`, `maintenance_checklist_items(checklist_id, visit_id, item_text, is_checked)`. Reminders dispatched via the reused WhatsApp-notify edge-function pattern, triggered by a scheduled job comparing `next_due_at`.

### logistics
`vehicles(id, company_id, registration_no, type)`, `drivers(id, company_id, name, license_no)`, `trips(id, company_id, vehicle_id, driver_id, trip_type enum[pickup|delivery], reference_type, reference_id, gps_start jsonb, gps_end jsonb)`, `trip_costs(trip_id, cost_type enum[fuel|toll|other], amount)`, `trip_photos(trip_id, storage_path)`, `customer_signatures(trip_id, storage_path, signed_at)`. `gps_*` columns are `jsonb` placeholders (`{lat,lng,captured_at}`) — "GPS-ready architecture" per spec, no live tracking device integration in v1.

### hr
`employees(id, company_id, profile_id nullable, name, role_title, skill_tags text[])` — `profile_id` nullable because field technicians may not need app login; `attendance(employee_id, date, check_in, check_out)`, `leaves(employee_id, type, from_date, to_date, status)`, `salary_slips(employee_id, month, gross, deductions, net)`, `skill_matrix(employee_id, skill, proficiency_level)`, `daily_allocations(employee_id, date, reference_type, reference_id)` (which job-card/rental-dispatch/production-order they're assigned to that day), `overtime_entries`.

### documents
`documents(id, company_id, reference_type enum[repair_job|rental_agreement|production_order|test_report|customer|employee|...], reference_id, category enum[certificate|invoice|drawing|photo|warranty_card|manual|report], storage_path, uploaded_by, uploaded_at)`. Single polymorphic table, not one table per module — this is the generic vault the spec's "Document Management" module needs; every other module just writes rows here pointing at Supabase Storage objects.

### inventory extensions (on top of reused Tradeflow inventory schema)
`serial_numbers(product_id, serial_no, current_status, current_location)` for individually-tracked transformer units; `scrap_entries(product_id, qty, reason, scrapped_at)`; `rental_assets` are deliberately a **separate table from `products`**, not shoehorned into inventory — a rental asset has a lifecycle state machine and calendar that plain stock items don't.

## 3. What's explicitly NOT built as new tables

- Finance, Purchase, base Sales, base Inventory, base CRM: reuse Tradeflow schema as-is, extend only with new `invoice_type` values / FK columns where noted in [Feature Mapping](02-feature-mapping.md).
- Workflow Engine generalized approval-matrix schema: deferred (see [Risk Analysis](07-risk-analysis.md)) — Phase 1-2 ship hardcoded single-approval-step columns per document type (`repair_jobs.approved_by`, mirroring Tradeflow's existing `sales_invoices.approved_by` pattern) instead of a generic engine.
