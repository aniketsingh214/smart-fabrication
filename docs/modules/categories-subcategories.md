> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (live); production content active

# Categories & Subcategories

## Source specification

- **Functional scope:** Main Gates, Steel Gates, Iron Gates, Grills/Jali, Shutters, Doors, Windows, Railings, Sheds, Custom Fabrication; image, sort order, active flag.
- **Rules / acceptance:** Prevent cyclic hierarchy, unique slugs, product impact on archive.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implemented contract — 2026-10-17

Admin route: `/admin/categories`. Create/update use `/api/v1/admin/categories` and `/{id}` with `catalog.write`; staff reads require `catalog.read`. Public category reads expose active records through the resource projection and RLS. Fields are name, unique slug, optional parent, optional verified photo, nonnegative display order and active flag. Generated OpenAPI/types declare the image UUID and nullability.

Upload a product photo in the category page, then select it in the category form. The own-asset selector supports cursor continuation and preserves a saved selection while options load. Database enforcement requires a confirmed upload intent and a public product-context JPEG/PNG/WebP image; private invoices, videos and unconfirmed metadata are rejected. No arbitrary external photo URL is accepted. Category name supplies the accessible image description.

Homepage cards display up to eight active root categories in display-order/UUID order, with real verified photos or an explicitly labeled illustration. Links filter by exact category UUID. The complete category filter remains on the catalog page. Deactivating a category removes it from public category choices/cards; products and their historical category reference are preserved, and published products are not automatically archived. No destructive cascade is performed.

Hierarchy edits reject direct self-parent inserts and ancestor cycles, including inactive ancestors. A statement-level transaction advisory lock serializes category writes before target row locks. Ancestor row locks protect repeatable-read transactions from stale hierarchy snapshots; callers may receive a normal serialization conflict instead of committing a cycle. Existing cycles cause migration preflight to fail for review rather than being rewritten.

Verification: actual mobile category upload → Cloudinary verification → database confirmation → real admin photo association → anonymous metadata/public delivery passed. Isolated native PostgreSQL tests cover self-parent/ancestor rejection, valid root moves, provenance/private/video boundaries and competing parent edits under READ COMMITTED and REPEATABLE READ. The 42-migration local rehearsal passed 199 workflow checks, 15 committed concurrency assertions and matching restored row fingerprints. Production capacity and final workshop category content are separate gates.

## Laser Cutting Gates & Subcategories Architecture — 2026-10-24

Ingested a dedicated top-level category `Laser Cutting Gates` (`laser-cutting-gates`) configured with four specialized subcategories:
- `modern-cnc-gates`: Modern Geometric & CNC Sheet Gates
- `floral-laser-gates`: Intricate Floral & Nature CNC Cut Gates
- `luxury-black-gold-gates`: Luxury Black & Gold Dual-Tone Accent Gates
- `laser-sliding-gates`: Motorized Heavy-Duty Laser Cut Sliding Gates

Associated 22 high-resolution flagship laser-cut gate models (`GATE-LSR-001` through `GATE-LSR-021` + variants) hosted via Cloudinary. Configured 2-tier Category & Subcategory drill-down:
- Homepage category cards direct visitors to `/catalog?category={id}`.
- Subcategory pills enable instant 1-click filtering within categories.
- Subcategories for `Rolling Shutters` are similarly configured (`commercial-rolling-shutters`, `industrial-heavy-shutters`, `perforated-grill-shutters`, `motorized-remote-shutters`).
- Acyclic hierarchy enforcement, unique slug constraints, and transactional locks remain strictly active.

## Source and remaining launch acceptance

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens, validation, projected DTOs and hierarchy/media guards are specified above; API schemas are generated from the resource registry.
- Additive migrations 41–42 document category media/hierarchy integrity. Final workshop taxonomy/photos and broader production/accessibility acceptance remain open.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.
