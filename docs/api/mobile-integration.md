> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: local contract implemented; mobile acceptance pending

# Mobile integration draft

Operational dashboard: `GET /api/v1/dashboard?scope=business&task=all&page=1` supports bearer authentication and uses the same RLS-scoped response as `/admin`. Use generated types from `/dashboard`; null metrics mean outside the role, not zero. Task identifiers/kinds support native navigation; relative hrefs are web drilldowns. Today/overdue use Asia/Kolkata database response time. Marker-based demo separation is not business certification. See [definitions and limits](../operations/daily-work-dashboard.md).

## 7. API-first architecture for web and future mobile

**Permanent rule:** ALL customer/mobile-relevant capabilities must have stable documented HTTP APIs under `/api/v1`. A mobile app must never depend on HTML parsing, Next.js Server Actions, browser cookies, internal React types or direct privileged Supabase table access. Next.js remains the only application backend. Browser SSR can call server services directly, but any mobile-required business action must also be available through REST handlers calling the SAME service.

### 7.1 Contract conventions
- Base URL: `https://<production-domain>/api/v1`; development and staging use separate hosts.
- JSON over HTTPS; UTF-8; stable resource names plural (`/products`, `/quotations`).
- Authentication: `Authorization: Bearer <supabase_access_token>` for mobile; server validates token and roles. Web session support separately with CSRF/origin controls.
- Public endpoints anonymous; protected endpoints return 401 without valid identity and 403 without permission.
- IDs: UUID strings; dates ISO 8601 UTC; money decimal strings with currency (avoid binary floating-point); units explicit (`mm`, `m`, `kg`, `pcs`, `sq_m`).
- Pagination: `limit` + opaque cursor for large changing collections; bounded limits and deterministic ordering; filters documented; do not leak private counts.
- Success response example: `{ "data": { "id": "..." }, "meta": {}, "requestId": "..." }`.
- Error response example: `{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid dimensions", "details": [] }, "requestId": "..." }`.
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



## 15. Future mobile app readiness and mobile app plan

**Mobile target (future, not current build):** Android and iOS customer app first; optional staff app later. Candidate UI technology React Native + Expo because TypeScript contracts can be shared; this does NOT introduce a second backend. Final mobile UI choice is a future decision.

**Customer app feature mapping:** browse catalog/categories/gallery, search/filter, estimator, lead submission, image upload, measurement requests, login/profile, quotation list/details/acceptance, order status timeline, notifications, saved addresses. Optional later cart, payments and AI design.

**Staff app feature mapping:** assigned leads/follow-ups, site measurements/photos, assigned work orders, stage updates, inventory request, delivery/installation checklist, limited offline entry with conflict handling. Restrict finance and admin operations by permission.

**Required now:** stable REST v1; OpenAPI contract; bearer auth; role/ownership controls; cursor pagination; upload-sign endpoint; explicit unit/currency/timezone fields; backward-compatible DTOs; predictable errors; idempotency; request IDs; no web cookie dependence; SDK generation; staged mobile contract tests.

**Offline strategy (future):** cache public catalog and assigned tasks; queue safe writes with idempotency keys; server remains source of truth; conflict detection with version/updatedAt; do not queue sensitive payment or stock-posting operations without explicit review. Push notification integration later requires provider selection and consent; internal notification records can exist now.

**Mobile rollout sequence:** M0 contract audit → M1 generated API SDK + mock app → M2 authentication/profile → M3 catalog/quotes/orders → M4 media upload + notifications → M5 staff workflows/offline pilot → M6 store publishing, security and crash monitoring. App release dates are intentionally uncommitted.

**Maintain `docs/api/mobile-integration.md`:** environments/base URLs, token acquisition/refresh, headers, endpoint catalog, DTOs/examples, pagination, errors, uploads, retries, idempotency, version support, deprecation, offline considerations, push roadmap and test users (no secrets). Update on EVERY API change.



## Current local implementation

Finance/report follow-up: use `POST /finance/adjustments` for reviewed correction kinds and manually verified refunds, and `POST /finance/periods/close` for reviewed past-period cutoffs. Both require UUID idempotency headers; client-supplied source amounts are rejected except the explicitly capped supplier-refund amount. Full customer cancellation refunds additionally require order approval and physical-work/reservation checks. Read immutable history through `/financial-adjustments` and `/finance-period-closures`. See [finance rules](../operations/refunds-periods.md).

