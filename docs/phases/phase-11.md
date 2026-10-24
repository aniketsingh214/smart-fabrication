> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: done (local)

# Phase 11 — Quotation Lifecycle & PDF

- **Objective / tasks:** Quote versions, line items, discounts/tax, expiry, approval, customer view, PDF, acceptance/rejection.
- **Deliverables:** quote APIs, templates, docs, integration tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-11.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Quote version immutable and converted once only. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-24. Status: done (local).

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Version history/editor, exact decimal line rounding, discount/tax breakdown, protected customer-link copying, issued-quote revision into a separate draft, approval/acceptance and idempotent conversion are implemented. Revision preserves historical snapshots, supersedes the source, rejects accepted sources and requires reapproval.

### Remaining acceptance

Workshop-specific terms, historical-version PDF selection and full live customer PDF/download acceptance remain. Customer links require a linked authenticated account; no automated external delivery is activated.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.


## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.

## Live Quotation Lifecycle & Customer PDF Browser Acceptance — 2026-10-17

A complete 5-check live browser acceptance run (`npm run test:quotation-browser`) passed with real Chromium/Mobile Safari emulation, owner and customer sessions, PDF generation, and database state transitions:
1. **Draft quote and draft PDF privacy**: Draft quotation and draft PDF endpoints return 404 for the linked customer, 404 for other customers, and 401 for anonymous callers.
2. **Immutable versions & discount-before-tax totals**: Owner creates quotation version 1 with items, discount, and tax (INR 224.20). Owner creates version 2 with updated rate (INR 342.20). Both immutable versions preserved; live PDF generation verified for both version 1 and version 2 (`%PDF-` header, > 1000 bytes, `private, no-store` caching headers).
3. **Customer approval, PDF access & cross-account denial**: Owner approves quotation. Customer views quotation and actions on `/account`, downloads approved version 1 and version 2 PDFs. Cross-account acceptance attempt by stranger customer is denied (409 Conflict). Customer rejects quotation; UI reflects `rejected` status.
4. **Revision draft & separate approval**: Owner creates revised draft using idempotency key; conflicting retry is rejected (409). Source quote is superseded (`superseded` status) with original version history intact. Revised quotation remains draft/hidden from customer until owner approves it.
5. **Customer acceptance & idempotent conversion**: Customer views approved revision and accepts. Owner converts accepted quote to order (`POST /admin/quotations/{id}/convert`). Order created in `CONFIRMED` state with exact quotation price (INR 342.20). Conversion is idempotent (re-posting returns same order ID). Quote is locked against further repricing or revisions (409 Conflict). Customer sees order timeline on `/account`.
- **Fixture Lifecycle**: Converted order transitioned to `CANCELLED` (no real workshop production/stock movement), quotes closed, generated test identities retired from Supabase Auth. Verified evidence recorded in `test-results/quotation-browser-latest.json`.
