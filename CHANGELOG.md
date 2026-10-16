> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: local implementation in progress

# Changelog

## 2026-10-15 — Catalog, procurement and expense corrections

Added variant/option management and published-only display, protected product preview and idempotent draft duplication. Added purchase-item return forms, immutable return history and supplier statements with complete totals plus cursor-paged activity. Added full approved-expense corrections with immutable provenance and net period reporting. No cash refund or other payment reversal is implied. Database metadata now covers 55 RLS-enabled tables, 131 policies and 22 migrations. Validation includes 88 rollback-only SQL checks, 47 unit/rendering tests and 28 authenticated/UI browser checks; form APIs are simulated after real login. See current [progress](docs/progress.md) and [workflow guide](docs/operations/catalog-procurement-corrections.md).

## 2026-10-15 — Owner access and quotation follow-up

Granted the selected confirmed owner's access. Added quotation version history, line-item editing, discount/tax breakdown, authenticated customer-link copying and transactional issued-quote revisions into separately approved drafts. Preserved immutable snapshots and protected accepted/superseded states. Matched fractional minor-unit rounding with PostgreSQL and added real PDF rendering coverage. Fixed mobile admin-table screen-reader label overflow and dialog sizing after browser regression failures. Latest verification: 71 database, 44 unit/rendering, 20 authenticated/UI and 18 public-browser checks passed; build and contract/security checks passed. Quotation UI payload checks use simulated responses after real login. All 20 plan phases are not yet complete.

## 2026-10-15 — Local implementation and audit fixes

Implemented public website, authentication/account area, permission-scoped administration and operational services across catalog, CRM, estimating, quotations, orders, procurement, inventory, production, delivery and provisional finance. Added private Cloudinary media and API contracts. Applied 17 additive migrations; all 51 public tables have RLS.

Fixed customer DTO privacy, assigned-lead access, partial stock reservations, server-derived consumption costing, immutable snapshots, duplicate financial posting, installation evidence guards, bounded JSON parsing, callback redirects and form data preservation after failed requests. See [test evidence](docs/testing/evidence.md) and [phase audit](docs/progress.md) for actual coverage and remaining work. GitHub push and hosting remain deferred by the user's local-only instruction.

## 2026-10-14 — Phase 01 preparation

Created local planning workspace, preserved source, mapped requirements and prepared module/phase documentation. No business modules or account integrations implemented.


## Finance and reporting follow-up — 2026-10-15

Purchase discount/tax and exact inventory values; paid-return supplier credits and refunds; immutable financial corrections and reviewed period closure; guarded full customer refunds; filtered report charts, balance pagination and CSV continuation. Local scope only.


## Catalog and hardening follow-up — 2026-10-15

Catalog video/weight/design metadata and immutable enquiry selections; private invoice-image attachments; selected historical quotation PDFs; scheduler grant/credential fixes; generated resource-read DTOs; live session/read-role, contention, browser media and bounded local-load checks.
