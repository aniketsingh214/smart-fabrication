# Admin list workflows — 2026-10-25

## Scope

Registered resource lists share a serial column, eye/edit/remove icons, compact sage controls, sticky actions, loading/error/empty states and bounded cursor pages (10/25/50/100). Previous/next navigation retains visited cursors; search and page-size changes reset the cursor stack. Serial numbers are ordinals within the current navigation/search, not permanent business identifiers. Concurrent inserts can change later ordinals. No invented record total or last-page count is shown for cursor collections.

Staff, notifications and inventory now use the same table presentation. Staff access changes still use the existing owner-controlled role/status endpoints. Notification records can be viewed/marked read, not edited or deleted. Inventory balances are computed, so an eye opens their snapshot and a permitted source link opens the material master; editing quantities continues through the audited StockForm. Inventory search and pagination operate over the existing RLS-scoped balance snapshot. They do not change the database RPC's full-snapshot query cost. Staff/notification links opened with an existing cursor begin a new local navigation stack; serials restart at that stack's first record.

Receivable/payable/worker-balance tables now have serials, page size, reversible previous/next navigation, accurate page labels and source-record eye links. Source links still require the relevant module's read permission. These balances are derived and cannot be edited/deleted directly. The role matrix has local search, serials and 25-row pagination; existing protected-role rules are unchanged. Supplier statement entries retain bounded append-on-demand loading and now have serials.

## Edit and removal policy

No generic DELETE endpoint or destructive database operation was introduced. The trash icon is explicitly a **remove listing / archive** action where supported, with a confirmation dialog explaining preserved history:

| Resource | Existing PATCH operation |
| --- | --- |
| Categories, materials, workers | `active: false` |
| Products, variants, options, gallery, website content | `status: archived` |
| Reviews | `status: hidden` |
| Staff | Existing account-disable screen; server protects the current owner |
| Other workflows/history | Disabled; use cancellation, return, reversal or reviewed correction |

Archived/inactive records remain visible to authorized staff and can be restored through the edit form. Their public/active use is removed. The removal whitelist intentionally excludes BOM/pricing versions, orders, purchases, financial postings and stock history. Already removed listings disable the repeated action.

Edit icons use the resource write permission and existing immutable/RPC rules. Non-draft quotations, purchases, expenses, BOM versions and pricing rules disable generic editing in the UI; database rules remain authoritative for all callers, including race conditions and restricted parent records. Draft line items can still be rejected by the server if their parent has since been posted. No RLS policy, grant, migration or audit history was relaxed.

## Validation/API contract

Forms parse through the same resource schema as the API: text trimming, required values, UUID references, Indian mobile normalization, valid dates, finite bounded numbers, JSON objects, rupee/percent conversion, review rating and price bounds. Field messages use `aria-invalid`/`aria-describedby`; the first invalid field receives focus. Inputs and dismissal are guarded during saves. Correcting inputs resets the creation idempotency key; unchanged retries retain it.

`PATCH /api/v1/admin/{resource}/{id}` additionally validates review ratings and compares partial product/variant price changes against the current RLS-visible counterpart before updating. A concurrent database constraint remains authoritative. Error statuses and safe projections are unchanged. Mobile clients can use these existing PATCH payloads for listing removal and must not assume DELETE is supported. Non-editable history requires its documented workflow API.

## Verification

The focused suite covers permissions/immutability, draft-only UI editing, the reversible-removal whitelist, invalid JSON/slugs/numbers, Indian mobiles, rupee precision, rating and price bounds, real page labels/ranges and RLS-visible counterpart validation. Browser acceptance uses generated retired Auth fixtures and intercepted synthetic category/stock responses; no operational POST/PATCH reaches the server. It verifies pagination, eye/edit forms, blocked invalid submission, confirmation/cancellation, deactivation payload and read-only/mobile/special collection rendering. This is UI/transport acceptance, not a claim that every real business mutation was re-posted.

Final local acceptance: 205 unit/integration tests, seven authenticated browser checks, production build/TypeScript, targeted lint, API/docs checks and secret scan passed. The browser harness initially needed accessible-label and table-scoping selector fixes; failed attempts were not counted as passes. Generated logins were retired after each attempt. The final ignored report is `test-results/admin-tables-browser-latest.json`. Actual run results are recorded in [progress](../progress.md). This change does not complete accountant/business launch approvals.
