# API Design

No custom REST/GraphQL backend — same as Tradeflow, the "API" is: Supabase auto-generated PostgREST over RLS-protected tables (client calls `supabase.from(...)` directly from `features/<module>/api/*.ts`), plus `security definer` RPC functions for anything requiring cross-table logic or privilege elevation, plus Edge Functions for anything needing a 3rd-party call or server-side rendering (PDF).

## 1. Table access (PostgREST via supabase-js)
Pattern unchanged from Tradeflow §10: `api/*.ts` files do `supabase.from('table').select('*, relation:other!fk(cols)').order(...)`, RLS silently scopes every query to `company_id = current_company_id()` + `has_permission()`. No manual tenant filtering in client code — the same query that worked in Tradeflow's single-tenant model works here unmodified, RLS does the multi-tenant scoping invisibly.

## 2. RPC functions (new, beyond what Tradeflow has)

| Function | Purpose | Security |
|---|---|---|
| `current_company_id()` | Resolve caller's tenant | `stable security definer`, locked to `authenticated` only |
| `next_repair_job_number()`, `next_rental_agreement_number()`, `next_test_certificate_number()`, `next_production_order_number()` | Document numbering sequences | Same pattern as Tradeflow's `next_po_number()` |
| `transition_repair_job_stage(job_id, new_stage)` | Enforce legal stage transitions (Risk #5), write `repair_job_stage_history` row | `security definer`, revoke-all-then-grant-to-authenticated |
| `transition_rental_asset_status(asset_id, new_status, ...)` | Same for rental lifecycle | Same pattern |
| `get_my_entitlements(p_license_key)` | Licensing — reused verbatim from Tradeflow | Reused verbatim |
| `can_activate_module`, `apply_plan_defaults`, `activate_customer`/`suspend_customer`/etc. | Licensing lifecycle — reused verbatim | Reused verbatim |
| `calculate_rental_invoice(agreement_id)` | Compute rental charges (base + late-return + operator + fuel + transport) at invoice time | `security definer`, called from sales-invoice creation flow |
| `explode_bom(bom_id, qty)` | Compute raw material requirement for a production order | `stable security definer` (read-only) |

All follow Tradeflow's hardening convention: `revoke all on function ... from public, anon, authenticated;` then `grant execute ... to authenticated;` for the intended entrypoint only, plus `set search_path = public`.

## 3. Triggers (server-side "API" for state consistency, not client-invoked)

- `<table>_set_updated_at` — generic `before update` trigger, one shared function reused across all tables (small improvement over Tradeflow, which sets it ad-hoc per trigger — worth generalizing since we're touching every table anyway for `company_id`).
- Stage-history triggers (workshop, manufacturing) — `after update` on status change, mirrors Tradeflow's stock-reconciliation-trigger pattern.
- Auto-posting triggers (workshop invoice, rental invoice) — `after insert`, mirrors Tradeflow's finance auto-posting triggers, using the account-code-mapping table from Risk #4.
- Rental asset status trigger — moves `rental_assets.status` in lockstep with `rental_dispatches`/`rental_returns` inserts.

## 4. Edge Functions (Deno, `supabase/functions/*`)

| Function | Input | Output | Notes |
|---|---|---|---|
| `whatsapp-notify` | `{event_type, customer_id, reference}` | log row | Reused verbatim from Tradeflow, new event types added (rental-return-due, maintenance-due, test-certificate-ready) |
| `service-reminder-notify` | (scheduled, no client input — invoked by `pg_cron` or Supabase Scheduled Function) | log rows | Scans `maintenance_schedules.next_due_at`, calls `whatsapp-notify` internally per due schedule |
| `test-certificate-pdf` | `{test_report_id}` | `{storage_path}` | Renders `test_reports` + `test_report_results` into a formatted PDF (server-side, so it's identical regardless of which client/portal requested it), uploads to Storage, inserts `test_certificates` row |
| `ai-quotation-generator` | `{lead_id or rental_inquiry_id}` | draft quotation JSON | Calls Anthropic API server-side (keeps API key off the client); returns a draft the user must review/edit before saving — never auto-saves (Risk #6) |
| `ai-fault-diagnosis` | `{repair_job_id, symptom_text}` | ranked diagnosis suggestions | Same "suggestion only" contract |
| `ai-spare-recommendation` | `{repair_job_id or product_id}` | ranked spare list | Same contract |
| `ai-predictive-maintenance` | `{rental_asset_id}` | risk score + recommended next service date | Reads usage/maintenance history, calls Anthropic API for narrative explanation |
| `ai-nl-search` | `{query_text}` (e.g. "machines idle for more than 30 days") | structured result set | Translates NL to a constrained, whitelisted query template (not raw SQL generation — security: never let the LLM construct arbitrary SQL against a multi-tenant DB) |
| `ai-business-insights` | `{company_id (implicit via auth), period}` | narrative + chart data | Aggregates existing report RPCs, summarizes via Anthropic API |

**Security note for all `ai-*` functions**: they run server-side with the caller's JWT (not service-role), so RLS still applies — the AI can only ever see/summarize data the calling user's `company_id` + permissions already allow. `ai-nl-search` in particular must map natural language to a fixed set of parameterized queries, never to dynamically constructed SQL, to avoid both SQL injection and cross-tenant query construction errors.

## 5. Client-side data layer (unchanged pattern from Tradeflow)

`types → zod schema → api.ts (raw supabase calls / RPC calls) → hooks/use-<entity>.ts (TanStack Query wrapper + toast) → page.tsx`. Every new entity across every new module follows this exact chain — no exceptions, no alternate state-management library introduced.
