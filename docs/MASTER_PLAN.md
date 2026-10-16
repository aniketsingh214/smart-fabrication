# SmartFabrication — Master Product, Architecture, API & Phased Delivery Plan

**Document version:** 1.0  
**Prepared:** 2026-10-14  
**Status:** Planning baseline — implementation not started  
**Primary language:** English technical specifications with simple Hinglish explanations  
**Source:** User-provided “IRON / STEEL WORKSHOP — COMPLETE ADMIN PANEL” requirements (34 sections), expanded for production readiness, mobile-first API reuse, documentation and delivery governance.

> **Non-negotiable stack:** Next.js App Router + TypeScript for frontend AND backend in ONE codebase; Vercel hosting; Supabase PostgreSQL + Supabase Auth; Cloudinary media. No separate Express/NestJS/ASP.NET server, no second primary database, no alternate image-storage backend. Auxiliary TypeScript libraries, CI tools and future third-party communication/payment providers are integrations, not replacements for the fixed stack.

> **Delivery rule:** Plan → approve → implement one phase → validate → update docs → review → commit → next phase. A phase is NOT complete because files exist: acceptance tests and documentation must pass.

## Table of contents

1. Product vision, scope and release strategy
2. Stack, architecture and system boundaries
3. Users, roles, permissions and security
4. End-to-end business workflows
5. Complete module specifications
6. Database design and data integrity
7. API-first architecture for web and future mobile
8. API endpoint inventory and conventions
9. Next.js repository structure
10. Cloudinary media architecture
11. Vercel and Supabase environments
12. Testing, quality, performance and operations
13. Documentation-as-code policy
14. Detailed implementation phases and gates
15. Mobile app readiness and future app plan
16. Future AI, payments and partner network
17. Risks, decisions and open questions
18. Codex working agreement and prompts
19. Final acceptance and launch checklists
20. Requirement traceability matrix


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


## 2. Stack, architecture and system boundaries

| Concern | Fixed choice | Implementation guidance |
|---|---|---|
| Full-stack app | Next.js App Router + TypeScript | React Server Components for read-heavy pages, client components for interactive UI; Route Handlers for stable REST API; Server Actions for web-only UX where useful |
| Styling | Tailwind CSS + shadcn/ui | accessible reusable components; responsive mobile-first layouts |
| Data | Supabase PostgreSQL | SQL migrations, constraints, views/RPC for atomic operations; no direct privileged DB access from browser |
| Authentication | Supabase Auth | SSR sessions for web, JWT bearer access tokens for mobile; server validation and authorization |
| Authorization | Supabase RLS + server-side RBAC | enforce both, never trust hidden UI buttons; service-role key server-only and exceptional |
| Media | Cloudinary | signed server-authorized uploads, metadata in PostgreSQL, secure private asset handling |
| Hosting | Vercel | deploy Next.js frontend and serverless APIs together; preview/prod environments |
| Validation | Zod | shared DTO schema with server authority; avoid leaking internals |
| Tests | Vitest + Playwright + integration tests | contract, RLS, webhook, calculation, finance and E2E tests |
| Observability | structured server logs + Vercel logs | correlation/request IDs, error reporting integration only if approved |
| Repository | GitHub | protected main, PRs, review and CI |

**Request flow:** Browser / future mobile → `https://<domain>/api/v1/*` → auth/permission check → Zod DTO validation → domain service → Supabase SQL/RPC with RLS and transactional integrity → response envelope. UI pages may call shared server services directly for efficient SSR, but business logic MUST remain reusable through versioned API endpoints. Do not duplicate rules in UI.

**Architecture layers:** `app` routes and pages → `features/*/api` handlers/controllers → `features/*/services` business rules → `features/*/repositories` typed Supabase access → Supabase database. Cross-cutting auth, permissions, media, logging, validation, errors, idempotency and audit under `lib/` or `server/`.

**Serverless limits:** no always-on workers or in-memory durable queues; avoid long-running uploads/PDF tasks in requests. Prefer short transactional operations; scheduled jobs may use Vercel Cron with protected endpoint and idempotency, subject to plan limitations. External notification integrations need separate approval.

**Configuration:** `.env.example` with names only; `.env.local` never committed; separate dev/staging/prod credentials; use Vercel env vars; Supabase service role and Cloudinary API secret never `NEXT_PUBLIC_*`.


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


## 5. Complete module specifications

**Definition for EVERY module:** screens/routes; fields and validation; permission matrix; state transitions; database tables/constraints; API contracts; service logic; UI states; error codes; audit events; tests; docs; acceptance criteria. Below is the required baseline. Each phase expands its module into `docs/modules/<slug>.md` before implementation.


