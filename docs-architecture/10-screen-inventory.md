# Screen Inventory

Grouped by module. `[shared]` marks routes reused verbatim from the shared shell. Portal-visible pages noted with which portal(s) reuse them.

## Foundation
- Login, Signup, Forgot Password, Reset Password `[shared]`
- Company Onboarding Wizard (new)
- Company Profile / Settings, User Management, Role & Permission Management `[shared, extended]`
- Unauthorized page `[shared]`

## Dashboard
- CEO Dashboard, Workshop Dashboard, Rental Dashboard, Finance Dashboard, Inventory Dashboard, HR Dashboard, Engineer Dashboard (7 role-variant pages, shared KPI-card/chart components)

## CRM
- Leads List, Lead Detail
- Customers List, Customer 360 Detail
- Site Survey Form / List
- Quotation List, Quotation Builder, Quotation PDF Preview
- Follow-up Tracker
- AMC Contracts List, AMC Contract Detail
- Opportunity Pipeline (kanban board)

## Rental Management
- Rental Asset Master List, Asset Detail (with QR code, maintenance/calibration/insurance tabs)
- Rental Calendar / Availability Calendar
- Rental Inquiry List, Inquiry Detail
- Rental Quotation Builder
- Booking List, Booking Detail
- Rental Agreement Detail (terms: security deposit, late-return/operator/fuel/transport charge rates)
- Dispatch Form (linked to Logistics trip)
- Return & Inspection Form
- Damage Assessment Form
- Rental Invoice (extension of Sales invoice UI, `invoice_type='rental'`)
- Machine Utilization Report, Machine Profitability/ROI Report, Idle Machine Report

## Transformer Repair Workshop
- Customer Complaint Intake Form
- Pickup Request Form (linked to Logistics trip)
- Inspection Form
- Estimate Builder, Estimate Approval (customer-facing, portal-visible)
- Job Card Detail (stage timeline: dismantling → core inspection → coil inspection → rewinding → core assembly → tank repair → painting → oil filling → testing → QC → dispatch → installation) — one shared detail page with a stage-stepper component, not 12 separate pages
- Warranty Register
- Repair TAT Report, Engineer Productivity Report

## Transformer Manufacturing
- BOM Builder, BOM List
- Production Order List, Production Order Detail (stage timeline: winding → assembly → testing → painting → packing → dispatch)
- Raw Material Planning View
- Production Reports

## Inventory
- Product Master List, Product Detail
- Categories/Brands/Units admin lists
- Stock Levels by Warehouse, Stock Movement Ledger
- Serial Number Tracker
- Batch Tracker
- Scrap Register
- Barcode/QR label print view
- Reorder Level / Minimum Stock Alerts view

## Purchase
- Purchase Requisition List/Form, Approval view
- Purchase Order List/Form
- GRN Form (with QC checklist)
- Vendor Bill List/Form
- Vendor Payment Form
- Vendor Performance Report

## Sales
- Quotation Builder `[shared with CRM]`
- Sales Order List/Detail
- Invoice List/Detail/Print (handles standard/AMC/rental/repair sub-types via one templated view)
- Dispatch & Delivery Challan Form
- Payment Follow-up Tracker

## Testing Laboratory
- Test Type Master (admin)
- Test Report Entry Form (per test type, dynamic parameter fields from `test_types.parameters`)
- Test Report List, Test Report Detail
- Certificate Preview/Download (PDF)

## Preventive Maintenance
- Maintenance Schedule List (per asset/unit)
- Maintenance Visit Form (checklist-driven) — **portal: Technician**
- Service History View

## Logistics
- Vehicle Master, Driver Master
- Trip List, Trip Detail (pickup/delivery, cost breakdown, photo upload, customer signature capture) — **portal: Engineer/Technician**

## Finance
- Chart of Accounts
- Journal Entry List/Form
- Cash & Bank Register
- Expense Entry
- GST/TDS Reports
- Outstanding (Customer/Vendor) Reports
- Profitability Reports (Machine-wise, Customer-wise, Workshop-wise)

## HR
- Employee Master
- Attendance Register (punch view) — **portal: Technician**
- Leave Request/Approval
- Salary Slip List/Detail
- Skill Matrix Grid
- Daily Allocation Board
- Overtime Log

## Document Management
- Document Vault (filterable by reference type/category, upload/preview)

## Reports (module-agnostic report shell, per-report content)
- Report Catalog / Launcher page listing all reports below with filters:
  Machine Utilization, Workshop Productivity, Engineer Productivity, Inventory Aging, Profitability, Customer Outstanding, Vendor Outstanding, Repair TAT, Rental Revenue, Machine ROI, AMC Revenue

## AI Assistant
- AI Chat Panel (global, slide-over — reused shell)
- AI Quotation Generator (invoked from Quotation Builder)
- AI Fault Diagnosis (invoked from Job Card Detail)
- AI Spare Recommendation (invoked from Job Card Detail / Estimate Builder)
- AI Business Insights Dashboard widget
- Natural Language Search bar (global, in command palette)

## Licensing / Super-Admin (vendor-side, reused verbatim)
- Plans List/Detail, Modules List, Industry Packs List, Customers (tenant) List/Detail, License Status page (end-user-facing)

## Portals (thin layouts reusing the pages above with reduced nav)
- **Engineer/Technician Portal**: Job Card Detail, Maintenance Visit Form, Trip Detail, Attendance punch, Daily Allocation (their own)
- **Customer Portal**: Quotation view (read-only), Invoice view, AMC status, Rental Agreement view, Test Certificate download
- **Vendor Portal**: Purchase Order view, Bill submission form, Payment status
