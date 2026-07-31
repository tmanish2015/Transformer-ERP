# Gap Analysis — Tradeflow-ai-ERP (reference) vs Transformer-AI-ERP (target)

Legend: **Reuse** = copy pattern/schema/component near-verbatim. **Extend** = reuse module skeleton, add domain fields/tables. **New** = no equivalent exists in Tradeflow, build from scratch using the same conventions.

## Platform / cross-cutting

| Area | Tradeflow has it? | Verdict | Notes |
|---|---|---|---|
| Auth (Supabase Auth, email/password, remember-me) | Yes | **Reuse** | No changes needed. |
| RBAC (`has_permission()`, roles, role_permissions) | Yes | **Reuse** | Reseed roles for transformer industry (technician, workshop-manager, lab-engineer, rental-coordinator, etc.) instead of sales_rep/warehouse_manager. |
| Multi-tenancy | No (single-tenant-per-DB) | **New (deviation)** | Spec mandates multi-tenant SaaS from day one. Must add `company_id` to every operational table + RLS predicate `company_id = current_company_id()`. This is the single biggest architectural departure from the reference — see [Database Design](03-database-design.md). |
| Licensing / plans / modules / features / addons | Yes | **Reuse wholesale** | Schema, RPCs (`get_my_entitlements`), and `RequireModule/Feature/Addon` guards map directly onto "Rental Pack", "Manufacturing Pack", "Testing Lab Pack" as `industry_packs`. |
| Feature-module folder anatomy | Yes | **Reuse** | `api/components/hooks/pages/schemas/types/lib` per module. |
| Data table / PageHeader / EmptyState / StatusBadge / KpiCard / DeleteConfirmDialog | Yes | **Reuse verbatim** | Copy components, rebrand only. |
| TanStack Query pattern (query-key per entity, mutation+toast+invalidate) | Yes | **Reuse** | Same hook shape for every new entity. |
| Electron desktop build + web build (`DEPLOY_TARGET`) | Yes | **Reuse** | Workshop-floor PCs and field engineers benefit from the offline-tolerant desktop shell; office/customer/vendor portals use the web build. |
| Command palette, theming, dark/light mode | Yes | **Reuse** | |
| Supabase Edge Function pattern (WhatsApp notify) | Yes | **Extend** | Same pattern reused for SMS/WhatsApp service-status and rental-return reminders; add new functions for PDF certificate generation and AI endpoints (see [API Design](09-api-design.md)). |
| AI Assistant module | Yes (`features/ai-assistant`) | **Extend heavily** | Tradeflow's AI assistant is generic business-insights chat. Transformer-AI-ERP needs domain-specific capabilities: fault diagnosis, spare recommendation, quotation generation, idle-machine natural-language search. Reuse the chat UI shell + edge-function-calling pattern; replace prompts/tools entirely. |
| Reports module | Yes | **Extend** | Reuse report-page/export scaffolding; all report content is new (Machine Utilization, Repair TAT, Machine ROI, etc.). |
| Settings / company setup / user management | Yes | **Reuse**, extend fields | Add company-type flag (repair/manufacturing/rental/testing-lab/EPC) driving which modules are visible by default. |
| Document management (generic file storage) | Partial (invoice PDFs, images only) | **New** | No generic document-vault module exists in Tradeflow. Build new using Supabase Storage + a `documents` table (polymorphic `reference_type`/`reference_id`), same pattern as `whatsapp_message_log`. |

## Business modules

| Spec module | Tradeflow equivalent | Verdict |
|---|---|---|
| CRM (Lead, Customer, Quotation, Follow-up, AMC, Contracts, Pipeline) | `features/crm` (customers, opportunities, support tickets) | **Extend** — add Site Survey, AMC contracts, formal Opportunity Pipeline stages tuned to transformer sales cycle. |
| Dashboard (CEO/Workshop/Rental/Finance/Inventory/HR/Engineer) | `features/dashboard` (single generic dashboard) | **Extend** — reuse KPI-card/chart shell, build N role-specific dashboard variants. |
| Rental Management (full lifecycle) | None | **New** — largest module, no equivalent at all. Full inquiry→quotation→booking→agreement→dispatch→return→inspection→invoice workflow, asset calendar, QR/asset tracking. |
| Transformer Repair Workshop (job-card lifecycle) | None (Tradeflow has no repair/service-order concept) | **New** — closest structural analogue is Sales/Purchase document-with-line-items + status-transition triggers (reuse that *pattern*, not the tables). |
| Transformer Manufacturing (BOM, production planning) | None | **New** — no BOM/production concept in Tradeflow at all. |
| Inventory | `features/inventory` (products, stock, warehouses, batches, categories, brands, aging) | **Extend** — add serial-number tracking (individual transformer units), scrap tracking, rental-asset-as-inventory-item distinction. |
| Purchase | `features/purchases` (PR→PO→GRN→bill→payment, vendor performance) | **Reuse** almost as-is. |
| Sales | `features/sales` (quotation→SO→invoice→dispatch→DC→payment) | **Extend** — add AMC billing, rental billing, repair billing as invoice sub-types (mirrors existing `sales_invoice_type` tagging convention already in migration `20260716094914`). |
| Testing Laboratory (IR/TR/BDV/etc. + PDF certificates) | None | **New** — but reuse `pdf-export.ts`/`print-document.ts` lib pattern for certificate generation. |
| Preventive Maintenance | None | **New** — scheduling/reminders can reuse the WhatsApp-notify edge-function pattern. |
| Logistics (vehicles, drivers, trips, GPS-ready) | None | **New**. |
| Finance | `features/finance` (COA, journal entries, auto-posting triggers, GST/TDS) | **Reuse** almost as-is — auto-posting-on-status-transition trigger pattern extends naturally to repair job-cards and rental invoices. |
| HR (attendance, leave, salary, skill matrix) | None | **New**. |
| Reports | `features/reports` (scaffold only) | **Extend** — new report content. |
| Workflow Engine (approval matrix, escalation) | Only ad-hoc (`invoice_approvers` table for one flow) | **New (generalize)** — Tradeflow only has a single hardcoded approval flow for sales invoices; needs generalizing into a configurable approval-matrix engine if the spec's "configurable workflows" requirement is taken literally. Flag as a **high-effort / defer-to-later-phase** candidate (see [Risk Analysis](07-risk-analysis.md)). |
| Mobile-ready (Engineer/Customer/Vendor/Technician portals) | None (single responsive web app, no portal separation) | **New** — reuse the same React app + RBAC, but needs distinct route trees / simplified layouts per portal; not separate codebases. |

## Net takeaway

Roughly **40%** of the platform (auth, RBAC, licensing, UI kit, query pattern, finance core, purchase, base inventory, base sales, base CRM) is direct reuse or light extension. The remaining **60%** — Rental, Workshop/Repair, Manufacturing, Testing Lab, Preventive Maintenance, Logistics, HR, Document Management, and a generalized Workflow Engine — is genuinely new domain-specific engineering, built using the reference's conventions but with zero shared tables/business logic. This ratio should anchor the [Roadmap](05-development-roadmap.md) and [Risk Analysis](07-risk-analysis.md).
