# Feature Mapping

Each spec module mapped to a `frontend/src/features/<slug>` folder, its reuse verdict (from [Gap Analysis](01-gap-analysis.md)), and its core entities (→ drives [Database Design](03-database-design.md)).

| # | Spec module | `features/` slug | Verdict | Core entities |
|---|---|---|---|---|
| 1 | Authentication & Company Setup | `auth`, `settings` | Reuse | profiles, roles, permissions, company (multi-tenant: `companies`) |
| 2 | Dashboards | `dashboard` | Extend | dashboard is a composition layer over other modules' aggregate queries; one page per role variant |
| 3 | CRM | `crm` | Extend | leads, customers, site_surveys, quotations, opportunities, amc_contracts |
| 4 | Rental Management | `rental` | New | rental_assets, rental_asset_categories, rental_inquiries, rental_quotations, rental_bookings, rental_agreements, rental_dispatches, rental_returns, rental_inspections, rental_damage_assessments, rental_invoices, rental_calendar (view), asset_maintenance_schedules, asset_calibration_schedules, asset_insurance |
| 5 | Transformer Repair Workshop | `workshop` | New | repair_jobs (job card, the "document header"), repair_job_stages (dismantling/core-inspection/coil-inspection/rewinding/core-assembly/tank-repair/painting/oil-filling/testing/qc/dispatch/installation as a status-history table), repair_estimates, repair_estimate_approvals, repair_warranties |
| 6 | Transformer Manufacturing | `manufacturing` | New | boms, bom_lines, production_orders, production_stages (winding/assembly/testing/painting/packing/dispatch), raw_material_plans |
| 7 | Inventory | `inventory` | Extend | products (raw material + finished goods + spares), categories, brands, units, warehouses, stock_levels, stock_movements, batches, serial_numbers (new), scrap_entries (new) |
| 8 | Purchase | `purchases` | Reuse | purchase_requisitions, purchase_orders, grns, grn_qc (new), vendor_bills, vendor_payments, vendor_performance |
| 9 | Sales | `sales` | Extend | quotations, sales_orders, sales_invoices (+ `invoice_type`: standard/amc/rental/repair), delivery_challans, dispatches, payment_followups |
| 10 | Testing Laboratory | `testing-lab` | New | test_types (IR/TR/BDV/HV/vector-group/load/temp-rise), test_reports, test_report_results (per-parameter readings), test_certificates (generated PDF metadata) |
| 11 | Preventive Maintenance | `maintenance` | New | maintenance_schedules (polymorphic over rental_assets/manufactured units), maintenance_visits, maintenance_checklists, maintenance_checklist_items |
| 12 | Logistics | `logistics` | New | vehicles, drivers, trips (pickup/delivery), trip_costs, trip_photos, customer_signatures |
| 13 | Finance | `finance` | Reuse | chart_of_accounts, journal_entries, journal_entry_lines, cash_bank_accounts, expenses, gst/tds ledgers, outstanding views |
| 14 | HR | `hr` | New | employees (superset of profiles for non-login staff), attendance, leaves, salary_slips, skill_matrix, daily_allocations, overtime_entries |
| 15 | Document Management | `documents` | New | documents (polymorphic `reference_type`/`reference_id`, Supabase Storage path, category enum: certificate/invoice/drawing/photo/warranty-card/manual/report) |
| 16 | Reports | `reports` | Extend | no new tables — all reports are read-models (views/RPCs) over the modules above |
| — | AI Assistant | `ai-assistant` | Extend | ai_conversations, ai_messages (reuse if present), new edge functions per capability |
| — | Workflow Engine | `workflow` | New, phased | approval_matrices, approval_steps, approval_instances — generalization of Tradeflow's one-off `invoice_approvers`; **defer to Phase 3+**, ship module-specific hardcoded approval columns first (mirrors how Tradeflow itself only has the one hardcoded flow today) |
| — | Licensing (vendor-side SaaS) | `licensing`, `super-admin` | Reuse wholesale | plans, industry_packs, modules, module_dependencies, features, addons, license_customers(→companies), customer_subscriptions/modules/features/addons, licenses, license_logs |

## Portals (not separate codebases — route trees within the one app)

| Portal | Route prefix | Reused shell | Notes |
|---|---|---|---|
| Owner/Admin ERP | `/` (existing Layout) | Full sidebar | All modules per RBAC + licensing |
| Engineer (mobile) | `/engineer` | Stripped layout, mobile-first | Job cards assigned to them, test entry, checklist completion, photo upload |
| Customer Portal | `/portal/customer` | Minimal layout, no sidebar | View quotations, invoices, AMC status, rental agreement, test certificates |
| Vendor Portal | `/portal/vendor` | Minimal layout | View POs, submit bills, track payments |
| Technician Portal | `/portal/technician` | Same as Engineer, different RBAC role | Daily allocation, checklist, attendance punch |

All four portals reuse the same Supabase Auth + `has_permission()`/licensing guards — just gated to a narrower nav/route subset per role, exactly like Tradeflow's `nav-items.ts` permission-filtered array.
