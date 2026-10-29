# Sales and Customers: relationship/search audit

Date: 2026-10-29. Scope: overview, leads, customers, quotations, follow-ups and measurements.

## Verified example and root cause

Read-only database inspection found lead `8697a9a5-daf6-43ad-a9e8-7ddf1adaa37d` named saloni rajpoot with customer FK `69d24cf8-bd62-4dad-ba48-bba4d459cbcc` and product FK `c77a1ea2-fae1-4022-9405-a634f55b5899`.

The customer exists but is named **Inventory Test Customer**. Its phone differs from the lead and it has no matching email. A normalized phone/email search found no other matching customer. This is an identity mismatch requiring owner review, not a dangling FK or proven permission failure. The audit cannot establish who originally selected that customer or whether any non-contact identity alias was intended.

There are zero follow-ups, zero measurements and zero direct quotations for this lead. The linked customer has one quotation, **Inventory Test Quote** (`f7139c4b-2364-4d29-a7a8-a7a407c808f0`), whose `lead_id` is null. It must not appear as this lead's quotation or be reassigned silently.

Before this change list search used only the current table's name/heading field. It did not search linked IDs, phone or email; follow-ups/measurements had no supported text search. Thus searching the lead's name could not find its differently named customer, even though the FK existed. Frontend search visibility followed the same limitation. Lead tabs already used exact lead IDs; customer related tabs were incomplete.

The preferred measurement date **6 November 2026** remains a request in the lead requirement. No appointment, measurement verification, coverage or visit charge is confirmed by this work. Lead and customer hashes were captured locally and verified unchanged in rollback tests.

## Approved data correction completed

The owner explicitly approved creating a new Saloni customer and relinking this lead. Executed on 2026-10-29 at 14:48:58 UTC in one guarded transaction. New customer ID: `ebbc408c-1775-4c5e-9194-584d252c46fe`. Its name, phone and email were copied from the reviewed lead; no address or appointment was invented.

The transaction rechecked original hashes, contact duplicates and absence of direct quotations under locks. Only `leads.customer_id` changed on the existing lead. Inventory Test Customer and Inventory Test Quote hashes remained identical. Lead status, product, requirement, contact fields and preferred measurement request remain unchanged. Local evidence: ignored `test-results/crm-example-repair.json`. This was explicitly authorized database maintenance; no existing user identity was impersonated.

## Implementation contract

- Additive migration 51 adds security-invoker table-returning search RPCs. RLS and domain permissions continue to apply. Only authenticated permitted staff can execute search. No service-role bypass or business-row rewrite.
- Search seeds are actual record IDs and permitted contact fields. Traverse declared FKs, not equal names. Full/partial UUIDs, contact names, email and Indian phone formats are supported. Pure long numeric input is treated as phone to avoid accidental UUID digit matches. Wildcards remain literal.
- Customer searches can find the customer referenced by a matching lead; this exposes the stored link but does not certify identity. Lead/product/child-ID searches do not expand into sibling projects merely sharing a customer. Customer-ID searches include that customer's explicit quotations, including customer-only quotations. Product linkage to quotations exists through `lead_id`; free-text quotation items have no product FK and are not guessed into a product relationship.
- Existing filters, deterministic sort/keyset cursors and exact record-context filters are applied to RPC results in the backend. Export queries reuse the same search source. Public catalog/customer APIs retain their separate read paths.
- Customer details gain quotations, follow-up and measurement tabs. Follow-ups/measurements reference a lead; the customer is derived from that lead, not duplicated into an inconsistent second field. Customer-context lead choices are restricted to that customer's leads.
- Lead-context quotation creation locks the lead ID and defaults its customer from the stored lead FK. A database guard rejects new/relinked quotations whose customer conflicts with that lead. Existing rows/unrelated updates are preserved. This guard does not approve the human identity of the stored FK.
- Related IDs open the actual linked record when the role can read it. CRM lists support clear/status filtering and preserve submitted search/filter context when opening or returning from records. Overview search shows a permitted preview per collection with links to complete paginated results.

## Searchable identifiers by section

| Section | Supported scope |
| --- | --- |
| Overview | Previews all permitted CRM collections using the same backend search |
| Leads | Lead/customer/product IDs, linked quotation/follow-up/measurement IDs, lead/customer contact names/phone/email |
| Customers | Customer IDs/contact fields and actual customers of matching leads/quotations/follow-ups/measurements/product-linked leads |
| Quotations | Own ID/title, direct lead/customer IDs, linked lead/customer contacts and product/child IDs through the same actual lead |
| Follow-ups | Own/lead/customer/product IDs, linked child/quotation IDs through the same visible lead, lead/customer contacts |
| Measurements | Own/lead/customer/product IDs, linked child/quotation IDs through the same visible lead, lead/customer contacts |

## Verification

Evidence is appended after execution in progress.md. Rollback-only database fixtures cover relational correctness, sibling isolation, literal search, role denial and quotation mismatch guards. Post-repair real example checks are read-only; browser create flows intercept writes when validating defaults. These checks do not manufacture a confirmed appointment or modify the supplied customer's identity.

## Acceptance follow-up

During final read-only acceptance, the example had subsequently advanced to MEASUREMENT_PENDING (version 6). The corrected customer/product links remained valid. Tests capture the current record at run start and verify no changes during acceptance; they do not revert later operational edits to the repair-time hash. This status alone does not confirm an appointment. Search refresh requests now reject stale results, and form cancellation preserves the submitted search/filter context.

Migration 52 fixes a reproduced PostgREST RPC-plus-embedded-customer-filter failure (42703). Follow-up/measurement search now takes an optional customer context in the invoker RPC and intersects actual leads.customer_id before paging; API parent permission/visibility checks still apply. Both correct and unrelated customer contexts are covered by rollback fixtures and API acceptance. Existing purchase bill/payment routes were also added to generated contracts after API validation found missing documentation; their runtime behavior was not changed.

Local acceptance completed all seven groups across targeted runs, plus eight existing admin table regression groups. Related creation requests were intercepted with 422 after payload capture; no actual appointment/quotation/follow-up was saved. Nine DB rollback groups cover actual child rows, foreign-key traversal, sibling isolation, roles, quote integrity and customer contexts. 310 unit/integration tests, production build, changed-file lint, API/docs and secret checks passed. Full live evidence is recorded separately in progress.md.

## Changed file groups and rerun commands

- Database: migrations 51/52; generated database inventory/migration log.
- API: operations/services.ts, shared database-error mapping, report export and sales-search contracts; generated OpenAPI/mobile contracts.
- UI: ResourceWorkspace, SalesWorkspaceSearch, record-context contract and admin module/workspace pages.
- Tests: tests/integration/sales-search.test.ts; scripts/test-sales-search-db.mjs; scripts/test-sales-search-browser.mjs; non-contact example identifiers in sales-search-example.mjs.
- Documentation: this audit, progress, relevant CRM modules, mobile integration and permission notes.

Run npm run test, npm run build, npm run api:check, npm run docs:check and npm run security:check. Configured development services are needed for node --env-file=.env.local scripts/test-sales-search-db.mjs (fixtures roll back) and scripts/test-sales-search-browser.mjs (generated Auth identity; business POSTs intercepted). Set TEST_BASE_URL=https://smartfabrication.vercel.app for live browser acceptance.
