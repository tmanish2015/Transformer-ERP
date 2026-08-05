# PRODUCTION READINESS REPORT — TransFlow AI ERP

Date: 2026-08-05
Scope: Application-wide production readiness audit (development frozen; audit only — no refactor, no new features).
Method: Static code/schema cross-check + existing live E2E evidence (`_e2e/results/e2e-results.json`, `PHASE2_VERIFICATION_REPORT.md`, `CODE_VERIFICATION_REPORT.md`) + `npm run build`.

---

## Checklist Status

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | All routes exist and return 200 | ✅ PASS | `App.tsx` defines a `<Route>` for every `to` in `nav-items.ts` (verified all nav paths). |
| 2 | No broken navigation | ✅ PASS | Every sidebar `to` resolves to a guarded route; `RequirePermission` correctly redirects missing perms to `/unauthorized`. |
| 3 | No failed API requests | ❌ FAIL | AI Assistant backend queries reference non-existent columns/relationships (Defect 1). |
| 4 | No console errors | ❌ FAIL | Live E2E captured 18 `404` console errors (Defect 3). |
| 5 | Transformer CRUD | ✅ PASS | Code complete; E2E results show create/serial-fallback/dup-validation/search/edit/delete all PASS. |
| 6 | Workshop workflow | ⚠️ INCOMPLETE | Code complete; but regression suite terminated before the workshop section (Defect 4). |
| 7 | Rental workflow | ✅ PASS | Full cycle code present (category→asset→inquiry→quotation→booking→agreement→dispatch→return→inspection→invoice); `run-rental.js` covers it. |
| 8 | Sales workflow | ✅ PASS | Phase 2 report: 26/26 — customer→quotation→SO→DC→invoice→GL→payment all PASS. |
| 9 | Inventory workflow | ✅ PASS | Phase 2 report: masters (products/categories/brands) + purchase stock flow green. |
| 10 | AI Assistant | ❌ FAIL | 3 of 6 intents (sales/inventory/finance) fail at runtime; chart config invalid for string y-key (Defects 1, 2). |
| 11 | Role permissions | ✅ PASS | `ai.view` granted to all non-`unassigned` roles; tenant-scoped RLS policies present; `RequirePermission` gates all routes. |
| 12 | Build passes | ✅ PASS | `npm run build` → `tsc -b` clean + `vite build ✓ built in 8.08s` (3207 modules). |

**Overall: NOT PRODUCTION-READY** — 2 FAIL + 1 INCOMPLETE gates remain.

---

## Actual Defects

### Defect 1 — CRITICAL: AI Assistant backend queries reference non-existent columns/relationships
File: `supabase/functions/ai-assistant/index.ts`, `runIntentQuery()`

The intent queries select columns/relations that do not exist in the actual schema, so PostgREST returns an error and the assistant cannot answer:

| Intent | Query uses | Actual schema | Result |
|--------|-----------|---------------|--------|
| `sales` | `sales_invoices.invoice_amount`, `sales_invoices.total_amount` | Table has `total`, `amount_received` (no `invoice_amount`/`total_amount`) | PostgREST 400 → query fails |
| `inventory` | `stock_levels.reorder_level` | `stock_levels` Row = `{company_id, product_id, warehouse_id, quantity, updated_at}` — `reorder_level` lives on `products` | PostgREST 400 → query fails |
| `finance` | `journal_entries.journal_lines(debit, credit)` | Table is `journal_entry_lines`; `journal_entries` exposes no `journal_lines` relationship | PostgREST 400 → query fails |

Impact: “Show me recent sales invoices”, “Which products are low on stock?”, “Show me recent journal entries” all throw at runtime. The AI Assistant (checklist item 10) is functionally broken for 3 of 6 intents.

### Defect 2 — MEDIUM: AI chart spec uses string fields as numeric y-axis
File: `supabase/functions/ai-assistant/index.ts`, `buildChart()`

- `workshop` → `{ xKey: 'job', yKey: 'status', ... }`
- `rental` → `{ xKey: 'asset', yKey: 'status', ... }`

`status` is a string, but the frontend renders it with Recharts `<Bar dataKey="status">`. A bar chart with a string y dimension renders empty/garbage. The chart is invalid for these two intents even if the query succeeded.

### Defect 3 — MEDIUM: Console 404 errors during live E2E
File: `_e2e/results/e2e-results.json` (log)

18 `[BROWSER-CONSOLE-ERROR] Failed to load resource: the server responded with a status of 404 (Not Found)` events were captured at `03:44:31` during the transformer-regression run (immediately after the Delete step). The specific resources are not logged. This violates “no console errors” (checklist item 4). Needs reproduction with full URL logging to identify the missing asset.

### Defect 4 — LOW: Transformer/Workshop regression suite did not complete
File: `_e2e/results/e2e-results.json`

The `transformer-regression` run ended with `FATAL: Waiting failed: 15000ms exceeded` right after “Delete Transformer”. The subsequent workshop auto-fill + repair-job-creation steps were never executed, so the workshop workflow (checklist item 6) was not fully verified live. This is a verification gap, not proven app failure.

### Defect 5 — LOW: Junk empty files committed to the repo
Files: `frontend/(`, `frontend/onOpenChange(false)}`, `frontend/void`

Three 0-byte files — artifacts of accidental shell redirection. They don’t break the build but clutter the repo root and should be removed before release.

---

## Verified Good (no action needed)

- **Routes & navigation (1, 2):** All sidebar targets mapped to routes; permission gating correct.
- **Transformer CRUD (5):** Full CRUD + blank-serial fallback + duplicate-registration guard verified in E2E results.
- **Rental (7), Sales (8), Inventory (9):** Code-complete and prior live E2E green.
- **Role permissions (11):** `ai.view` seed + tenant-scoped RLS policies are correct; `RequirePermission`/`hasPermission` wired.
- **Build (12):** `npm run build` passes cleanly.

---

## Recommended Order of Fixes (for post-freeze, not executed now)

1. Fix `runIntentQuery` column/relationship references in `supabase/functions/ai-assistant/index.ts` (Defect 1).
2. Fix `buildChart` y-keys to numeric fields or drop the chart for string-based intents (Defect 2).
3. Re-run E2E with URL logging to identify the 404 source (Defect 3).
4. Re-run `run-transformer-regression.js` to completion to close the workshop verification gap (Defect 4).
5. Delete the three junk files (Defect 5).

**No application code was changed during this audit.**
