# Development Roadmap

Phased per the [Dependency Graph](08-dependency-graph.md). Each phase ends with a working, demoable slice — no phase produces dead/unwired code.

## Phase 0 — Foundation (multi-tenant platform)
- `companies`, tenant-scoped RLS pattern, `current_company_id()`, reused RBAC (`has_permission`) reseeded with transformer-industry roles (super_admin, admin, workshop_manager, rental_coordinator, lab_engineer, technician, accountant, viewer).
- Licensing sub-schema ported wholesale; seed plans/industry-packs/modules for this project.
- Auth pages, company setup/onboarding wizard, user management, settings shell.
- Base UI kit ported (shadcn components, DataTable, PageHeader, KpiCard, StatusBadge, DeleteConfirmDialog, layout/sidebar/nav-items, command palette, theming).
- Dashboard shell (empty widgets, wired to nothing yet).
- **Exit criterion**: a new company can sign up, log in, see an empty but themed ERP shell, manage users/roles.

## Phase 1 — Financial spine (mostly reuse → fastest phase)
- inventory (products, categories, brands, units, warehouses, stock, batches; + serial_numbers, scrap_entries additions)
- finance (COA, journal entries, auto-posting trigger pattern, GST/TDS, cash/bank, expenses)
- purchases (PR→PO→GRN→bill→payment→vendor performance)
- sales (quotation→SO→invoice→dispatch→DC→payment-followup) — base, without AMC/rental/repair invoice sub-types yet
- crm (leads, customers, quotations, follow-ups — base, without site-survey/AMC/pipeline yet)
- **Exit criterion**: a company can manage inventory, buy from vendors, sell to customers, and see a correct trial balance.

## Phase 2 — First vertical: Workshop (repair) — pick ONE segment to prove the pattern end-to-end
- workshop module full lifecycle (job card → estimate → approval → all repair stages → QC → dispatch → installation → warranty)
- testing-lab (needed for post-repair test certificates — build alongside, not after)
- documents module (repair reports, warranty cards need somewhere to live)
- sales extended with `invoice_type='repair'`
- logistics (pickup/delivery trips for workshop) — minimal version (vehicle/driver/trip only, GPS fields unused)
- hr — minimal (technician allocation only, not full payroll yet)
- **Exit criterion**: full repair job lifecycle demoable for one pilot customer, including test certificate PDF and invoice.

## Phase 3 — Second vertical: Rental
- rental module full lifecycle (inquiry → quotation → booking → agreement → dispatch → running → return → inspection → damage assessment → invoice → available)
- maintenance module (asset maintenance/calibration schedules, reminders)
- rental calendar / availability view, QR code generation for assets
- sales extended with `invoice_type='rental'`
- logistics extended with GPS-ready fields actually surfaced in UI
- **Exit criterion**: full rental lifecycle demoable, machine profitability/ROI/idle reports available.

## Phase 4 — Third vertical: Manufacturing
- manufacturing module (BOM, production orders, production stage tracking, raw material planning)
- inventory extended with production-consumption movements
- testing-lab extended with factory acceptance test flow
- **Exit criterion**: a production order can be raised from a BOM, consume raw materials, and produce a serial-tracked finished transformer with a test certificate.

## Phase 5 — CRM depth + AMC + full HR + Reports + AI Assistant
- crm extended: site survey, AMC contracts, opportunity pipeline
- hr completed: attendance, leave, salary, skill matrix, overtime
- reports: all report content across every module (Machine Utilization, Repair TAT, Machine ROI, Inventory Aging, Customer/Vendor Outstanding, AMC Revenue, etc.)
- ai-assistant: quotation generator, fault diagnosis, spare recommendation, predictive maintenance, inventory forecasting, revenue forecast, business insights chat, NL search — each as its own edge function, shipped incrementally within this phase
- role-specific dashboards (CEO/Workshop/Rental/Finance/Inventory/HR/Engineer)

## Phase 6 — Portals + mobile-ready + polish
- Engineer/Technician/Customer/Vendor portal route trees
- Electron desktop packaging + web deploy pipeline (reuse Tradeflow's `DEPLOY_TARGET` dual-build)
- Workflow engine generalization — **only if** by this point two+ modules have proven the need for configurable multi-step approval beyond the hardcoded single-approver column shipped per module in earlier phases

## Explicit non-goals for v1 (call out, don't silently drop)
- Real GPS device integration (schema is GPS-ready, live tracking device integration is a separate, later procurement-dependent effort)
- Real WhatsApp/SMS provider wiring (reuse Tradeflow's "stubbed" pattern until a provider contract exists)
- Generalized workflow/approval engine (Phase 6, conditional)
