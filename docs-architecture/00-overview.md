# Transformer-AI-ERP — Architecture Package

Reference project: `C:\Projects\tradeflow-ai-erp` (engineering patterns only — not a business-logic source; see [Reference Architecture Survey] embedded in project memory / this session).

This folder contains the 10 planning artifacts required before any code is written, per project directive:

1. [Gap Analysis](01-gap-analysis.md)
2. [Feature Mapping](02-feature-mapping.md)
3. [Database Design](03-database-design.md)
4. [Folder Structure](04-folder-structure.md)
5. [Development Roadmap](05-development-roadmap.md)
6. [Sprint Planning](06-sprint-planning.md)
7. [Risk Analysis](07-risk-analysis.md)
8. [Dependency Graph](08-dependency-graph.md)
9. [API Design](09-api-design.md)
10. [Screen Inventory](10-screen-inventory.md)

## Decisions locked in from the reference-architecture survey

- **Stack**: React 19 + Vite + TypeScript (strict) + Tailwind v4 + shadcn/ui (`base-nova` style) + TanStack Query/Table + React Hook Form + Zod + Supabase (Postgres/Auth/Storage/Edge Functions).
- **Tenancy model — one deliberate change from the reference**: Tradeflow is single-tenant-per-Supabase-project (no `company_id` column; RLS scoped only by `has_permission()`). The spec for Transformer-AI-ERP explicitly requires **multi-tenant from day one**. Decision: add a real `company_id` tenant column + RLS tenant-scoping on every operational table (a genuine deviation from the reference schema), while reusing Tradeflow's **licensing sub-schema wholesale** (plans/modules/features/addons/customers) as the vendor-side SaaS entitlement layer sitting alongside it. See [Database Design §0](03-database-design.md) for the RLS pattern this implies.
- **Module anatomy**: `features/<module>/{api,components,hooks,pages,schemas,types,lib}` — one file per concern unless the module is large (inventory-style split by sub-domain).
- **RBAC**: reuse `has_permission()` SQL function + `role_permissions` join table + `<module>.view`/`<module>.manage` two-tier permission convention.
- **Desktop + Web dual build**: reuse the `DEPLOY_TARGET` Vite env-var trick and Electron wrapper for field-engineer offline-capable desktop use (workshop floor PCs), web build for office/portal use.
- **Do not reuse**: any Hardware-ERP business logic, GST-specific hardware categories, HSN seed data, or Tradeflow branding.
