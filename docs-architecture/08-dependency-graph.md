# Module Dependency Graph

Read as "A → B" = "A depends on B being functional first". This graph drives both the [Roadmap](05-development-roadmap.md) build order and the licensing `module_dependencies` seed data.

```
companies / auth / RBAC / licensing         (foundation — everything depends on this)
        │
        ├── settings (company setup, users)
        │
        ├── inventory ──────────────┬──────────────┐
        │                           │              │
        ├── finance (COA, GL) ◄─────┤              │
        │        │                  │              │
        │        ├── purchases ─────┘              │
        │        │        │                        │
        │        ├── sales ◄───────────────────────┘
        │        │
        │        ├── workshop (repair job invoicing posts to GL)
        │        ├── rental (rental invoicing posts to GL)
        │        └── manufacturing (production cost posts to GL — later phase)
        │
        ├── crm ── (feeds leads/customers into sales, rental inquiries, workshop pickup requests)
        │     │
        │     ├── rental (rental_inquiries.customer_id → crm.customers)
        │     └── workshop (repair_jobs.customer_id → crm.customers)
        │
        ├── rental
        │     ├── requires: inventory (rental_assets as a distinct but company-scoped entity), finance
        │     ├── feeds: maintenance (asset_maintenance_schedules), logistics (dispatch/return trips), documents (agreements, inspection photos)
        │
        ├── workshop
        │     ├── requires: crm, inventory (spare parts consumption), finance
        │     ├── feeds: testing-lab (post-repair test certificate), documents (repair reports), hr (technician allocation)
        │
        ├── manufacturing
        │     ├── requires: inventory (BOM raw materials + finished goods), finance
        │     ├── feeds: testing-lab (factory test certificates), documents
        │
        ├── testing-lab
        │     ├── requires: crm (customer on report), optionally workshop/rental/manufacturing (reference_id)
        │     ├── standalone-capable: a lab can issue a test report with no other module active (important — testing labs are a distinct customer segment per spec)
        │
        ├── maintenance
        │     ├── requires: rental OR manufacturing (something to schedule maintenance against)
        │
        ├── logistics
        │     ├── requires: rental OR workshop (something to dispatch/pickup)
        │
        ├── hr
        │     ├── independent — only weakly coupled via daily_allocations.reference_id (nullable FK, no hard dependency)
        │
        ├── documents
        │     ├── independent — polymorphic, every module writes to it optionally
        │
        ├── reports
        │     ├── requires: whichever modules it reports on (read-only, always last)
        │
        ├── ai-assistant
        │     ├── requires: inventory, rental, workshop (its capabilities query these) — build its data-access RPCs only after those modules exist
        │
        └── workflow (generalized approval engine)
              ├── deferred — see Risk Analysis; no module hard-depends on it, each document type ships a hardcoded single-approval column first
```

## Build-order consequence

1. **Foundation**: companies/auth/RBAC/licensing/settings — nothing else can be built or even demoed without this.
2. **Financial spine**: inventory + finance + purchases + sales (this is ~90% reused from Tradeflow — fastest phase, and it's the prerequisite for every revenue-generating module after it).
3. **Segment-specific engines, in customer-priority order** (see Roadmap for rationale): workshop → rental → testing-lab → manufacturing.
4. **Support modules**: maintenance, logistics, hr, documents — built alongside whichever of #3 needs them first (maintenance rides with rental, logistics rides with workshop's pickup/delivery need).
5. **Cross-cutting intelligence**: reports, ai-assistant — deliberately last, since both are read-layers over data that must already exist.
6. **Workflow engine generalization**: only if/when a second and third module both need configurable multi-step approval (i.e., real evidence of the need, not speculative).
