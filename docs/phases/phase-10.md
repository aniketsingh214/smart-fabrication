> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: done (local)

# Phase 10 — CRM: Leads, Customers, Follow-ups

- **Objective / tasks:** Public lead capture, source, duplicate logic, customer profiles, assignment, statuses, notes, follow-up reminders.
- **Deliverables:** lead/customer APIs, admin UI, spam protections, workflow docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-10.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Enquiry creates lead; authorized sales staff follows up. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-24. Status: done (local).

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Guest enquiries, source/status, owner/customer linking, assigned-lead APIs, follow-ups and private design attachments exist.

### Remaining acceptance

Assignment and notes UI are wired; duplicate flagging and follow-up scope passed SQL tests. Reminder runtime, authenticated browser and attachment/retention acceptance remain.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phaseâ€™s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.


## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.

## Continuation — 2026-10-16

Guest optional reference images now have a retry action after acknowledged enquiry success. Confirmation retries preserve the successful provider upload intent and do not create another enquiry. The original duplicate guest-upload browser acceptance and new confirmation-recovery browser scenario are separate evidence scopes. Mounted-page recovery does not establish retention/orphan cleanup or complete hosted CRM acceptance. See [upload flow](../media/upload-flow.md).

## Verified continuation — 2026-10-17

Seven combined real mobile CMS/category-photo/catalog/enquiry/sales checks passed. Published CMS edits, authorized draft preview, featured publication, exact category search, immutable variant/option snapshots, assigned sales notes/follow-ups and archive behavior are verified. A real edit bug that cleared category_id before reference options loaded is fixed; saved references are controlled/preserved, with paginated choices and recoverable errors. Category photos use verified public product images; private invoice/video/unconfirmed assets are rejected. Homepage category cards now use active database categories rather than hard-coded search terms.

Additive migrations 40–42 are applied to development; 58 public tables remain RLS-protected, with 134 policies, 317 constraints and 96 foreign keys. Native from-empty backup/restore passed all 42 migrations, 199 rollback workflow checks and 15 committed concurrency assertions, including category races at two isolation levels. Earlier failed fixture assertions remain recorded as failures. Current unit/integration evidence: 131 tests / 38 files. Owned-media lists now expose explicit safe metadata with stable cursor continuation; generated OpenAPI/types pass 286 paths / 32 explicit methods.

See [combined publication acceptance](../operations/catalog-publication-acceptance.md) for exact scope and retained fixtures. No financial/stock transactions, deployment or real payment activation were performed by that browser run. Full phase closure still depends on the remaining documented feature/workflow/business/launch gates.

## Live CRM Browser Acceptance — 2026-10-17

A complete 5-check live browser acceptance run (`npm run test:crm-browser`) passed with real browsers, real Supabase DB/Auth, real Cloudinary signed private uploads, and scheduled notification dispatch:
1. **Guest enquiry + Private reference**: Guest browser creates an enquiry on `/contact` with sharp PNG fixture, signs upload token, uploads directly to Cloudinary, confirms with intent (`visibility='private'`, `context='customer_design'`), and receives acknowledgment.
2. **Access denial**: Anonymous callers and other-assigned sales staff receive 401/404 when attempting to access the lead's private media or attachments.
3. **Staff assignment in browser**: Owner signs in, searches `/admin/leads` for the enquiry, and assigns generated sales staff via the browser UI.
4. **Sales staff workflow & private media delivery**: Assigned sales staff signs in on mobile browser, views lead details, posts an internal note, requests private image delivery (expiring 300s token), downloads verified bytes, and transitions status to `CONTACTED`.
5. **Follow-ups & reminder dispatch**: Scheduled due/future/completed follow-ups verified. Internal reminder dispatcher requires `CRON_SECRET` (401 for anonymous/sales), processes due reminders exactly once, creates notifications for sales staff, and proves idempotent retries process 0 additional reminders.
- **Fixture Lifecycle**: Lead marked `LOST`, follow-ups completed, private assets retained in immutable audit, generated test identities retired from Supabase Auth. Verified evidence recorded in `test-results/crm-browser-latest.json`.