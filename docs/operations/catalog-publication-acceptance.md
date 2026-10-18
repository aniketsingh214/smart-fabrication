# Local CMS/catalog/customer acceptance

Updated: 2026-10-17. Command: `npm run test:publication-browser` against the local application and configured development Supabase/Cloudinary. Latest complete run passed seven checks; no business API response was intercepted.

1. Generated owner signs in on a mobile viewport. A draft CMS process section is published and edited through the real admin form; an independent anonymous browser sees both changes. The section is then archived.
2. A generated PNG uploads through the category-page widget to Cloudinary and is verified/confirmed by the server. The real category form associates it. Anonymous category metadata and public delivery are checked.
3. Draft product is hidden anonymously and visible in authenticated preview.
4. Real form publishes the product without losing its category. Featured homepage appearance, anonymous search/category filter, design metadata and variant display pass.
5. Anonymous customer selects a variant/option and submits a real enquiry. The saved immutable snapshot contains the server-derived selections and indicative-price marker.
6. Assigned generated sales role reads its lead, writes a note, creates/completes a follow-up and transitions the lead. This does not assert every unassigned-object denial.
7. Archive removes public product/featured appearance and preserves the original enquiry configuration snapshot.

Fixture lifecycle: exact run labels/UUIDs are reconciled before retirement. Test CMS/catalog records are archived, category deactivated, lead closed LOST and follow-up completed. One confirmed synthetic category photo remains referenced by the inactive test category; provider/database/audit evidence is retained rather than deleting a referenced record. Generated audit-author accounts lose all roles and are disabled, globally signed out and banned/password-rotated. No real customer's account/password, order, receipt, payment or stock movement is used.

Earlier failed attempts remain failures: one category creation returned an uncertain timeout and was later reconciled/deactivated with an exact unlinked-fixture guard. A later run exposed product edits clearing `category_id` while reference options loaded. The shared controlled reference selector fixes that bug and the full real rerun passes. Native rehearsal also caught two test-fixture mistakes (copied-product count and video intent metadata); corrected runs, not those failures, support the current result.

Forward migrations 40–42 add featured products, verified category photos and hierarchy integrity. All earlier applied migration files are preserved. Native from-empty/restore rehearsal passes 199 rollback workflows and 15 committed concurrency assertions; the two new category races cover both READ COMMITTED and REPEATABLE READ. Live rollback evidence is recorded in the progress/test register after completion.

Remaining boundaries: broader gallery/review moderation, all media associations, the full quotation/payment/production/delivery browser journey, actual workshop product/service content and business/accounting approval. Passing this scoped journey does not close all 20 phases or authorize deployment.

Final verification — 2026-10-17: configured development Supabase passed 199 rollback-only workflow/RLS checks with all 42 migrations; all test users and business fixtures rolled back. Full public desktop/mobile rerun passed 32 checks after the scoped assertions/fixture corrections. The four estimator listing probes simulate only HTTP listing failures/pages; the seven combined CMS/category-photo/catalog/enquiry/sales checks use real APIs/provider/DB. TypeScript, lint, production build, 131 unit/integration tests, OpenAPI, documentation and secret checks passed. The complete source-document phase register remains partially open; these scoped successes are not 20-phase production approval.
# Latest Steps 1–2 evidence — 2026-10-17

The latest catalog-only combined run passed eight real mobile checks, including Cloudinary category upload, verified product-photo association, delivery/installation display, draft calculation preview, public changed-rate calculation, preserved historical results, hidden BOM details, configured enquiry and assigned-sales follow-up. A targeted calculator-only run also passed. CMS acceptance belongs to the earlier seven-check run; it was not rerun as part of this eight-check result. Products/content/categories/materials were archived/deactivated and generated audit identities retired. Labeled media associations, rates, BOM/rules, estimate snapshots and immutable audit remain. No financial/stock transaction was posted. See [current progress](../progress.md).

