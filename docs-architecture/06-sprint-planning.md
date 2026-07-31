# Sprint Planning

2-week sprints assumed. This breaks Phase 0-2 (the highest-uncertainty, highest-value phases) into concrete sprints. Phases 3-6 follow the same rhythm once the pattern is proven — detailed sprint breakdown for those should be done at the start of each phase, not speculatively now.

## Sprint 1 — Tenant foundation
- `companies` table, `current_company_id()`, tenant-scoped RLS generator function
- RBAC reseed (roles/permissions for transformer industry roles)
- Company onboarding wizard (signup → create company → become admin)
- Auth pages (login/signup/forgot-password/reset-password) ported from Tradeflow
- **Demo**: sign up as a new company, log in, see empty shell.

## Sprint 2 — Licensing + UI kit + shell
- Licensing sub-schema ported + seeded (plans/industry-packs/modules for this project)
- `LicenseProvider`, `RequireModule/Feature/Addon` guards ported
- UI kit ported (shadcn, DataTable, PageHeader, KpiCard, StatusBadge, DeleteConfirmDialog, layout/sidebar/nav-items, command palette, theming)
- Settings module (company profile, user management, role management)
- **Demo**: admin can invite a user, assign a role, toggle theme, see licensed-module-aware sidebar.

## Sprint 3 — Inventory core
- products/categories/brands/units/warehouses/stock_levels/batches (ported + tenant-scoped)
- serial_numbers, scrap_entries (new)
- **Demo**: add a product, receive stock into a warehouse, view stock levels.

## Sprint 4 — Finance core
- COA seed, journal_entries/lines, cash/bank accounts, expenses
- Auto-posting trigger pattern (generalized to accept a config of account-code mappings, reusable by later modules)
- **Demo**: manual journal entry posts and balances; trial balance report renders.

## Sprint 5 — Purchases
- PR→PO→GRN→bill→payment, vendor performance
- **Demo**: raise a PO, receive GRN, post a vendor bill, record payment — GL updates automatically.

## Sprint 6 — Sales + base CRM
- leads/customers/quotations (crm base)
- quotation→SO→invoice→dispatch→DC (sales base), `invoice_type='standard'` only
- **Demo**: convert a lead to customer, quote, invoice, dispatch — GL updates automatically.

## Sprint 7 — Workshop I: job card + estimate
- repair_jobs, repair_estimates, repair_estimate_approvals (hardcoded single-approver column, no generalized workflow)
- Pickup request capture (feeds logistics minimally: a trip row, no full logistics UI yet)
- **Demo**: customer complaint → pickup request → inspection → estimate → customer approval.

## Sprint 8 — Workshop II: stage tracking + dispatch
- repair_job_stage_history (all 12 stages), status-transition trigger
- documents module (minimal: upload/list against `reference_type='repair_job'`)
- **Demo**: move a job through every repair stage with photo/document attachment at each.

## Sprint 9 — Testing Lab + certificates
- test_types seed, test_reports, test_report_results
- test-certificate-pdf edge function, `test_certificates` storage
- Wire into workshop (post-repair test) and stand it up as fully standalone-usable too
- **Demo**: issue a test certificate PDF for a completed repair job, and independently for a walk-in lab customer with no repair job at all.

## Sprint 10 — Workshop III: invoicing + warranty + HR-lite
- sales extended with `invoice_type='repair'`, auto-posting wired
- repair_warranties
- hr-lite: employees + daily_allocations (technician assignment only)
- **Demo**: full repair lifecycle, pickup to invoiced-and-under-warranty, technician-attributed throughout.

