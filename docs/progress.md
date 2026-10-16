> Version: 0.4 | Updated: 2026-10-16 | Status: local implementation and acceptance in progress

# SmartFabrication progress

All 20 phases are preserved. All phases are not complete. Implemented code, verified checks and outstanding business/launch requirements are distinguished below.

## Authorized operating scope

Continue implementation and tests without repeated phase approval. The user's local-only instruction remains in effect: no GitHub push, Vercel deployment or real payment activation has occurred. Configured development Supabase/Cloudinary integrations are in use. No default/shared administrator or real owner's password/session is used in testing.

## Current verified state

- Live schema: 58 public tables, all with RLS enabled; 134 policies; 39 applied immutable migrations. See [schema dictionary](database/schema-dictionary.md) and [migration ledger](database/migrations-log.md).
- Finance: purchase discount/tax, exact stock book values, paid-return supplier credits/manual refunds, immutable corrections, pre-production full customer refunds, reviewed period closure and current operational reconciliation.
- Catalog/customer: verified images/product videos, weight/design fields, published variants/options in immutable enquiry snapshots, customer-safe quotation/order pages and direct owned-quotation links.
- Procurement: private image/PDF invoices, verified upload, expiring attachment download and paginated association/history. Complete live purchase-association browser acceptance remains.
- Security: current profile/permission checks, role removal/disable revocation, actor-bound posting retries and immutable-audit lookup for legacy authors. No historical ledger values were rewritten.
- Reporting/mobile: filtered charts, paged balances/CSV continuation, projected resource/customer response schemas and OpenAPI with 286 paths / 32 explicit methods. HTTP resource lists return a data array and meta.nextCursor.

## Verified checks and limits

| Check | Latest evidence |
| --- | --- |
| Real Supabase rollback suite | 186 checks passed on configured development Supabase; test users and business fixtures rolled back |
| Restored local workflow suite | 186 checks passed with all 39 migrations; actual PostgreSQL/RLS, synthetic data and a minimal local Auth adapter |
| Concurrent successful commits | 11 assertions passed: stock deductions/retries, receipt/refund limits/retries and reservation limits; isolated synthetic local database |
| Native restore | Matching row fingerprints, schema/RLS/policies and access checks; offline backup replay plus forward migrations passed; disposable servers stopped |
| Unit/integration/server render | 101 tests across 26 files passed |
| Notification browser | 10 desktop/mobile checks passed with real development users, RLS and updates; only network failure simulated |
| Authenticated browser | 42 desktop/mobile checks passed; real login/read APIs, with operational write responses simulated |
| Live session/read/write boundaries | 18 checks across six configured roles passed; write probes use verified nonexistent targets |
| Real browser media | Six image/video/PDF upload, verification and private-delivery checks passed; generated assets/accounts cleaned up |
| Auth/inventory recovery browser | Ten desktop/mobile checks passed: real auth/staff reads, interrupted stock request restored across reload, same-key retry, permission error recovery and sign-out. Operational writes intercepted |
| Public browser | 24 desktop/mobile checks passed, including About/process and demo-reference enquiry prefill |
| Local read-only load | 60/60 requests at concurrency four; p95 1468 ms on that run, not a production SLO |
| Dependencies | Current production-only audit: zero known vulnerabilities. Full audit: five development lint advisories; see [dependency status](security/dependencies.md) |

Typecheck, lint, build, OpenAPI, documentation and secret scans have passing evidence. Specialized checks and exact limits are detailed in [test evidence](testing/evidence.md). No production capacity, full natural-session-expiry, managed Supabase disaster recovery or accountant-approved profit claim is made.

## Phase audit