### 5.1 Dashboard
- **Functional scope:** KPI cards: total/new leads, follow-ups, quotations, orders, work orders, completed, revenue, purchases, expenses, labour, business profit, owner withdrawals; charts by date/source/product; recent leads and quick actions.
- **Rules / acceptance:** KPI definition dictionary, date filters, permission-scoped totals, drilldowns, loading/empty/error states.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.2 Products
- **Functional scope:** SKU, name, slug, category/subcategory, description, images/video, size, material, finish, colour, weight, price range, custom-size/design, installation/delivery options; draft/preview/publish, duplicate, soft delete.
- **Rules / acceptance:** Uniqueness and SEO validation, Cloudinary assets, publication workflow, public API filtering.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.3 Categories & Subcategories
- **Functional scope:** Main Gates, Steel Gates, Iron Gates, Grills/Jali, Shutters, Doors, Windows, Railings, Sheds, Custom Fabrication; image, sort order, active flag.
- **Rules / acceptance:** Prevent cyclic hierarchy, unique slugs, product impact on archive.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.4 Leads
- **Functional scope:** Name, mobile/WhatsApp, email, city/area/address, product, dimensions, material, requirement, uploaded design, source Google/Instagram/Facebook/WhatsApp/direct/referral/other; status, notes, assigned staff, call/WhatsApp, conversion.
- **Rules / acceptance:** Anti-spam, duplicate matching rules, source attribution, follow-up reminders, activity history.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.5 Customers
- **Functional scope:** Contact info, multiple addresses, enquiry/quotation/order histories, totals, notes, attachments.
- **Rules / acceptance:** Guest leads may exist without auth account; later link identity safely.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.6 Material Library
- **Functional scope:** Square/rectangular/round pipe, angle, flat, sheet, channel, bars, hinges, locks, wheels, hardware, paint, primer, coating; type, size, thickness, length, weight, unit, status.
- **Rules / acceptance:** Canonical unit conversion, unique material variant code, archived items retained for history.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.7 Material Rates
- **Functional scope:** Purchase and selling rates, currency, unit, effective dates, previous/new rate, actor, version history.
- **Rules / acceptance:** Immutable historical rate snapshots; no silent retroactive repricing.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.8 Product–Material Mapping
- **Functional scope:** Per-product BOM/configuration of materials and quantities, formula inputs, customer-visible flags.
- **Rules / acceptance:** Version BOM, validate units and dependencies, preview changes before publish.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.9 Calculation Engine
- **Functional scope:** Width/height, optional depth, thickness, design, wastage, hardware, labour, finish, delivery, installation, margin; output material quantity, weight, estimated range.
- **Rules / acceptance:** All values approximate, server authoritative, versioned formulas, boundary/unit tests, final quote only after measurement.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.10 Suppliers/Vendors
- **Functional scope:** Shop/name/mobile/address/GST if applicable, supplied materials, opening balance, purchases, payments, outstanding.
- **Rules / acceptance:** Duplicate supplier check, financial history, restricted contact access.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.11 Purchases/Procurement
- **Functional scope:** Supplier, bill number/date, line items, size/unit/quantity/rate/discount/tax, total, payment status, receipt, attachments.
- **Rules / acceptance:** Unique supplier invoice reference policy, atomic posting, returns/corrections and approval.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.12 Stock/Inventory
- **Functional scope:** IN/OUT/adjustment, on-hand, reserved, available, reorder threshold, low stock, work-order consumption.
- **Rules / acceptance:** Signed movement ledger, nonnegative constraints or approved override, reconciliation and concurrency tests.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.13 Labour Management
- **Functional scope:** Worker details, work type, per-kg/per-unit/hour rate, work entries by job, earnings, paid/outstanding, rate history.
- **Rules / acceptance:** Approved entries, rate snapshots, partial payments, role restrictions.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.14 Business Expenses
- **Functional scope:** Electricity, rent, transport, repair, electrodes, gas, paint, tools, maintenance, phone/internet, packing, other; amount/date/category/mode/attachment.
- **Rules / acceptance:** Expense approval, cost-center/order attribution, prevent duplicate bills.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.15 Owner Withdrawals
- **Functional scope:** Date, amount, reason, mode, note, owner; separate from operating expenses.
- **Rules / acceptance:** Show in cash/equity view, never subtract again in operating profit.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.16 Accounts/Finance
- **Functional scope:** Sales, customer receipts, purchases, supplier payments, labour payments, operating expenses, receivables, payables, cash/bank future.
- **Rules / acceptance:** Document accounting assumptions, immutable entries, corrections via reversals, reconcile totals.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.17 Profit & Loss
- **Functional scope:** Revenue, consumed material cost, labour, overhead, gross/net operating profit, separate withdrawals, period/product/job filters.
- **Rules / acceptance:** Avoid purchase-vs-consumption double counting; account for stock and accrual/cash differences.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.18 Quotations
- **Functional scope:** Lead conversion, versioned line items for material/labour/finish/hardware/transport/installation/other/discount/tax, PDF, send link, accepted/rejected/expired.
- **Rules / acceptance:** Quote snapshot, expiry, revision, authorized approval, idempotent convert-to-order.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.19 Orders
- **Functional scope:** Customer, product, final dimensions/material, final price, advance/balance, delivery estimate, notes, status history.
- **Rules / acceptance:** Approved quote linkage, amount reconciliation, cancellation/refund policy.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.20 Follow-ups
- **Functional scope:** Assigned staff, due date/time, reminder, call/WhatsApp, note, reschedule, completed/overdue.
- **Rules / acceptance:** Timezone handling, permission and notification deduplication.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.21 Gallery
- **Functional scope:** Product/workshop/installation/completed project photos/videos, categories, reorder, featured, alt text.
- **Rules / acceptance:** Cloudinary cleanup policy, consent for customer site photos.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.22 Website Content
- **Functional scope:** Banners, hero heading, buttons, featured items, offers, About, Contact, address/map, hours, social links.
- **Rules / acceptance:** Draft/publish, cache revalidation, SEO and content sanitization.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.23 Reviews
- **Functional scope:** Customer name/rating/text/photo/date, approval, publish/hide.
- **Rules / acceptance:** Moderation, spam prevention, verified order optional.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.24 Reports
- **Functional scope:** Lead/source/product, sales, purchases, supplier outstanding, labour, expenses, stock, P&L; filters and CSV/PDF exports.
- **Rules / acceptance:** Permission-aware exports, metric definitions, large report pagination.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.25 WhatsApp & Notifications
- **Functional scope:** Direct call/WhatsApp links; internal events for lead, follow-up, quotation, order; optional future automation.
- **Rules / acceptance:** No unsupported promise of WhatsApp message delivery; notification delivery audit.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.26 Admin Users & Permissions
- **Functional scope:** Super Admin, Sales, Production, Accounts, Content; per-module read/write/delete/approve/export.
- **Rules / acceptance:** Role matrix, revocation tests, audit privilege changes.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.27 Activity Log
- **Functional scope:** Actor, timestamp, action, entity, old/new safe fields, request ID.
- **Rules / acceptance:** Append-only, redact secrets/PII, retention policy.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.28 Settings
- **Functional scope:** Workshop details, logo, contact, address, hours, GST if applicable, delivery areas, installation, taxes, enquiry, WhatsApp, security.
- **Rules / acceptance:** Version and audit configuration; protect sensitive values.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.29 Production & Work Orders
- **Functional scope:** Order-linked job card, material reservations, tasks, stages, workers, planned/actual weight, quality check, scrap/wastage.
- **Rules / acceptance:** Inventory consumption and cost traceability; no completion without required checks.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.30 Delivery & Installation
- **Functional scope:** Schedule, assigned crew, address, transport, proof of delivery, installation checklist, sign-off.
- **Rules / acceptance:** Consent and restricted media; delivery/installation status transitions.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