## Sprint 11-12 — Phase 2 hardening + Phase 1 pilot feedback loop
- Bug-fix/patch migrations expected here (Tradeflow's own history shows this is normal — e.g. its `licensing_grant_super_admin` fix 2 days after initial ship)
- Reports: Repair TAT, Engineer Productivity (first real report content, scoped to what exists)
- Pilot customer onboarding for Workshop vertical

Sprints for Manufacturing (Phase 4) and the rest of Phase 5-6 should be planned with the same granularity once Rental ships — front-loading all sprint detail now would be speculative planning against a vertical that hasn't been built yet. Rental (Phase 3), now that Workshop has shipped, breaks down the same way:

## Sprint 13 — Rental I: asset catalog + inquiry + quotation + booking
- `rental_asset_categories`, `rental_assets` (own table per 03-database-design.md — not shoehorned into `products`; status enum `available/booked/dispatched/running/returned/maintenance/retired`, `qr_code`)
- `rental_inquiries`, `rental_quotations` + line items, `rental_bookings`
- **Demo**: add a rental asset, capture an inquiry, quote it, book it — booking reserves the asset (`status → booked`).

## Sprint 14 — Rental II: agreement + logistics + dispatch/running
- logistics module, base build (deferred from Phase 2 — see workshop_schema.sql's note on pickup being plain columns instead): `vehicles`, `drivers`, `trips`, `trip_costs`, `trip_photos`, `customer_signatures`; `gps_*` stay `jsonb` placeholders, no live device integration
- `rental_agreements` (deposit/late-return/operator/fuel charge-rate terms), `rental_dispatches` (linked to a trip)
- **Demo**: convert a booking to an agreement, dispatch with a logistics trip, asset goes `dispatched → running`.

## Sprint 15 — Rental III: return + inspection + damage assessment
- `rental_returns`, `rental_inspections`, `rental_damage_assessments`; return also uses a logistics trip (pickup)
- **Demo**: return an asset, inspect it, log damage if any, asset goes `returned → available` (or `→ maintenance` if damaged).

## Sprint 16 — Rental IV: invoicing + maintenance + calendar/QR + reports
- sales extended with `invoice_type='rental'`; `calculate_rental_invoice(agreement_id)` RPC (base + late-return + operator + fuel/transport)
- maintenance module: `maintenance_schedules` (generic `reference_type` — `rental_asset` now, `manufactured_unit` later), `maintenance_visits`, `maintenance_checklists` + items
- Rental Calendar/Availability view, QR code generation surfaced on the asset detail screen
- Machine Utilization, Machine Profitability/ROI, Idle Machine reports
- **Demo**: full rental lifecycle inquiry-to-invoiced, calendar shows availability, QR renders on an asset, ROI/idle reports populated.

Manufacturing (Phase 4), now that Rental has shipped, breaks down the same way — smaller than the other two verticals since it's mostly composition of already-built pieces (inventory movements, serial_numbers, testing-lab):

## Sprint 17 — Manufacturing I: BOM + production order intake
- `boms` + `bom_lines` (a BOM builder: pick the finished product, add raw-material lines with qty/unit)
- `production_orders` (raised from a BOM, target qty, status `draft/planned/in_progress/completed/cancelled`)
- `explode_bom(bom_id, qty)` RPC + `raw_material_requirements` snapshotted per order at creation (so a later BOM edit doesn't retroactively change what an already-raised order required)
- **Demo**: build a BOM for a transformer, raise a production order, see computed raw material requirements.

## Sprint 18 — Manufacturing II: stage tracking + consumption + serial output
- `production_stage_history` (winding → assembly → testing → painting → packing → dispatch, append-only, same convention as `repair_job_stage_history`)
- inventory extended: `stock_movements.movement_type` gains `production_consumption` (raw materials, negative qty) and `production_output` (finished good, positive qty) — the existing `apply_stock_movement` trigger needs no changes, it already just adds signed quantity
- completing a production order inserts a `serial_numbers` row for the finished, serial-tracked transformer
- **Demo**: move a production order through every stage, raw materials deduct from stock, completion produces a serial-tracked finished unit.

## Sprint 19 — Manufacturing III: factory acceptance testing + close-out
- testing-lab extended: `test_reports.production_order_id` (nullable, alongside the existing `repair_job_id`) for the factory acceptance test flow
- Production Reports (first real report content for this vertical, scoped to what exists — order cycle time, material variance)
- **Demo**: full production order lifecycle — BOM → order → stage tracking → material consumption → serial-tracked output → factory acceptance certificate. This closes Phase 4's exit criterion.

Phase 5 (CRM depth + AMC + full HR + Reports + AI Assistant), now that all three verticals have shipped, is the largest remaining phase — it touches almost every module rather than building a new vertical, so it breaks into more, smaller sprints:

## Sprint 20 — CRM Depth I: site survey + opportunity pipeline
- `site_surveys`, `opportunities` (kanban-style pipeline: new → qualified → proposal → negotiation → won/lost). New `crm.view`/`crm.manage` permissions — Sprint 6 gated customers/quotations under `sales.*` instead of the `crm` licensing module they were meant for; these new, genuinely relationship/pipeline entities (not transactional documents) get the module's own permission pair, existing tables stay as-is
- **Demo**: schedule a site survey, log findings, open an opportunity from it, move it through the pipeline to won.

## Sprint 21 — CRM Depth II: AMC contracts + revenue/outstanding reports
- `amc_contracts` (+ line items for covered assets/equipment), `sales_invoices` extended with `invoice_type='amc'` (already pre-committed) and a renewal-due view
- Reports: AMC Revenue, Customer Outstanding, Vendor Outstanding, Inventory Aging — the remaining report content named in the roadmap that didn't have an obvious single-module home
- **Demo**: create an AMC contract, see it drive a renewal reminder, reports populated.

## Sprint 22 — HR completion I: attendance + leave (external service)
- Built in **hr-payroll-service** (the standalone project), not Transformer's own DB — that's the entire point of having extracted it: `attendance`, `leaves` land there once, both Tradeflow and Transformer get them. Client SDK + Transformer's `hr-proxy` extended to forward the new routes.
- **Demo**: mark attendance for a technician, request and approve leave.

## Sprint 23 — HR completion II: salary + skill matrix + overtime (external service)
- `salary_slips`, `skill_matrix`, `overtime_entries` — same external-service pattern as Sprint 22.
- **Demo**: generate a salary slip for a month, record a skill rating, log overtime.

## Sprint 24 — AI Assistant I: suggestion functions
- `ai-quotation-generator`, `ai-fault-diagnosis`, `ai-spare-recommendation` — each a Deno edge function calling the Anthropic API server-side (key never reaches the client), "suggestion only" contract (Risk #6 — never auto-saves, user must review/edit)
- **Demo**: generate a draft quotation from a lead, get ranked fault-diagnosis suggestions for a repair job, get ranked spare-part suggestions.

## Sprint 25 — AI Assistant II: forecasting + insights
- `ai-predictive-maintenance`, `ai-inventory-forecasting`, `ai-revenue-forecast`, `ai-business-insights`, `ai-nl-search` (constrained to a whitelisted query template set, never raw SQL generation — security-critical per Risk Analysis)
- **Demo**: predictive maintenance risk score for a rental asset, inventory reorder forecast, revenue forecast, an insights summary, and a natural-language query returning structured results.

## Sprint 26 — Role-specific dashboards
- CEO, Workshop, Rental, Finance, Inventory, HR, Engineer dashboards — mostly composition of KPI cards/charts already built for each module's own dashboard, filtered/reshaped per role
- **Demo**: log in as each role, see a dashboard tailored to what that role needs to act on. Closes Phase 5.
