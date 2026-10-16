> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: planning draft; not implemented

# Requirements and traceability

## 1. Product vision, scope and release strategy

**Vision:** A responsive fabrication e-commerce/quotation website plus a unified workshop ERP/CRM for iron/steel gates, grills/jali, shutters, doors, windows, railings, sheds and custom fabrication. Staff can run lead-to-cash and purchase-to-production workflows without spreadsheets. Customers can browse designs, estimate approximate material/price, request a site measurement, receive quotations and follow orders.

**Operating model:** One workshop/business initially, but design IDs, ownership boundaries and permissions so multi-branch/partner expansion is possible without rewriting core logic. Do NOT prematurely implement a multi-tenant SaaS platform.

**Core release scope:** customer website; catalog/categories/gallery/content/reviews; enquiries/leads/customers/follow-ups; materials/rates/BOM calculator; quotations; orders; suppliers/purchases; inventory; workers/labour; production/delivery/installation; expenses/owner withdrawals/receivables/payables/P&L; dashboards/reports; roles/audit/settings/notifications.

**Release slices (distinct from engineering phases):**
- **R0 Foundation:** deployable Next.js skeleton, Supabase Auth/RLS, Cloudinary and docs.
- **R1 Public + sales MVP:** catalog, content, enquiry, lead pipeline, calculator, quotations, admin.
- **R2 Workshop operations:** orders, procurement, inventory, labour, production, delivery.
- **R3 Finance and hardening:** reconciled finance, P&L, advanced reports, audit, production readiness.
- **R4 Optional extensions:** mobile clients, online checkout/payments, AI preview, partner network.

**Out of scope until separately approved:** native Android/iOS UI, AI-generated structural decisions, automated WhatsApp Business messaging, real payment capture, partner payouts, multi-tenant billing. Keep interfaces and documents ready for these.

**Success criteria:** a new lead can become a verified quotation, accepted order, production job and completed installation; purchase and stock movements reconcile; worker earnings and payments reconcile; financial statements separate operating cost from owner withdrawals; unauthorized users cannot access data; APIs are usable without browser cookies; documentation is current.



## Personas and workflows

## 3. Users, roles, permissions and security

| Role | Intended access |
|---|---|
| Anonymous visitor | public products, gallery, approved reviews, estimate, enquiry |
| Customer | own profile, enquiries, quotes, orders, attachments and tracking |
| Super Admin / Owner | full configuration, permissions, audit, finance |
| Sales Staff | leads, customers, follow-ups, quotations, limited order details |
| Production Staff | work orders, production status, allocated materials, installation tasks |
| Accounts Staff | suppliers, purchases, labour payments, expenses, receivables, payables, reports |
| Content Staff | products, categories, gallery, website sections, review moderation |
| Future Partner | explicitly assigned leads/jobs only; no cross-partner visibility |

**RBAC:** permission strings e.g. `products.read`, `products.write`, `quotations.approve`, `inventory.adjust`, `finance.read`, `finance.withdrawal.create`, `users.manage`. Define role-permission matrix in `docs/security/permissions.md`, enforce at each endpoint AND relevant database policies. Use least privilege, deny by default, audit sensitive actions, guard role escalation. A user may hold multiple roles.

**Auth:** Supabase Auth with email/password initially; phone OTP only after cost/abuse review. Web SSR cookie session; mobile bearer token. Validate JWT on server via trusted Supabase mechanisms, handle refresh/expiry, password reset, account disabling, sign-out and session revocation. Avoid requiring CSRF-unsafe cookie-only mutation endpoints; explicitly protect cookie-authenticated state-changing requests using origin/CSRF strategy, and do not rely solely on CORS.

**Data protection:** protect phone, address, uploaded customer designs, invoices and worker pay; collect only required data; retention/deletion policy; role-filtered exports; mask PII in logs; private signed delivery for sensitive Cloudinary assets; rate-limit enquiry/login/upload endpoints; input/output escaping; SQL injection protection via parameterized access; secure headers, content security policy where practical; admin MFA as launch hardening item.



## 4. End-to-end business workflows

### 4.1 Customer enquiry to completed order
Visitor → category → product details → dimensions/material selection → approximate calculation → exact quote/measurement enquiry → lead created with source → sales contact/follow-up → measurement record → versioned quotation → approval/acceptance → order creation → advance receipt (manual initially) → work order → material reservation/consumption → fabrication → finishing → ready → delivery → installation → completion → review.

**Lead states:** NEW → CONTACTED → REQUIREMENT_CONFIRMED → MEASUREMENT_PENDING → MEASUREMENT_DONE → QUOTATION_SENT → NEGOTIATION → ORDER_CONFIRMED → PRODUCTION → COMPLETED, with LOST and valid recovery transitions. Define transition matrix, owner, timestamps and allowed roles.

**Order states:** CONFIRMED → ADVANCE_RECEIVED → MEASUREMENT_CONFIRMED → PRODUCTION_PENDING → PRODUCTION_STARTED → FABRICATION_COMPLETED → FINISHING → READY → OUT_FOR_DELIVERY → INSTALLATION → COMPLETED; CANCELLED with cancellation rules. Store immutable history and prevent invalid transitions.

