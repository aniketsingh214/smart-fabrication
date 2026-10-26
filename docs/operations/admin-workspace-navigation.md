# Admin workspace and record navigation

Updated: 2026-10-26 (Asia/Kolkata)

## Sidebar and route coverage

The owner sidebar has exactly eight main entries. Other roles see only their permitted workspaces. There are no nested sidebar resource menus; section links live inside each workspace. Notifications remain in the header. Staff/permissions live inside Settings. Calculator and customer-site shortcuts moved into the header. All prior resource URLs remain valid.

| Sidebar entry | Workspace / retained pages |
| --- | --- |
| Dashboard | /admin; daily-work and business-overview tabs |
| Sales & Customers | /admin/workspaces/sales; leads, customers, lead-notes, follow-ups, measurements, quotations |
| Orders & Workshop | /admin/workspaces/operations; orders, work-orders, quality-checks, deliveries, installations, workers, labour-rates, work-entries |
| Inventory & Purchases | /admin/workspaces/inventory; inventory balance overview, materials, material-rates, suppliers, purchases, purchase-items, purchase-returns, stock-movements, stock-reservations |
| Products & Website | /admin/workspaces/catalog; products, product-variants, product-options, product-media, categories, bom-versions, bom-items, calculation-rules, estimate-history, gallery, site-sections, reviews, media-assets |
| Finance | /admin/workspaces/finance; customer-payments, supplier-payments, labour-payments, expenses, owner-withdrawals, financial-adjustments, finance-period-closures, expense-reversals |
| Reports | /admin/reports; existing reports, balances and export tools |
| Settings | /admin/workspaces/settings; settings, /admin/users, audit-logs |

Every resource slug above retains /admin/{slug}. Workspace main tabs expose frequent destinations; All lists & history retains every authorized collection. Child routes highlight their owning primary section. A role without a primary-list permission gets accessible fallback cards and its permitted all-list directory, rather than a dead workspace. A registry coverage test requires all 45 registered resources to be mapped exactly once; special inventory/users/report/dashboard routes are separately retained.

## Record tabs

| Record | Tabs |
| --- | --- |
| Enquiry | Details, Notes, Follow-ups, Measurements, Quotations |
| Product | Details, Images, Variants, Options, BOM, Pricing |
| Order | Overview, Production, Quality, Delivery, Installation |
| Purchase | Details, Items, Invoice, Payments, Returns |
| Worker | Details, Rates, Work entries, Payments |
| BOM version | Details, Materials |

Tabs are filtered by child-domain read permission. Invoice keeps the pre-existing finance.read boundary. Parent Details preserves existing transitions, acceptance/conversion/copy controls, attachments and assignment workflows. Notes reuse the existing scoped note/assignment component; assignment-only controls remain in enquiry Details. Product image tabs reuse verified media upload/selection. Purchase invoice upload/private delivery lives in Invoice. Returns are posted through Items -> purchase item details; the Returns tab is immutable history.

Context child lists retain pagination, search, validation and safe view/edit controls. Direct parent IDs are fixed in child create/edit forms. Indirect quality/installation/return selectors only list work orders/deliveries/purchase items belonging to the selected parent. Financial postings, immutable history and draft-parent guards remain server authoritative. No business transaction is created by merely selecting a tab.

Record tabs are local to the open record dialog and reset to Details when the record is reopened; tab selection itself does not add browser history entries. Legacy exact-record URLs and existing page back/forward/search behavior remain supported. Tabs support left/right/Home/End keyboard navigation. Large record dialogs retain the shared viewport-bound shell and scrollable body; add/edit dialogs retain fixed header/footer controls.

## Staff collection API

GET /api/v1/admin/{child}?context={parent}&context_id={uuid}&limit=25

Supported pairs are the twenty allowlisted entries in src/contracts/record-context.ts. Both parameters are required together. Invalid/missing UUIDs or unsupported relationships return 422. The existing child read permission is checked by requestContext; the service also requires parent read permission and an RLS-visible parent before reading children (403 for denied permission, 404 for hidden/missing parent).

Direct foreign-key predicates apply in PostgreSQL before cursor pagination. Order Quality joins work_orders; Order Installation joins deliveries; Purchase Returns joins purchase_items. These are inner joins under the caller's existing RLS. The internal join alias is removed from the public response. No unbounded ID array or service-role bypass is used. Public/customer routes, record-detail and action paths reject these staff-list filters. Pagination and reference-option continuation preserve both context parameters.

Context filters constrain reads, not a new write authorization mechanism. Child writes continue through the existing resource/action APIs and RLS/immutable/draft/idempotency guards. Global CSV export is hidden inside contextual lists so it cannot be mistaken for a parent-filtered export; Open all links provide the existing global collection/export flow.

## Verification and limits

Unit/integration coverage includes complete mapping, exactly eight owner sidebar entries, role-filtered tabs, legacy child ownership, all relationship descriptors, invalid UUIDs/relationships, denied parent permission, RLS-hidden parent, direct database filtering, indirect joins and safe projection. Browser acceptance checks real temporary-owner Auth and read APIs, workspace directories, all twenty relationships, five record tab sets, invoice history, direct prefill, indirect picker scoping, legacy routes, back/forward, search and 320/390/768/1440 layouts. It does not post commercial payments, stock, purchases or order transitions. Generated login retirement is required for a green run.

New navigation does not close business/accountant/retention/payment-gateway launch gates. See ../../PROJECT_STATUS.md and ../progress.md for current and historical evidence.

Local acceptance: 218 unit/integration tests, production build/TypeScript, targeted lint, generated API/types (293 paths / 34 explicit methods), documentation check and secret scan passed. The real configured-development browser/Auth/read run passed all eight checks and retired its generated owner. All twenty relationship endpoints returned valid scoped results; direct/indirect API pagination, invalid/hidden parents, public rejection, record tabs, Invoice history, prefill, indirect selectors, legacy pages, back/forward/search and mobile menu/dialog sizes were checked. No business record was created, updated, posted or deleted.

Production release verification - 2026-10-26: source commit 04f1cb7 was pushed and the new workspace stylesheet was observed on the live site. Three real Auth/browser/read smoke checks passed for direct/indirect context APIs and hidden-parent rejection, eight-entry workspace/legacy record tabs, and nested-create cancellation/mobile scrolling. Generated test login retirement completed; no operational record was written. This supplements the eight local acceptance checks and 218 unit/integration tests.

Advanced retained pages: calculation preview remains at /admin/calculation-preview from Pricing-rule details; product preview remains at /admin/products/{id}/preview. Account/profile and notifications retain their existing header routes. These tools do not add extra sidebar entries. Nested dialog scroll locks use a shared reference count so parent-first unmounts cannot leave the page locked.