### 5.31 Customer Account & Future Checkout
- **Functional scope:** Optional login, own quotations/orders, saved designs, addresses, wishlist/cart for ready-made products later.
- **Rules / acceptance:** Do not force account to submit lead; prevent IDOR; mobile-ready endpoints.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.


## 6. Database design and data integrity

### 6.1 Proposed PostgreSQL tables (subject to ERD review)

| Domain | Tables |
|---|---|
| Identity | `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `customer_addresses` |
| Catalog | `categories`, `products`, `product_media`, `product_variants`, `product_options`, `gallery_items`, `reviews` |
| Materials & pricing | `materials`, `material_variants`, `material_rates`, `product_materials`, `bom_versions`, `calculation_rules`, `estimate_snapshots` |
| CRM | `leads`, `lead_attachments`, `lead_notes`, `lead_status_history`, `follow_ups`, `customers`, `measurements` |
| Quotations | `quotations`, `quotation_versions`, `quotation_items`, `quotation_events`, `quotation_documents` |
| Orders | `orders`, `order_items`, `order_status_history`, `customer_payments` |
| Suppliers & procurement | `suppliers`, `purchase_orders`, `purchases`, `purchase_items`, `goods_receipts`, `supplier_payments`, `purchase_returns` |
| Inventory | `stock_locations`, `stock_movements`, `stock_reservations`, `stock_adjustments`, `material_consumption` |
| Labour | `workers`, `labour_rates`, `work_entries`, `labour_payments` |
| Production | `work_orders`, `work_order_tasks`, `production_updates`, `quality_checks` |
| Logistics | `deliveries`, `installations`, `delivery_attachments` |
| Finance | `expense_categories`, `expenses`, `owner_withdrawals`, `financial_entries`, `receivable_allocations`, `payable_allocations` |
| Content & platform | `website_sections`, `site_settings`, `notifications`, `notification_events`, `audit_logs`, `media_assets`, `idempotency_keys` |
| Optional future | `carts`, `cart_items`, `wishlists`, `payment_attempts`, `payment_webhook_events`, `partners`, `partner_assignments`, `ai_design_jobs` |

**Standard columns:** UUID primary key, `created_at`, `updated_at`, optional `created_by`, `updated_by`, `deleted_at` for soft-deletable entities, status and ownership fields where appropriate. Use `timestamptz` UTC; present local timezone in UI. Monetary values as `numeric(18,2)` or justified precision and ISO currency; measurements/weights as decimal with explicit units. Use stable public IDs; never expose sequential private keys.

**Relationship highlights:** `auth.users` ↔ `profiles`; categories → products; products ↔ materials via versioned BOM; lead → measurement → quotation versions → order → work order → production/delivery; suppliers → purchases → stock movements; work orders → material consumption + worker entries; orders → customer payments; all sensitive mutations → audit logs.

**Data integrity:** unique SKU/slug and idempotency keys; check positive quantities/rates where appropriate; foreign keys; no cascade-delete of financial history; transactional RPC/SQL functions for stock posting, quotation conversion, receipt posting and ledger updates; lock or concurrency control for competing stock changes; audit changes. RLS on all exposed application tables with policies tested per role and ownership. Admin-only SQL operations require server-side authorization and minimum privileged use.

**Migration strategy:** numbered SQL migration files under `supabase/migrations`; local/test migrations → staging → production; backup and rollback/forward-fix plan; never edit applied migrations; seed only non-sensitive fixtures. Maintain `docs/database/erd.md`, `schema-dictionary.md`, `migrations-log.md`, `rls-matrix.md` and `finance-policy.md`.

**Accounting warning:** business profit is NOT simply cash received minus all purchases. Define whether P&L is accrual or cash basis, opening inventory, material consumed, WIP, completed job recognition, tax treatment, returns, advances and depreciation. An accountant should validate finance policy before financial reporting is treated as official.


## 7. API-first architecture for web and future mobile

**Permanent rule:** ALL customer/mobile-relevant capabilities must have stable documented HTTP APIs under `/api/v1`. A mobile app must never depend on HTML parsing, Next.js Server Actions, browser cookies, internal React types or direct privileged Supabase table access. Next.js remains the only application backend. Browser SSR can call server services directly, but any mobile-required business action must also be available through REST handlers calling the SAME service.

### 7.1 Contract conventions
- Base URL: `https://<production-domain>/api/v1`; development and staging use separate hosts.
- JSON over HTTPS; UTF-8; stable resource names plural (`/products`, `/quotations`).
- Authentication: `Authorization: Bearer <supabase_access_token>` for mobile; server validates token and roles. Web session support separately with CSRF/origin controls.
- Public endpoints anonymous; protected endpoints return 401 without valid identity and 403 without permission.
- IDs: UUID strings; dates ISO 8601 UTC; money decimal strings with currency (avoid binary floating-point); units explicit (`mm`, `m`, `kg`, `pcs`, `sq_m`).
- Pagination: `limit` + opaque cursor for large changing collections; bounded limits and deterministic ordering; filters documented; do not leak private counts.
- Success response example: `{ "data": { "id": "..." }, "meta": { "requestId": "..." } }`.
- Error response example: `{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid dimensions", "details": [] }, "meta": { "requestId": "..." } }`.
- Standard codes: 200/201/202/204, 400/401/403/404/409/422/429/500; never leak stack traces.
- Use `Idempotency-Key` on order creation, quote conversion, payments, stock posting and other retriable non-idempotent operations. Store key, actor, request hash and result; reject conflicting reuse.
- Support `If-Match`/version field for high-contention edits; 409 on stale state; state-transition APIs rather than arbitrary status writes.
- No silent breaking changes in `/api/v1`; deprecate with documented dates and introduce `/api/v2` for incompatible changes.
- API response DTOs must be stable and decoupled from DB table shape; mobile should not receive internal finance fields by accident.