### 4.2 Purchase-to-stock-to-production
Supplier → purchase order/bill → purchase items and payments → goods receipt/stock IN → stock reservation for work order → actual consumption stock OUT → adjustments/returns → low-stock alert → inventory reconciliation. All stock changes represented as immutable signed movements; never update only a balance without movement record.

### 4.3 Worker-to-payment
Worker master + rate version → approved work entry with measured kg/unit/hour → calculated earnings snapshot → partial/full payment → outstanding ledger; prevent double payment and unauthorized retroactive rate edits.

### 4.4 Sales-to-finance
Approved quotation/order → invoice or sales record as applicable → customer advance/receipts → receivable balance; purchase and supplier payments → payable balance; expenses, labour and consumed material costs → financial reporting; owner withdrawals tracked separately. Distinguish cash flow from revenue recognition and inventory expense recognition. Accounting policy must be approved before asserting exact profit.

### 4.5 Notification and document flow
Lead created / follow-up due / quotation approved / order status changed → internal notification event; direct WhatsApp click-to-chat in MVP; PDF quotation generated from immutable version snapshot and accessible only to authorized users. Automated external delivery later after approved provider setup.



## Normalized source stories

Each source section has a stable ID. These are baseline stories; detailed field-level cases remain deliverables of the owning phase. No story is implemented yet.

### SF-REQ-0001 — Dashboard

As visitor or permitted content staff, I need dashboard / reports so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 1; detailed behavior remains defined by relevant master-plan sections.
- Phase: 18. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0002 — Products

As visitor or permitted content staff, I need products so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 2; detailed behavior remains defined by relevant master-plan sections.
- Phase: 07. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0003 — Categories

As visitor or permitted content staff, I need categories & subcategories so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 3; detailed behavior remains defined by relevant master-plan sections.
- Phase: 07. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0004 — Leads

As permitted workshop user, I need leads so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 4; detailed behavior remains defined by relevant master-plan sections.
- Phase: 10. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0005 — Customers

As permitted workshop user, I need customers so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 5; detailed behavior remains defined by relevant master-plan sections.
- Phase: 10. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0006 — Material Library

As permitted workshop user, I need material library so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 6; detailed behavior remains defined by relevant master-plan sections.
- Phase: 08. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0007 — Material Rates

As permitted workshop user, I need material rates so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 7; detailed behavior remains defined by relevant master-plan sections.
- Phase: 08. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0008 — Product-Material Mapping

As permitted workshop user, I need product–material mapping so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 8; detailed behavior remains defined by relevant master-plan sections.
- Phase: 08. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0009 — Calculation Engine

As permitted workshop user, I need calculation engine so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 9; detailed behavior remains defined by relevant master-plan sections.
- Phase: 09. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0010 — Suppliers

As permitted workshop user, I need suppliers/vendors so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 10; detailed behavior remains defined by relevant master-plan sections.
- Phase: 13. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0011 — Purchase

As permitted workshop user, I need purchases/procurement so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 11; detailed behavior remains defined by relevant master-plan sections.
- Phase: 13. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0012 — Stock

As permitted workshop user, I need stock/inventory so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 12; detailed behavior remains defined by relevant master-plan sections.
- Phase: 14. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0013 — Labour

As permitted workshop user, I need labour management so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 13; detailed behavior remains defined by relevant master-plan sections.
- Phase: 15. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0014 — Expenses

As permitted accounts staff or owner, I need business expenses so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 14; detailed behavior remains defined by relevant master-plan sections.
- Phase: 17. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0015 — Owner Withdrawals

As permitted accounts staff or owner, I need owner withdrawals so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 15; detailed behavior remains defined by relevant master-plan sections.
- Phase: 17. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0016 — Accounts

As permitted accounts staff or owner, I need accounts/finance so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 16; detailed behavior remains defined by relevant master-plan sections.
- Phase: 17. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0017 — Profit & Loss

As permitted accounts staff or owner, I need profit & loss so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 17; detailed behavior remains defined by relevant master-plan sections.
- Phase: 17. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0018 — Quotations

As permitted workshop user, I need quotations so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 18; detailed behavior remains defined by relevant master-plan sections.
- Phase: 11. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0019 — Orders

As permitted workshop user, I need orders so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 19; detailed behavior remains defined by relevant master-plan sections.
- Phase: 12. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0020 — Follow-up

As permitted workshop user, I need follow-ups so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 20; detailed behavior remains defined by relevant master-plan sections.
- Phase: 10. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0021 — Gallery

As visitor or permitted content staff, I need gallery so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 21; detailed behavior remains defined by relevant master-plan sections.
- Phase: 06. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0022 — Website Content

As visitor or permitted content staff, I need website content so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 22; detailed behavior remains defined by relevant master-plan sections.
- Phase: 06. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0023 — Reviews

As visitor or permitted content staff, I need reviews so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 23; detailed behavior remains defined by relevant master-plan sections.
- Phase: 06. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0024 — Reports

