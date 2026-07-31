# Folder Structure

Top-level mirrors Tradeflow exactly (`backend/` omitted entirely this time — it was dead weight there; don't cargo-cult an empty folder):

```
transformer-ai-erp/
  frontend/
  database/
  supabase/
  desktop/
  docs/
  docs-architecture/   (this folder)
```

## frontend/src

```
frontend/src/
  App.tsx                     # all routes, lazy-loaded pages, guard nesting
  main.tsx
  index.css
  vite-env.d.ts
  providers/
    auth-provider.tsx
    license-provider.tsx
    query-provider.tsx        (if not inlined in main.tsx, per Tradeflow's actual shape check at impl time)
  lib/
    supabase.ts                # client + remember-me storage adapter + desktop config injection
    query-client.ts
    utils.ts                   # cn()
    datetime.ts
    number-to-words.ts
    chart-colors.ts
    pdf-export.ts
    print-document.ts
    share-document.ts
    whatsapp-notify.ts
    qr-code.ts                 # new — asset QR generation (rental + serial-tracked inventory)
    gst-state-codes.ts
  types/
    database.types.ts          # Supabase-generated, single source of truth
  components/
    ui/                        # shadcn primitives, unchanged from Tradeflow
    data-table/
    form/
    shared/                    # page-header, empty-state, status-badge, kpi-card, delete-confirm-dialog
    layout/                    # sidebar, mobile-sidebar, header, nav-items.ts, theme-toggle
    auth/                      # protected-route, guest-route, require-permission
    licensing/                 # require-module, require-feature, require-addon
    brand/                     # transformer-ai-erp-mark.tsx (replaces tradeflow-mark.tsx)
    command-menu.tsx
  hooks/                       # intentionally empty at root, per Tradeflow convention — everything feature-local
  features/
    auth/
    dashboard/
    crm/
    rental/                    # {api,components,hooks,pages,schemas,types,lib}
    workshop/
    manufacturing/
    inventory/
    purchases/
    sales/
    testing-lab/
    maintenance/
    logistics/
    finance/
    hr/
    documents/
    reports/
    settings/
    licensing/
    super-admin/
    ai-assistant/
  portals/                     # NEW top-level sibling to features/ — thin route/layout shells only, no business logic
    engineer/
      engineer-layout.tsx
      engineer-home-page.tsx   # composes existing feature pages/hooks (workshop, maintenance) with a stripped nav
    customer/
      customer-portal-layout.tsx
    vendor/
      vendor-portal-layout.tsx
    technician/
      technician-layout.tsx    # thin variant of engineer/, shares most components
```

Each `features/<module>/` internal shape, unchanged from Tradeflow:

```
features/<module>/
  api/<module>-api.ts          # or split by sub-domain if module is large (rental, workshop)
  hooks/use-<entity>.ts        # one file per entity
  components/<thing>-dialog|drawer|sheet|manager.tsx
  pages/<entity>-page.tsx
  schemas/<module>-schemas.ts
  types/<module>-types.ts
  lib/                         # feature-specific non-React helpers (e.g. workshop/lib/repair-job-tat.ts)
```

Large modules split `api`/`hooks` by sub-domain like Tradeflow's inventory does:
- `rental/api/{assets-api,bookings-api,agreements-api,dispatch-api,returns-api,inspections-api}.ts`
- `workshop/api/{jobs-api,estimates-api,stages-api,warranties-api}.ts`
- `manufacturing/api/{bom-api,production-orders-api,stages-api}.ts`

## database/

```
database/
  migrations/                  # dated .sql files, one concern per file, same conventions as Tradeflow
  00_full_schema.sql           # concatenated ledger, regenerated after each migration
  backup.ps1 / restore.ps1 / restore.mjs
  README.md
```

## supabase/functions/

```
supabase/functions/
  whatsapp-notify/              # reused verbatim
  service-reminder-notify/      # new — maintenance due reminders
  test-certificate-pdf/         # new — renders test_reports into a PDF, writes to Storage
  ai-quotation-generator/       # new
  ai-fault-diagnosis/           # new
  ai-spare-recommendation/      # new
  ai-nl-search/                 # new — natural-language query over machines/inventory
```

## desktop/

Copied structure from Tradeflow (`main.js`, `preload.js`, `static-server.js`, `first-run/`, `license/trial.js`, `scripts/copy-frontend.mjs`) — rebrand only, no structural change.
