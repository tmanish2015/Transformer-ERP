# GST Everywhere + Document Sharing — Implementation TODO

## Phase 1 — Database & Types
- [ ] Migration `20260820090000_company_settings_and_gst_fields.sql`:
  - Companies: logo_url, company_address, gstin, pan_number, terms_conditions, authorized_signatory, bank_name, account_number, ifsc_code, branch_name, company_email, company_phone, website
  - Customers: pan_number, state, state_code
- [ ] Update `frontend/src/types/database.types.ts` for new companies/customers columns

## Phase 2 — Part 1: Customer Master GST
- [ ] `sales-schemas.ts`: GSTIN (15 char / uppercase), PAN (format), state, state_code validation
- [ ] `sales-api.ts`: persist/select pan_number, state, state_code
- [ ] `customers-page.tsx`: form fields (PAN, State, State Code) + list columns (GSTIN, PAN, State, Phone, Email) + search on name/GSTIN/PAN

## Phase 3 — Part 2: Show GST everywhere
- [ ] Quotations page: GSTIN column
- [ ] Sales Orders page: GSTIN column (+ type/API update to fetch customer gstin)
- [ ] Sales Invoices page: GSTIN column (already present — verify)
- [ ] Delivery Challans page: GSTIN column (+ type/API update)

## Phase 4 — Company Settings page (Part 4 prerequisite)
- [ ] Company Profile page extended with all new editable fields
- [ ] Backward-compatible defaults/placeholders

## Phase 5 — PDF Generation (Part 4)
- [ ] `frontend/src/lib/pdf-generator.ts`: A4 job-pdf for Quotation, SO, Invoice, PO, DC, Customer Ledger, Supplier Ledger
- [ ] Includes logo, company address/GSTIN/PAN, customer/supplier details, items, tax summary, grand total, terms, signature, bank details

## Phase 6 — Sharing (Parts 3, 5, 6)
- [ ] `frontend/src/lib/share-api.ts`: email RPC + PDF upload to storage + public URL
- [ ] Edge function `supabase/functions/doc-share/index.ts` (SMTP via env vars, no hardcoded creds)
- [ ] `document-share-dialog.tsx`, `email-share-dialog.tsx`, `whatsapp-share-dialog.tsx`, `document-preview-dialog.tsx`, `document-actions.tsx`

## Phase 7 — Ledger Sharing (Part 7)
- [ ] Customer Ledger page (opening, transactions, running, closing)
- [ ] Supplier Ledger page (same)
- [ ] Email/WhatsApp share on both

## Phase 8 — Part 3/8: Wire actions into pages
- [ ] Quotations, Sales Orders, Sales Invoices, Purchase Orders: Preview/Print/PDF/Share/Email/WhatsApp icons beside Edit/Delete (Lucide, theme-consistent, permission-gated)

## Phase 9 — Security (Part 9)
- [ ] Gate all new UI/actions with sales.view/sales.manage/purchase.view/purchase.manage/finance.view/finance.manage

## Phase 10 — Build (Part 10)
- [ ] `npm run build` → fix all TS errors → BUILD EXIT CODE = 0