As permitted workshop user, I need reports so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 24; detailed behavior remains defined by relevant master-plan sections.
- Phase: 18. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0025 — WhatsApp & Notifications

As permitted workshop user, I need whatsapp & notifications so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 25; detailed behavior remains defined by relevant master-plan sections.
- Phase: 10/18. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0026 — Admin Users & Permissions

As permitted workshop user, I need admin users & permissions so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 26; detailed behavior remains defined by relevant master-plan sections.
- Phase: 04/18. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0027 — Activity Log

As permitted workshop user, I need activity log so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 27; detailed behavior remains defined by relevant master-plan sections.
- Phase: 18. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0028 — Settings

As permitted workshop user, I need settings so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 28; detailed behavior remains defined by relevant master-plan sections.
- Phase: 18. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0029 — End-to-end Flow

As permitted workshop user, I need workflow 4.1 so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 29; detailed behavior remains defined by relevant master-plan sections.
- Phase: 10–16. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0030 — Future AI

As permitted workshop user, I need future ai so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 30; detailed behavior remains defined by relevant master-plan sections.
- Phase: Future. Priority: future, separately approved.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0031 — Multi-city Partner

As permitted workshop user, I need future partner network so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 31; detailed behavior remains defined by relevant master-plan sections.
- Phase: Future. Priority: future, separately approved.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0032 — Sidebar

As permitted workshop user, I need admin navigation / module list so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 32; detailed behavior remains defined by relevant master-plan sections.
- Phase: 03–18. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0033 — Phase 1 current requirements

As permitted workshop user, I need core release scope so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 33; detailed behavior remains defined by relevant master-plan sections.
- Phase: 01–19. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

### SF-REQ-0034 — Development principle

As permitted workshop user, I need configurable admin / docs so the workshop can complete the applicable master-plan workflow.

- Source: master plan section 20, row 34; detailed behavior remains defined by relevant master-plan sections.
- Phase: All. Priority: mandatory core scope / cross-cutting.
- Acceptance: preserve all relevant fields and business rules from the master plan; verify permitted behavior and forbidden access; reconcile applicable history/totals; maintain module, API/mobile and schema documentation.
- Migration/API/mobile impact: assessed in the owning phase before implementation.
- Evidence: not implemented; no passing feature tests claimed.

## Original mapping

## 20. Requirement traceability matrix

Every numbered source requirement has a home in this plan. The original document's “Phase 1” is treated as **overall mandatory core scope**, not one single coding sprint.

| Source section | Covered in | Implementation phase |
|---|---|---|


| 1 Dashboard | Dashboard / reports | 18 |


| 2 Products | Products | 07 |


| 3 Categories | Categories & Subcategories | 07 |


| 4 Leads | Leads | 10 |


| 5 Customers | Customers | 10 |


| 6 Material Library | Material Library | 08 |


| 7 Material Rates | Material Rates | 08 |


| 8 Product-Material Mapping | Product–Material Mapping | 08 |


| 9 Calculation Engine | Calculation Engine | 09 |


| 10 Suppliers | Suppliers/Vendors | 13 |


| 11 Purchase | Purchases/Procurement | 13 |


| 12 Stock | Stock/Inventory | 14 |


| 13 Labour | Labour Management | 15 |


| 14 Expenses | Business Expenses | 17 |


| 15 Owner Withdrawals | Owner Withdrawals | 17 |


| 16 Accounts | Accounts/Finance | 17 |


| 17 Profit & Loss | Profit & Loss | 17 |


| 18 Quotations | Quotations | 11 |


| 19 Orders | Orders | 12 |


| 20 Follow-up | Follow-ups | 10 |


| 21 Gallery | Gallery | 06 |


| 22 Website Content | Website Content | 06 |


| 23 Reviews | Reviews | 06 |


| 24 Reports | Reports | 18 |


| 25 WhatsApp & Notifications | WhatsApp & Notifications | 10/18 |


| 26 Admin Users & Permissions | Admin Users & Permissions | 04/18 |


| 27 Activity Log | Activity Log | 18 |


| 28 Settings | Settings | 18 |


| 29 End-to-end Flow | Workflow 4.1 | 10–16 |


| 30 Future AI | Future AI | Future |


| 31 Multi-city Partner | Future Partner Network | Future |


| 32 Sidebar | Admin navigation / module list | 03–18 |


| 33 Phase 1 current requirements | Core release scope | 01–19 |


| 34 Development principle | Configurable admin / docs | All |


### Change control
New requirements must be assigned a requirement ID (`SF-REQ-####`), module, priority, API/mobile impact, migration impact, acceptance test and phase. Changes to this master plan require an ADR or documented decision; update traceability and `docs/progress.md`. Do not delete requirements silently.

---

**End of Master Plan v1.0.** This is a comprehensive implementation blueprint, not proof that features have been built. The detailed per-module schemas, screens, formulas and OpenAPI schemas are deliverables of the approved planning/implementation phases and must be maintained continuously.
