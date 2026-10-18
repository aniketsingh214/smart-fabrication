# Product services and verified media

Updated: 2026-10-17. Step 1 engineering implementation; final combined browser result is recorded in the progress register.

Owners/content staff with `catalog.write` edit **Delivery availability** and **Installation availability** in `/admin/products`. Values are `confirm_with_workshop`, `available` or `unavailable`. Existing/new products default to confirmation; the application does not promise free services, geographic coverage or agreed charges. Staff preview and published product details show the configured state. Draft copies preserve both settings and remain drafts. PATCH of an unrelated field does not reset either setting.

Product services are included in registry-derived resource API DTOs, generated OpenAPI and mobile TypeScript. Product configuration reads project the same fields. These are catalog availability statements; actual commercial scope, selectable add-ons and charges remain subject to the versioned workshop rules and approved quotation.

Product-image management offers only public product images/videos owned by the signed-in uploader, with pagination and saved-reference preservation. A database trigger independently rejects private invoices, unrelated media contexts and metadata without a confirmed upload. This applies to direct authenticated API/database writes and copying associations, not only to the visible dropdown. Existing records are not deleted or rewritten.

Migration 43 is additive. Synthetic from-empty/restore verification passed 207 workflow checks and 15 committed concurrency assertions. New checks cover service defaults/validation, published-only visibility, copied draft settings, private invoice rejection and verified public image association. Unit/integration tests currently pass 134 checks. Initial real-browser attempts failed on exact required-label selectors, and a subsequent fixture lacked required display order; they are not counted as passing acceptance. Their labeled draft/category/asset records were archived/deactivated and generated audit identities retired. The corrected Step 1 run passed seven real catalog/customer/sales checks. A subsequent real calculator run passed its draft-preview, rate-history and internal-component checks; final combined evidence is recorded in progress.

Business input still required: actual service coverage, product taxonomy/photos and offered options/charges. No availability or prices are inferred from demo fixtures.