### 7.2 OpenAPI and SDK readiness
- Maintain **`docs/api/openapi.yaml`** as authoritative machine-readable contract (OpenAPI 3.1 preferred).
- Every endpoint must define tags, description, auth, permissions, request/response schemas, examples, error codes, pagination and idempotency behavior.
- Generate/validate typed TypeScript API client for web and future React Native/Expo app; keep shared schemas in `src/contracts` (avoid bundling server secrets into client).
- Maintain `docs/api/mobile-integration.md`, `authentication.md`, `errors.md`, `pagination.md`, `versioning.md`, `changelog.md`, `postman-collection.json` (optional), and `examples/`.
- CI must validate OpenAPI, compare breaking changes, run API contract/integration tests and publish generated docs when approved.
- Test bearer auth independent of browser cookie session. Support token refresh/expiration and permission revocation; mobile caches only safe data.

### 7.3 API security and performance
- RLS + service authorization; object ownership checks to prevent IDOR; rate limits, abuse prevention, request size caps, media upload quotas; sensitive data redaction.
- Cache only public product/content GETs, invalidate on publish; private finance/lead data `no-store`.
- Consistent response envelopes and request IDs; document timeouts/retryable errors and mobile offline behavior.
- CORS restricted to approved origins where necessary; CORS is not authentication. Native mobile clients do not rely on browser CORS.


## 8. API endpoint inventory (planned; implement per phase)

`P` = public, `C` = authenticated customer/owner, `S` = permitted staff, `A` = super admin. Exact request/response DTOs and scope in OpenAPI.

| Domain | Example routes | Access |
|---|---|---|
| Public catalog | `GET /categories`, `GET /products`, `GET /products/{id}`, `GET /gallery`, `GET /reviews` | P |
| Content | `GET /site`, `GET /site/sections`, `GET /service-areas` | P |
| Estimates | `POST /estimates` (server-authoritative) | P/rate-limited |
| Leads | `POST /leads`, `GET /leads`, `GET /leads/{id}`, `PATCH /leads/{id}`, `POST /leads/{id}/notes`, `POST /leads/{id}/assign` | P create / S rest |
| Follow-ups | `GET /follow-ups`, `POST /follow-ups`, `PATCH /follow-ups/{id}`, `POST /follow-ups/{id}/complete` | S |
| Customers | `GET /me`, `PATCH /me`, `GET /me/quotations`, `GET /me/orders`; staff `GET /customers` | C / S |
| Auth | Supabase Auth client SDK for sign-in/out/refresh; `GET /me` for profile | C |
| Admin catalog | `POST/PATCH /admin/products`, `POST /admin/products/{id}/publish`, `POST/PATCH /admin/categories` | S |
| Materials | `GET/POST /materials`, `PATCH /materials/{id}`, `GET/POST /materials/{id}/rates`, `GET/PUT /products/{id}/bom` | S |
| Quotations | `POST /quotations`, `GET /quotations/{id}`, `POST /quotations/{id}/versions`, `POST /quotations/{id}/approve`, `POST /quotations/{id}/accept`, `GET /quotations/{id}/pdf` | C/S by scope |
| Orders | `GET /orders`, `GET /orders/{id}`, `POST /orders/from-quotation`, `POST /orders/{id}/transitions`, `GET /orders/{id}/timeline` | C/S by scope |
| Suppliers | `GET/POST /suppliers`, `PATCH /suppliers/{id}`, `GET /suppliers/{id}/statement` | S |
| Procurement | `GET/POST /purchases`, `POST /purchases/{id}/receive`, `POST /purchases/{id}/payments`, `POST /purchases/{id}/returns` | S |
| Inventory | `GET /inventory/balances`, `GET /inventory/movements`, `POST /inventory/adjustments`, `POST /inventory/reservations` | S |
| Workers/labour | `GET/POST /workers`, `POST /work-entries`, `POST /labour-payments`, `GET /workers/{id}/statement` | S |
| Production | `GET/POST /work-orders`, `POST /work-orders/{id}/transitions`, `POST /work-orders/{id}/consumption`, `POST /work-orders/{id}/quality-checks` | S |
| Delivery | `GET/POST /deliveries`, `POST /deliveries/{id}/confirm`, `GET/POST /installations` | S/C limited |
| Finance | `GET/POST /expenses`, `GET/POST /owner-withdrawals`, `GET /receivables`, `GET /payables`, `GET /reports/profit-loss` | S restricted |
| Reporting | `GET /reports/leads`, `/reports/sales`, `/reports/purchases`, `/reports/stock`, `/reports/labour` | S restricted |
| Uploads | `POST /uploads/sign`, `POST /uploads/confirm`, `DELETE /uploads/{id}` | P/C/S per use case |
| Settings/roles | `GET/PATCH /admin/settings`, `GET /admin/permissions`, `POST /admin/users/{id}/roles` | A/S scoped |
| Notifications | `GET /notifications`, `POST /notifications/{id}/read` | C/S |
| Audit | `GET /admin/audit-logs` | A |
| Health | `GET /health` (minimal sanitized status) | P |
| Future payments | `POST /payments/intent`, `POST /webhooks/payment-provider`, `GET /payments/{id}` | C/server |
| Future partners | `GET /partner/assignments`, `POST /partner/quotations` | partner-scoped |

**Important:** The above is an inventory, not a claim that endpoints exist. `GET /me` and authenticated ownership/permissions are part of the contract. Never use generic `PATCH status` to bypass workflow rules. Public lead and upload endpoints require spam controls. Avoid allowing anonymous upload without short-lived upload intent tied to an enquiry and quotas.


## 9. Next.js repository structure

