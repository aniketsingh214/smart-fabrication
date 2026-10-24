> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (live); 432 published products

# Products

## Current implementation update — 2026-10-15

Variants/options have staff management screens and published-only public display. Private preview requires catalog read permission; idempotent duplication creates a separate draft and copies unarchived choices as drafts. BOM/rule configuration is deliberately reviewed separately. See [workflow guide](../operations/catalog-procurement-corrections.md) for exact behavior and catalog follow-up work. This is not full Phase 07 acceptance.

## Source specification

- **Functional scope:** SKU, name, slug, category/subcategory, description, images/video, size, material, finish, colour, weight, price range, custom-size/design, installation/delivery options; draft/preview/publish, duplicate, soft delete.
- **Rules / acceptance:** Uniqueness and SEO validation, Cloudinary assets, publication workflow, public API filtering.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.



## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.

## Public browse continuation — 2026-10-16

Catalog and consented gallery lists now use deterministic created_at/id ordering with a 48-row page and one-row lookahead. Continuation links preserve catalog search/category filters; first-page links clear only the cursor. Invalid cursors are rejected before database access and offer a reset. Draft/consent guards and media projection are unchanged. Two pagination boundary tests and three server-render integration tests cover timestamp precision, UUID tie ordering, filter continuation, consent scope and invalid cursors. The complete public desktop/mobile suite passed 28 checks. No API schema or database migration changed.

## Verified continuation — 2026-10-17

Seven combined real mobile CMS/category-photo/catalog/enquiry/sales checks passed. Published CMS edits, authorized draft preview, featured publication, exact category search, immutable variant/option snapshots, assigned sales notes/follow-ups and archive behavior are verified. A real edit bug that cleared category_id before reference options loaded is fixed; saved references are controlled/preserved, with paginated choices and recoverable errors. Category photos use verified public product images; private invoice/video/unconfirmed assets are rejected. Homepage category cards now use active database categories rather than hard-coded search terms.

Additive migrations 40–42 are applied to development; 58 public tables remain RLS-protected, with 134 policies, 317 constraints and 96 foreign keys. Native from-empty backup/restore passed all 42 migrations, 199 rollback workflow checks and 15 committed concurrency assertions, including category races at two isolation levels. Earlier failed fixture assertions remain recorded as failures. Current unit/integration evidence: 131 tests / 38 files. Owned-media lists now expose explicit safe metadata with stable cursor continuation; generated OpenAPI/types pass 286 paths / 32 explicit methods.

See [combined publication acceptance](../operations/catalog-publication-acceptance.md) for exact scope and retained fixtures. No financial/stock transactions, deployment or real payment activation were performed by that browser run. Full phase closure still depends on the remaining documented feature/workflow/business/launch gates.
Resolved in migration 43: product-level delivery/installation availability has dedicated validated fields, staff preview/public display and draft-copy preservation. Final commercial coverage and actual offered options/charges still require workshop input.

## Product service/media contract — 2026-10-17

`/admin/products` and projected product APIs expose `delivery_availability` and `installation_availability`: `confirm_with_workshop` (default), `available`, `unavailable`. Catalog read/write permissions and published-only RLS remain unchanged. Unrelated PATCH requests preserve omitted availability; copied drafts preserve availability and remain unfeatured/unpublished. Public detail and staff preview share the service display; no free price/coverage is implied.

`/admin/product-media` associates confirmed public product-context images/videos. Its filtered, paginated selector preserves loaded/saved references. The database independently rejects private invoices and unconfirmed/wrong-context metadata. Product/category/media history is retained on archive. See [service/media workflow](../operations/catalog-services.md) and [combined acceptance](../operations/catalog-publication-acceptance.md). Input/permission/not-found/conflict errors use the documented API envelope; no deletion or role-policy bypass was introduced.

## Catalog Scale & Laser Cutting Gates Ingestion — 2026-10-24

The public catalog has scaled to **432 published products** across 10 top-level categories and multiple subcategories.

Key catalog additions:
1. **Laser Cutting Gates Ingestion**: Added 22 specialized laser-cut gate models (`GATE-LSR-001` through `GATE-LSR-021` + variants) featuring modern CNC geometric patterns, floral leaf designs, luxury black & gold dual tones, and motorized sliding variants.
2. **Cloudinary Asset Storage**: High-resolution imagery for laser gates is hosted under `smart-fabrication/development/laser-gates/` with optimized WebP/JPEG delivery and responsive aspect ratios.
3. **Multi-Field Search Indexing**: Products are indexed and searchable via the global search bar across SKU, product title, description, category slug, and subcategory slug.
4. **Subcategory Association**: Products are directly associated with subcategories (`modern-cnc-gates`, `floral-laser-gates`, `luxury-black-gold-gates`, `laser-sliding-gates`, `commercial-rolling-shutters`, etc.), enabling instantaneous faceted filtering on `/catalog`.