`GET /reports/trends?from=...&until=...` returns scoped chart series; inaccessible domains are null. Computed finance balance endpoints return page arrays with UUID `meta.nextCursor`. CSV clients must follow `X-Next-Cursor`/`Link` across numbered batches; report exports are no longer a complete unpaged response. See [pagination/export rules](../operations/reporting-exports.md). Purchase line `tax_bps` is integer basis points, while the web form displays percent. Exact signed stock `book_value_minor` is authoritative when present; legacy rows use rounded quantity × unit cost.

Catalog/procurement/finance additions: read published choices with `/products/{id}/configuration`; staff preview uses `/admin/products/{id}/preview`. `POST /products/{id}/duplicate` needs `{name,sku,slug}` and a UUID idempotency header. `/product-variants` and `/product-options` require catalog permissions. Supplier statements at `/suppliers/{id}/statement` use a separate opaque cursor (25 events/page) and return all-time totals with paged entries; finance, supplier and purchase read permissions are required. Expense reversal creation at `/expense-reversals` requires `{expense_id,reversal_date,reason}`, `finance.approve` and a UUID idempotency header. Amount/actor are server-derived. Purchase returns remain posted through `/purchases/returns`; `/purchase-returns` is read-only history. See [workflow guide](../operations/catalog-procurement-corrections.md) for limits and refund exclusions.

Local base URL: `http://localhost:3000/api/v1`. No hosted base URL exists. [OpenAPI](openapi.yaml) contains implemented paths, with declarations generated into `src/contracts/generated-api.d.ts`; `src/contracts/client.ts` supplies the cookie-independent client. The domain examples in [inventory](endpoint-inventory.md) remain the original target inventory; use OpenAPI for exact implemented names and methods.

Current envelopes use a top-level `requestId`, not the planning examples' `meta.requestId`. Stored money fields use integer minor units (INR) and `_minor` names. Do not assume all DTOs use the proposed decimal-string convention. Resource lists expose a `data` array and `meta.nextCursor`; see [pagination](pagination.md). Reports use India business dates. Cookie writes require same origin; bearer clients supply the current Supabase access token.

Stock, quotation conversion, payment, work-entry and owner-withdrawal operations require stable idempotency keys where specified. Preserve a key across retries; conflicting payload reuse is rejected. Privileged keys stay server-side. Guest upload requires a short-lived capability tied to a saved enquiry; private files require permission-checked delivery URLs.

Quotation revision: `POST /quotations/{id}/revise` with `{ "expires_at": "2030-10-20T06:30:00Z", "reason": "Updated site dimensions" }` and a UUID `Idempotency-Key`. Both quotation write and approval permissions are required. `data.result` is the new draft ID. The original becomes `superseded`; its snapshots remain immutable. Accepted quotes cannot be revised. Use `GET /quotations/{id}/versions` for immutable history. Drafts remain staff-only until separately approved. Fractional line quantities round to minor units before subtotal; discount precedes tax. Never trust client-displayed totals for posting.

Contract checks and mocked bearer boundary tests pass. Live authenticated native token acquisition/refresh, full endpoint examples, complete per-operation response schemas, offline conflict handling and mobile SDK acceptance remain pending. No mobile application or store release is included in this local web build.


## Catalog and hardening follow-up — 2026-10-15

Resource-read DTOs now derive PostgreSQL types/nullability from captured schema metadata and the exact runtime projection in src/contracts/resource-projections.ts. Lists retain data array / meta.nextCursor; detail data is one projected object. New database columns are not automatically exposed. Specialized customer/report/action envelopes and complete examples remain. Twelve real bearer/session/read-role checks passed; native app/offline acceptance is not claimed. Enquiries accept selected_variant_id and up to 20 unique selected_option_ids; server-derived snapshots are immutable. Invoice-image attachments and historical PDF version selection are documented in OpenAPI.

GET /finance/reconciliation returns a current operational snapshot with section-specific permission guards and null unavailable sections. Amounts are exact integer minor-unit strings; preserve them without floating-point conversion. This endpoint is independent of period filters and marks official_accounts false.