```text
smartfabrication/
├── AGENTS.md
├── README.md
├── CHANGELOG.md
├── .env.example
├── .github/workflows/ci.yml
├── docs/
│   ├── MASTER_PLAN.md
│   ├── requirements.md
│   ├── architecture.md
│   ├── roadmap.md
│   ├── progress.md
│   ├── decisions/ADR-0001-stack.md
│   ├── modules/<module>.md
│   ├── api/openapi.yaml
│   ├── api/authentication.md
│   ├── api/mobile-integration.md
│   ├── api/versioning.md
│   ├── api/changelog.md
│   ├── database/erd.md
│   ├── database/schema-dictionary.md
│   ├── database/rls-matrix.md
│   ├── database/migrations-log.md
│   ├── database/finance-policy.md
│   ├── security/permissions.md
│   ├── testing/test-plan.md
│   ├── operations/deployment.md
│   ├── operations/backup-restore.md
│   ├── operations/incident-response.md
│   ├── operations/runbook.md
│   ├── mobile/roadmap.md
│   └── phases/phase-01.md ... phase-18.md
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/                 # store, gallery, calculator, contact
│   │   ├── (auth)/                   # login, reset
│   │   ├── account/                  # customer portal
│   │   ├── admin/                    # workshop ERP/CRM
│   │   └── api/v1/                   # mobile-ready REST Route Handlers
│   ├── components/ui/
│   ├── components/layout/
│   ├── features/
│   │   ├── catalog/
│   │   ├── leads/
│   │   ├── quotations/
│   │   ├── inventory/
│   │   ├── finance/
│   │   └── ...                       # feature UI/services/repositories/DTOs
│   ├── contracts/                    # public API DTOs and schemas
│   ├── lib/supabase/                 # browser, SSR server, admin server only
│   ├── lib/cloudinary/               # server-only signing and media helpers
│   ├── lib/auth/
│   ├── lib/errors/
│   ├── lib/audit/
│   └── types/
├── supabase/migrations/
├── supabase/seed.sql
├── tests/unit/
├── tests/integration/
├── tests/e2e/
└── scripts/
```

**Code placement:** Keep `app/api/v1` thin; all business logic in server-only feature services. Avoid direct database mutations from client components. Mark secret-bearing modules server-only. All docs must be relative-linkable from README.


## 10. Cloudinary media architecture

**Use cases:** product image/video, gallery, customer reference design, lead attachment, measurement photo, invoice/expense bill, delivery proof, workshop image, review photo, site branding.

**Flow:** authenticated or controlled anonymous upload intent → validate actor/permission/file type/size/count → server signs short-lived Cloudinary upload parameters → client uploads directly to Cloudinary → server verifies asset ownership/context and records `media_assets` metadata → attach asset ID to authorized entity. For sensitive files use private/authenticated delivery strategy, not a public URL. Never trust a client-submitted `public_id` without verifying provenance. Restrict transformations, folders, formats and quotas. Strip unnecessary EXIF when appropriate. Define deletion/retention and orphan cleanup.

**Metadata:** `public_id`, `asset_id`, `resource_type`, `format`, `bytes`, width/height, `owner_user_id`, `entity_type`, `entity_id`, visibility, created_at, deleted_at. Keep URLs derived, not authoritative. Use responsive Cloudinary delivery and Next.js image configuration.

**Docs:** `docs/media/upload-flow.md`, `media-policy.md`, `asset-retention.md` and threat-model cases (malware/spam/unauthorized asset linking).


## 11. Vercel and Supabase environments

| Environment | Vercel | Supabase | Cloudinary | Purpose |
|---|---|---|---|---|
| Local | `next dev` | local Supabase or isolated dev project | dev folder/preset | coding/testing |
| Preview/staging | preview deployment | isolated staging project | staging namespace | PR QA/UAT |
| Production | production deployment | production project | production namespace | real users |

**Setup checklist:** create GitHub repo; Next.js project with TS/Tailwind; Supabase project and migrations; Auth redirect URLs per environment; RLS; Cloudinary credentials and presets; Vercel Git integration; env vars; custom domain, DNS/HTTPS; error/log monitoring; migration deployment procedure; staging seed; rollback plan; backups and restoration test. Verify Vercel commercial plan eligibility and current quotas/prices before commercial launch; free plans are not guaranteed appropriate.