| Phase | Scope | Status | Implemented / remaining acceptance |
| --- | --- | --- | --- |
| [01](phases/phase-01.md) | Discovery and traceability | done | Supplied master preserved byte-for-byte; 34 requirements and 31 module baselines mapped. No additional original source document was supplied. |
| [02](phases/phase-02.md) | Architecture, UX, API, ERD | in_progress | One Next.js codebase, API/RBAC/RLS and generated schema metadata exist; final visual ERD and module acceptance synchronization remain. |
| [03](phases/phase-03.md) | Repository and hosting | in_progress | Local application/Git and CI configuration exist; GitHub/Vercel deferred by local-only scope. |
| [04](phases/phase-04.md) | Authentication and RLS | in_progress | Owner account, SSR/bearer, refresh/revocation and six-role read/write probes verified; full object/write matrix, natural expiry and all-device UI acceptance remain. |
| [05](phases/phase-05.md) | Media | in_progress | Real image/video browser/provider/database/private-delivery checks passed; SQL guest expiry/quotas passed locally. Full guest browser journey, retention/orphan handling remain. |
| [06](phases/phase-06.md) | Public website/CMS | in_progress | Responsive pages, CMS/gallery/review moderation, SEO routes exist; actual workshop content, consent/retention policy and publication acceptance remain. |
| [07](phases/phase-07.md) | Catalog | in_progress | Variants/options, video, weight/design fields, preview/copy and enquiry selections implemented; complete live publication/customer journey remains. |
| [08](phases/phase-08.md) | Materials/rates/BOM | in_progress | Versioned rates/BOM/pricing guards verified; actual workshop units/formulas and full history acceptance remain. |
| [09](phases/phase-09.md) | Estimation/measurement | in_progress | Server-authoritative configured estimator and measurements exist; business-approved real formulas and calculation/history acceptance remain. |
| [10](phases/phase-10.md) | CRM/follow-ups | in_progress | Enquiries, assignment/notes, scoped follow-ups and reminder dispatcher/deduplication implemented; hosted scheduling, complete guest attachments and retention acceptance remain. |
| [11](phases/phase-11.md) | Quotations/PDF | in_progress | Immutable versions/revisions, historical PDF selector and owned direct links implemented; workshop terms and full live customer PDF/approval journey remain. |
| [12](phases/phase-12.md) | Orders/tracking | in_progress | Conversion, guarded transitions, customer-safe pagination/timeline and pre-production refund/cancellation implemented; full customer/staff browser journey and post-production commercial policy remain. |
| [13](phases/phase-13.md) | Procurement | in_progress | Discounts/tax, receipts/returns/refunds, statements and private image/PDF invoice association implemented; complete live purchase-association browser acceptance remains. |
| [14](phases/phase-14.md) | Inventory | in_progress | Exact ledger values, partial consumption/release, returns and competing deductions/reservations verified; broader stress/reconciliation and workshop acceptance remain. |
| [15](phases/phase-15.md) | Labour/production | in_progress | Historical rates, jobs/QC, immutable earnings, payment caps and actor-bound retries verified; real-role browser journey and actual allocation/rate acceptance remain. |
| [16](phases/phase-16.md) | Delivery/installation | in_progress | Complete measured quotation-to-installation SQL workflow and private proof/checklist guards verified; full browser/provider journey and service boundaries remain. |
| [17](phases/phase-17.md) | Finance | in_progress | Corrections/refunds, closed periods, stock/job-cost/tax reconciliation implemented; actual opening balances, WIP method, depreciation, tax/accountant approval and post-production commercial refunds remain. |
| [18](phases/phase-18.md) | Reports/audit | in_progress | Charts, pagination, CSV continuation, immutable audit and reminders implemented; full export/role audit, immutable export snapshots and hosted runtime acceptance remain. |
| [19](phases/phase-19.md) | Hardening/launch | in_progress | Native/offline synthetic restore, concurrency, local load and security checks passed; real managed recovery, broader production workload/accessibility/security checks and upstream advisories remain. |
| [20](phases/phase-20.md) | Mobile preparation | in_progress | Resource/customer DTOs, generated types, bearer client, response-layout regression and real session probes exist; specialized DTO examples, native app/offline/deprecation handoff remain. |

## Next outstanding work

Continue specialized API contracts/ownership coverage and remaining workflow acceptance. Actual workshop content/formulas and financial opening figures must come from the business; professional accounting approval cannot be substituted with invented numbers. Production recovery must include managed Auth/provider assets. Deployment remains deferred until the local-only instruction changes.

## Workflow references

- [Finance corrections/refunds/closed periods](operations/refunds-periods.md)
- [Current inventory/job-cost/tax reconciliation](operations/finance-reconciliation.md)
- [Catalog, invoices and session checks](operations/catalog-invoices-sessions.md)
- [Reports and complete CSV batches](operations/reporting-exports.md)
- [Native/offline restore runbook](operations/backup-restore.md)

Native from-empty migration and synthetic backup/restore runs now pass with all 39 migrations. Earlier online schema-export timeouts remain historical failed attempts. No remote business rows were exported or restored. All original requirements remain traceable; implementation progress is not a phase-wide or production-readiness approval.

### Notifications continuation — 2026-10-15

Removed the silent 100-notification cap from the API and admin page using owner-scoped created_at/id cursor pagination. Mark-read retries preserve the first timestamp; unknown/unowned IDs return 404. Browser network errors release the button for retry. Focused integration tests cover cursor continuation, user scoping, limit validation, final-page handling and conditional read updates. Ten desktop/mobile notification acceptance checks now pass against the configured development database: tied-timestamp pagination, older/first links, responsive width, read persistence, four concurrent retries, cross-owner/unknown-ID denial and network-error retry. Only the network-failure probe is simulated. Both generated users and their notification rows were cleaned; audit history remains.



Identity/mobile follow-up: GET/PATCH /me and notification responses have explicit generated DTOs. Identity RPC errors now propagate instead of silently returning empty permissions/customer. TypeScript, lint, 84 tests, production build, API and secret checks passed.


### Completion audit remediation

All 20 existing phase records were re-audited against the preserved master and implementation; completed modules were retained. The separately named completion-plan file is still unavailable at searched locations; see [execution register](operations/completion-audit.md).

Implemented the audited inventory same-key/body retry fix (mounted-form scope), exact paise input, auth/permission/quotation network recovery, checked sign-out and hydration-safe login submission. No database migrations or role/RLS policy changes were made. Five new focused stock regression tests pass; 89 unit/integration tests now pass. Browser reliability acceptance is recorded separately with its real-login/simulated-write boundary. Phase-wide authentication/inventory acceptance remains open.


### Continuation — 2026-10-16

About/process route, footer/sitemap discovery and demo-reference enquiry prefill are verified in the 24-check public suite. Inventory pending requests now persist before dispatch in account-scoped tab storage and restore across reload/navigation; eight stock regression tests pass. Staff page/API and lead assignment have cursor continuation. Current unit/integration count: 95 tests / 24 files. Earlier six desktop/mobile reliability checks passed with real auth/reads and intercepted stock/permission writes; expanded checks are recorded after completion. No migrations, deployment or real financial postings were performed. See [current execution register](operations/completion-audit.md).