Current customer contracts: /quotations and /orders return safe owned DTOs to customers and projected records to authorized staff, documented as separate schema alternatives. Lists return data arrays with meta.nextCursor. /account independently pages both collections; /account?quotation=<uuid> loads an owned issued quotation directly. Internal lead/customer/provenance fields are omitted from customer quotation DTOs. Posting retries for payments, stock and earnings now bind the original author; retain the same key only for that author's unchanged retry. Legacy rows without a direct author use verified immutable audit provenance or reject replay.


Identity/notification responses now have explicit generated schemas. GET /me contains id, display_name, disabled, permissions and a nullable customer DTO (id, name, phone, nullable email, address); PATCH returns id/display_name. Identity RPC failures return the normal error envelope. Notifications expose id/name/body/read_at/created_at, with nullable read_at and paginated data arrays. Mark-read returns id/read_at. See the generated OpenAPI for concrete schemas.

### Stock command retry guidance

After an uncertain network/server response, retry stock writes with the exact original Idempotency-Key and payload bytes. A fresh key represents a new command, even when values look identical. The web inventory form now freezes an unresolved mounted-form request and releases fields after a recognized rejection. It does not persist that pending command across reload/navigation or queue offline stock writes. Verify the ledger before recreating a request after losing local pending state. No HTTP request/response schema or database rule changed in this UI fix.

Stock navigation recovery now supersedes the earlier mounted-form-only note: the web command persists to account-scoped sessionStorage before dispatch and restores in the same tab after reload/navigation. This is not cross-device/offline business-intent deduplication. Storage failure blocks dispatch; unknown outcomes retain the original key/body. Staff list continuation is available on /admin/users with limit default/max 100 and meta.nextCursor; the safe response schema includes created_at.

## Shipped SDK handoff — 2026-10-16

The [mobile handoff](mobile-handoff.md) includes a type-checked generated-contract example, token/error handling, feature mapping, offline/conflict rules, push roadmap and compatibility/deprecation strategy. The shipped client explicitly omits cookies, refuses redirects, constrains paths to its API base, permits remote HTTPS/loopback HTTP, and retains correlation/status on non-JSON failures. No automatic write replay is added. Five client regression tests pass.

`test:mobile-client` passed seven independent real SDK/Auth/API checks: identity, profile update with privilege-overposting denial, notification pagination/idempotent mark-read, object/staff denials, anonymous isolation, refreshed token and disabled-profile denial. This does not certify every operational write or a native UI. Its initial run passed HTTP checks but failed deletion because immutable audit records reference the fixture author. Corrected cleanup removes notifications/roles and retains only a disabled/banned generated author identity; successful sessions are globally signed out. No audit history or financial/stock records were deleted.

## Product services and calculation APIs — 2026-10-17

Product create/update/read/configuration DTOs include delivery_availability and installation_availability (`confirm_with_workshop`, `available`, `unavailable`). Existing/default state is confirmation; unrelated PATCH preserves values. Product media requires a confirmed public product-context image/video in the database.

`POST /estimates` returns an explicit validated EstimateResult with immutable formula/BOM/rate provenance. Only customer-visible material lines appear; fully internal BOMs return an empty material array while retaining full totals. `POST /estimates/preview` requires BOTH materials.read and catalog.read, accepts product_id/bom_id/rule_id and dimensions, and returns preview:true without an issued ID or saved snapshot. Staff preview/history retains internal components. The private shared SQL helper cannot be called directly by application roles.

Protected `/admin/estimate-history` and `/estimate-history` resource reads use materials.read; exports use materials.export. Legacy stored result JSON retains its original shape. New requests create history once per submitted calculation; there is no automatic write replay. See [typed cookie-independent example](../../examples/mobile/calculation.ts) and [workshop configuration](../operations/calculation-configuration.md). Generated contracts currently cover 292 paths / 33 explicit methods and 45 registered resource lists. Broader native-app/operational acceptance remains separate.

### Admin listing removal and partial edit validation

Use existing authenticated admin PATCH endpoints with the same write permissions for supported archive/deactivation payloads. There is no generic DELETE endpoint. Financial/stock history requires workflow corrections. Partial product/variant price updates are compared against the stored RLS-visible opposite bound; invalid rating or price bounds return 422. See [whitelist and behavior](../operations/admin-list-workflows.md).