**Environment variable names:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` (server only), `CLOUDINARY_API_SECRET` (server only), `NEXT_PUBLIC_APP_URL`, `APP_ENV`. Only add provider-specific secrets when integration approved.

**Deployment pipeline:** PR → lint/typecheck/unit/contract tests → preview build → staging migration/QA → approve → production migration with backup → deploy → smoke tests → monitor. Do not run migrations automatically on arbitrary previews. Protect secrets and database service role from build/client bundles.


## 12. Testing, quality, performance and operations

**Required CI gates:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, OpenAPI validation, dependency audit review, migration checks; E2E on staging for critical flows. Configure scripts explicitly.

**Test pyramid:**
- Unit: Zod validators, pricing formulas, unit conversions, finance calculations, status transitions, permissions.
- DB integration: Supabase RLS role matrix, unique/FK constraints, atomic stock/finance posting, migration forward tests.
- API integration: status/error envelope, bearer auth, 401/403/404/409/422/429, pagination, idempotency, ownership and rate limits.
- E2E: public enquiry → staff lead → quote → order → work order → inventory → delivery; supplier purchase/payment; labour work/payment; finance report; role-specific admin views.
- Security: IDOR, privilege escalation, CSRF, malicious file upload, signed upload abuse, webhook replay, leaked secrets, sensitive logs.
- Non-functional: mobile responsiveness, keyboard access, SEO metadata/sitemap/robots, image optimization, caching, performance budgets, basic load tests, backup restore, failure/retry handling.

**Definition of Done (each feature):** spec approved; migrations and RLS; backend service; `/api/v1` contract if applicable; web UI; tests; docs; logs/audit; accessibility/error/empty/loading states; review; verified build; changelog/progress update.

**Operations:** monitor API latency/error rate, database usage, failed uploads, lead form abuse, inventory reconciliation failures, payment mismatches when enabled, failed scheduled jobs, auth failures. Maintain `runbook.md`, incident severity, owner, restore procedures and tested backup schedule. Define retention and legal/tax needs with business owner.


## 13. Documentation-as-code policy (MANDATORY)

**Rule:** Any work without updated documentation is unfinished. Docs live in the same Git repo and PR as code. No phase can close with stale docs. All files use version, owner, last updated and status headers where applicable.

| Change type | Docs to update |
|---|---|
| New requirement or changed scope | `docs/requirements.md`, `docs/roadmap.md`, relevant module doc, ADR if architecture changes |
| New UI/page | `docs/modules/<module>.md`, sitemap/user flow, screenshots or wireframes where helpful |
| New/changed API | `docs/api/openapi.yaml`, examples, `changelog.md`, `mobile-integration.md` if mobile-facing |
| DB schema or RLS | migration SQL, `erd.md`, `schema-dictionary.md`, `rls-matrix.md`, `migrations-log.md` |
| Business calculation | module spec, formulas/examples, unit test cases, versioning notes |
| New role/permission | `security/permissions.md`, RLS tests, audit policy |
| Media upload/change | `media/upload-flow.md`, quotas, privacy/retention docs |
| Finance change | `database/finance-policy.md`, reconciliation examples and tests |
| Deployment/config | `.env.example`, `operations/deployment.md`, runbook, rollback notes |
| Bug fix | issue/repro, root cause, regression test, `progress.md`, API changelog if behavior changed |
| Every phase completion | `docs/phases/phase-NN.md`, `progress.md`, release notes, test evidence |

**Phase doc template:** Objective; in-scope/out-of-scope; prerequisites; user stories; UI routes; database migrations; API endpoints; service rules; permission/RLS; tests; security/privacy; acceptance criteria; implementation checklist; exact commands/results; files changed; known issues; rollback; documentation links; reviewer approval; next phase dependencies.

**Progress format:** date, phase, status (`not_started/in_progress/blocked/in_review/done`), completed tasks, pending tasks, actual test commands/results, blockers, risks, next action. Do not mark passed unless actually run. Maintain `docs/decisions/ADR-XXXX.md` for meaningful architecture choices.

**Docs quality automation:** check internal links, OpenAPI validity, generated schema diff, missing module docs, changelog and migration documentation in PR checks. `AGENTS.md` must instruct Codex to update docs with every code change.


## 14. Detailed implementation phases and gates

**Execution principle:** Phases below are engineering phases, not calendar promises. Dependencies can require revisiting earlier docs; do not move forward while critical tests fail. Suggested initial priority is phases 01–12 for first useful public/sales release, 13–19 for full workshop ERP, and 20 for formal mobile handoff. API/mobile conventions begin in phase 02, not phase 20.


### Phase 01 — Discovery, Requirements & Traceability
- **Objective / tasks:** Original 34 sections → normalized requirements, personas, use cases, exclusions, priorities, traceability; confirm workflow ambiguities.
- **Deliverables:** requirements.md, MASTER_PLAN.md, requirement matrix, open questions.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-01.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** All original sections mapped; owner approves scope. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 02 — Architecture, UX, API & ERD
- **Objective / tasks:** Choose module boundaries, sitemap, design system, state diagrams, RBAC, REST contracts, ERD, threat model, finance assumptions.
- **Deliverables:** architecture.md, wireframes, OpenAPI skeleton, ERD, ADRs, security model.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-02.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Web/mobile contract review, no missing critical entity. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 03 — Repository, Next.js & Vercel Foundation
- **Objective / tasks:** Create Next.js TS, Tailwind/shadcn, lint/typecheck/test/build, env example, GitHub CI, Vercel preview.
- **Deliverables:** working skeleton, CI, preview URL, deployment docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-03.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Clean build and preview smoke test. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 04 — Supabase Foundation & Auth/RLS
- **Objective / tasks:** Supabase migrations, profiles, roles, permissions, SSR auth, mobile bearer verification, policies, seed and tests.
- **Deliverables:** migrations, auth endpoints/profile, RLS matrix, security docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-04.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Customer/admin/staff access tests and token expiry pass. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 05 — Cloudinary & Media Management
- **Objective / tasks:** Signed upload flow, validation, asset records, private media rules, image optimization and cleanup.
- **Deliverables:** upload API, media docs, abuse tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-05.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Unauthorized uploads rejected; asset ownership verified. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 06 — Customer Website, CMS & Gallery
- **Objective / tasks:** Public responsive pages, nav/footer, content sections, contact, service areas, gallery, reviews, SEO.
- **Deliverables:** public UI, content APIs, CMS docs, accessibility tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-06.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Admin edits published content; public pages SEO/mobile ready. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 07 — Catalog & Categories
- **Objective / tasks:** Category/subcategory CRUD, product draft/preview/publish, SKU, media, variants, filters/search, featured.
- **Deliverables:** catalog API, migrations, admin/public UI, module docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-07.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Admin publishes and visitor can filter products. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 08 — Materials, Rates & BOM
- **Objective / tasks:** Material variants, units, purchase/selling rates, effective history, product-material mapping, configurable rules.
- **Deliverables:** material APIs, BOM tables, module docs, history tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-08.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Rate changes preserve old quote/job snapshots. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 09 — Estimation & Measurement
- **Objective / tasks:** Dimension form, validation, formula engine, wastage, approximate quantity/weight/price, site measurement records.
- **Deliverables:** estimate API, formula docs, examples, calculator UI.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-09.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Boundary/unit tests pass; output labelled approximate. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 10 — CRM: Leads, Customers, Follow-ups
- **Objective / tasks:** Public lead capture, source, duplicate logic, customer profiles, assignment, statuses, notes, follow-up reminders.
- **Deliverables:** lead/customer APIs, admin UI, spam protections, workflow docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-10.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Enquiry creates lead; authorized sales staff follows up. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 11 — Quotation Lifecycle & PDF
- **Objective / tasks:** Quote versions, line items, discounts/tax, expiry, approval, customer view, PDF, acceptance/rejection.
- **Deliverables:** quote APIs, templates, docs, integration tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-11.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Quote version immutable and converted once only. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 12 — Orders & Customer Tracking
- **Objective / tasks:** Order conversion, advance/balance, status timeline, customer order page, notifications.
- **Deliverables:** order APIs, migrations, UI, status transition docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-12.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Order totals reconcile and unauthorized users blocked. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 13 — Suppliers & Procurement
- **Objective / tasks:** Supplier master, purchase orders/bills, line items, goods receipt, partial payments, returns.
- **Deliverables:** supplier/purchase APIs, docs, tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-13.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Supplier balances and received stock reconcile. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 14 — Inventory & Stock Control
- **Objective / tasks:** Stock movement ledger, reservations, consumption, adjustments, alerts, concurrent operations.
- **Deliverables:** inventory APIs, RPC, reconciliation tests/docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-14.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** No silent negative/double stock; audit and concurrency pass. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 15 — Labour, Work Orders & Production
- **Objective / tasks:** Workers/rates/work entries/payments, production jobs/stages, material usage, QC.
- **Deliverables:** labour/production APIs, UI, documents, tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-15.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Job costing and worker outstanding match ledger. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 16 — Delivery, Installation & Completion
- **Objective / tasks:** Delivery schedules, crew, evidence, installation checks, customer confirmation, completed job gallery.
- **Deliverables:** delivery APIs, mobile-ready field schemas, tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-16.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Completed order has required sign-offs. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 17 — Expenses, Withdrawals, Finance & P&L
- **Objective / tasks:** Expense categories, owner withdrawals, customer receipts, supplier payable, financial entries, profit calculations and reports.
- **Deliverables:** finance APIs, finance-policy.md, reconciliation examples/tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-17.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** No double counting; withdrawals excluded from operating expense. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 18 — Dashboards, Reports, Permissions & Audit
- **Objective / tasks:** KPIs, filtered exports, alerts, staff permissions UI, audit logs, admin settings.
- **Deliverables:** reports APIs, audit logs, role tests, docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-18.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Every KPI reconciles to source data; exports scoped. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 19 — End-to-End Hardening & Production Launch
- **Objective / tasks:** Accessibility, SEO, load/security tests, backup/restore, deployment, observability, incident drills, docs review.
- **Deliverables:** release checklist, runbook, production smoke evidence.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-19.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Launch gates all green and owner approval. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


### Phase 20 — Future Mobile Client Preparation & Handoff
- **Objective / tasks:** OpenAPI freeze, generated TS client, bearer token tests, offline/sync strategy, push notification plan, app feature mapping.
- **Deliverables:** mobile roadmap, API integration guide, example client, compatibility policy.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-20.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Independent mobile client can complete key API flows without web UI. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.


## 15. Future mobile app readiness and mobile app plan

**Mobile target (future, not current build):** Android and iOS customer app first; optional staff app later. Candidate UI technology React Native + Expo because TypeScript contracts can be shared; this does NOT introduce a second backend. Final mobile UI choice is a future decision.

**Customer app feature mapping:** browse catalog/categories/gallery, search/filter, estimator, lead submission, image upload, measurement requests, login/profile, quotation list/details/acceptance, order status timeline, notifications, saved addresses. Optional later cart, payments and AI design.

**Staff app feature mapping:** assigned leads/follow-ups, site measurements/photos, assigned work orders, stage updates, inventory request, delivery/installation checklist, limited offline entry with conflict handling. Restrict finance and admin operations by permission.

**Required now:** stable REST v1; OpenAPI contract; bearer auth; role/ownership controls; cursor pagination; upload-sign endpoint; explicit unit/currency/timezone fields; backward-compatible DTOs; predictable errors; idempotency; request IDs; no web cookie dependence; SDK generation; staged mobile contract tests.

**Offline strategy (future):** cache public catalog and assigned tasks; queue safe writes with idempotency keys; server remains source of truth; conflict detection with version/updatedAt; do not queue sensitive payment or stock-posting operations without explicit review. Push notification integration later requires provider selection and consent; internal notification records can exist now.

**Mobile rollout sequence:** M0 contract audit → M1 generated API SDK + mock app → M2 authentication/profile → M3 catalog/quotes/orders → M4 media upload + notifications → M5 staff workflows/offline pilot → M6 store publishing, security and crash monitoring. App release dates are intentionally uncommitted.

**Maintain `docs/api/mobile-integration.md`:** environments/base URLs, token acquisition/refresh, headers, endpoint catalog, DTOs/examples, pagination, errors, uploads, retries, idempotency, version support, deprecation, offline considerations, push roadmap and test users (no secrets). Update on EVERY API change.


## 16. Future extensions (design only until approved)

1. **Online payments:** provider such as Razorpay, test/live separation, order amount server-calculated, payment intent, signature/webhook verification, idempotency, refund/dispute and reconciliation; never trust client payment success. Record payment events without storing card details.
2. **AI design preview:** customer house image → consent → design suggestion/preview → human-reviewed approximate material estimate; never claim AI structural safety certification. Define cost, provider, data retention and abuse policies first.
3. **Multi-city partners:** verified partner onboarding, city/area, lead assignment, partner quote, margin/commission, settlement, strict tenant-like scoping and audit; do not expose customer data to unassigned partners.
4. **Advanced finance:** cash/bank accounts, GST invoice workflows if applicable, depreciation, tax reports, integration with accounting software after professional review.
5. **Marketing/notifications:** official WhatsApp Business provider, email/SMS, push, opt-in/consent and delivery logs; start with click-to-chat only.
6. **Ready-made e-commerce:** wishlist/cart, checkout, shipping, online payments, cancellations/refunds and stock reservation after pricing policy finalized.


## 17. Risks, decisions and open questions

### Locked decisions
- One Next.js TypeScript codebase; Vercel; Supabase PostgreSQL/Auth; Cloudinary.
- REST `/api/v1` is the mobile-ready integration boundary.
- All source docs are version-controlled and updated with every feature.
- Customer estimates are approximate; final measurement/price requires approval.
- Owner withdrawals are separate from business expenses.

### Risks and mitigations
- **Overlarge scope:** incremental releases and acceptance gates.
- **Serverless execution limits:** no long jobs in request path; plan scheduled/async mechanisms when needed.
- **Financial accuracy:** define accounting policy and get accountant validation.
- **RLS misconfiguration:** automated per-role access tests and no service-role use in browser.
- **Media abuse/cost:** signed restricted uploads, quotas, cleanup and monitoring.
- **Calculation inaccuracies:** explicit units, rule versioning, manual approval and field measurements.
- **Mobile breaking changes:** OpenAPI governance, contract tests, `/api/v1` compatibility.
- **Cost:** verify current Vercel commercial use, Supabase quotas, Cloudinary transformations/bandwidth, domain and notification costs before launch.
- **Sensitive workshop data:** backup/restore, privacy retention, audit and least privilege.

### Owner decisions needed before relevant phase
1. Workshop brand/name, logo, phone, service cities, languages (Hindi/English), currency INR.
2. Are ready-made products purchased online now, or quotation-only until later? **Default: quotation-first**.
3. Is public customer login required in MVP? **Default: optional; guest lead allowed**.
4. Material unit standards and fabrication calculation formulas; wastage, labour, margin and tax policies.
5. Who can approve quotes, stock adjustments, purchases and finance corrections?
6. GST applicability and accounting method; accountant review.
7. Delivery/installation service boundaries, deposit/refund policy.
8. Media retention and permissions for customer house/design photos.
9. Staff notification channels and reminder timing.
10. Domain, budget and production hosting plan.

No unanswered question should silently turn into a hard-coded business assumption; record decisions in ADRs.


## 18. Codex working agreement and prompts

### 18.1 AGENTS.md required instructions
1. Read `docs/MASTER_PLAN.md`, `docs/progress.md` and relevant module docs before coding.
2. Keep fixed stack; no separate backend/database/media provider.
3. Implement only the approved phase and tasks.
4. Design all mobile-relevant features behind versioned `/api/v1` and reuse services.
5. Update OpenAPI, module, schema, security and mobile docs alongside code.
6. Never hardcode secrets, bypass RLS for convenience, or expose service-role keys.
7. Ask before destructive migrations, production writes, payment activation or architecture changes.
8. Add tests for validation, permissions, state transitions and failure paths.
9. Run real checks and report exact results; do not invent successful verification.
10. Update `docs/progress.md` and phase checklist; stop after review.

### 18.2 First Codex prompt (planning only)

```text
Read docs/MASTER_PLAN.md and the original requirements source in docs/source/.
Inspect the repository before modifying anything.
Create AGENTS.md and the complete documentation skeleton described in the master plan.
Normalize all requirements into traceable user stories and acceptance criteria.
Create architecture, ERD, role matrix, OpenAPI v1 skeleton, mobile integration guide,
phase 01 specification and docs/progress.md.
Do not implement application modules yet. Identify ambiguities and request approval.
Keep the mandatory Next.js + Vercel + Supabase + Cloudinary stack unchanged.
```

### 18.3 Repeatable phase prompt

```text
Read AGENTS.md, docs/MASTER_PLAN.md, docs/progress.md and the approved phase file.
Implement only the next approved phase, keeping frontend and backend in Next.js.
For each API, update docs/api/openapi.yaml, docs/api/changelog.md and
mobile-integration.md; use shared server-side business services.
For schema changes, create Supabase SQL migrations and update ERD/RLS docs.
For every feature, add permission, validation, unit/integration/E2E tests as relevant.
Run lint, typecheck, tests, build and API contract checks; report actual outputs.
Update docs/progress.md, phase evidence, known issues and next actions.
Stop before starting another phase or making destructive production changes.
```

### 18.4 Review checklist for every PR
- [ ] Requirement/story linked; phase approved
- [ ] UI responsive, accessible and error/empty/loading states
- [ ] Server-side auth, RLS and validation enforced
- [ ] API DTO stable, OpenAPI and mobile docs updated
- [ ] DB migration reviewed and rollback/forward-fix understood
- [ ] Tests added and actual results recorded
- [ ] Audit/logging and data privacy reviewed
- [ ] README/progress/module docs current
- [ ] No secrets, no new unauthorized stack services


## 19. Final acceptance and launch checklists

### Product acceptance
- [ ] Visitor browses categories, products, media, gallery and reviews
- [ ] Visitor submits enquiry, approximate estimate and measurement request
- [ ] Lead source/status/assignment/follow-up works
- [ ] Admin generates versioned quotation and customer can accept/reject
- [ ] Quote converts exactly once into order and status history is visible
- [ ] Material/BOM/rate history works and old records remain stable
- [ ] Supplier purchases, receipts, payments and balances reconcile
- [ ] Stock IN/OUT/reservations/adjustments reconcile with consumption
- [ ] Worker entries, rate snapshots and payments reconcile
- [ ] Production, QC, delivery and installation flows work
- [ ] Expenses and owner withdrawals remain separate
- [ ] Receivables/payables/P&L reconcile per documented accounting policy
- [ ] Dashboard and report totals match source records
- [ ] Admin content and staff permissions are configurable
- [ ] Activity logs capture sensitive changes

### Technical acceptance
- [ ] Next.js production build passes and Vercel preview/prod smoke tests pass
- [ ] Supabase migrations, constraints, RLS tests and backup/restore test pass
- [ ] Cloudinary upload, privacy, limits and cleanup tests pass
- [ ] OpenAPI v1 complete and mobile bearer-auth contract tests pass
- [ ] No business feature exists only in Server Actions when mobile needs it
- [ ] Validation, 401/403/404/409/422/429 and retry/idempotency verified
- [ ] No secrets in client bundles, Git history or logs
- [ ] Accessibility, mobile layout, SEO, performance and security reviewed
- [ ] Monitoring, incident response, rollback and operational owners defined
- [ ] Current Vercel commercial hosting terms and provider limits verified
- [ ] Every module has docs; progress/phase test evidence current

**Launch sign-off:** Product Owner + Technical Reviewer + Finance Reviewer (for official P&L) sign off applicable sections. No unverified “100% production ready” claim.


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
