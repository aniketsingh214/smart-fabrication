# Catalog choices, invoice evidence and session hardening

Local implementation follow-up, 2026-10-15. Read [progress](../progress.md) and [test evidence](../testing/evidence.md) for verification status; implementation alone is not acceptance.

## Catalog and enquiries

Products accept optional indicative weight in kg, design code and design details. Draft duplication preserves these fields. Product pages show supplied metadata. Contact forms for published products offer published variants and options. Guests send a variant UUID and up to 20 distinct option UUIDs; the server checks their published parent/child relationship and saves authoritative names/specifications/indicative prices in `leads.configuration_snapshot`. Supplied snapshot or price fields cannot override this. Staff can inspect the snapshot in lead details; updates cannot rewrite it. Final quotation prices remain independently reviewed.

Catalog media supports verified product video (MP4/WebM/MOV, up to 100 MB and 120 seconds). Images remain limited to 10 MB. Videos are public product media only. Invoices also accept private PDFs up to 10 MB; customer designs and proof remain image-only. Link a verified product asset through Product media. Uploading alone does not publish a product or link it into the catalog. Provider format/type/size/duration is checked before atomic database confirmation. Automatic orphan retention/cleanup remains a launch acceptance item.

## Purchase invoice evidence

Purchase details provide a private invoice-image/PDF form. Upload requires `finance.write`; attaching requires `purchases.write` and `finance.read`. The uploader owns the verified private invoice asset unless the attaching approver has `finance.approve`. Reusing the same asset/source/note/actor returns the original attachment; conflicting reuse fails. Source, actor and association history remain immutable. Uploading/attaching does not change bill totals, payments or tax snapshots. Migration 39 restricts PDFs to owned private invoice assets; image/video contexts retain their existing limits. Real browser PDF upload, provider confirmation and expiring attachment download passed; purchase association itself is covered by rollback SQL, with full browser association still pending.

`GET /api/v1/purchases/{id}/attachments` requires purchases and finance read access, returns 25 records ordered by UUID and exposes `meta.nextCursor`; the form can load further pages. `POST` accepts `{media_id,note}`. Retrieve an authorized expiring image URL through the existing uploads endpoint. If upload succeeds but attachment fails, the form retains that verified asset for attachment retry.

## Sessions, reminders and contention

`npm.cmd run test:sessions` uses an isolated fixture to check bearer-only identity, refresh, invalid signature rejection, immediate role-removal denial, disabled-account denial/re-enable and refresh-session revocation after global sign-out. Existing JWTs may remain cryptographically valid until their expiry; sign-out is not claimed to invalidate every issued access token instantly. Current profile/permission checks enforce access changes on each API request. Natural expiry, every role and all-device UI acceptance remain open.

Scheduler dispatch is service-role-only. A test found named API-role execute grants surviving a PUBLIC revoke; migration 33 explicitly removes them and opts future functions out of automatic API-role execution. The scheduler endpoint also rejects malformed credential byte lengths safely. SQL runtime tests exercise due/completed/future reminders and deduplication inside a rollback transaction. Hosted scheduling remains deferred with deployment.

`npm.cmd run test:concurrency` creates generated owner/material metadata for cross-session visibility, then rolls back every posting and closure attempt. It checks material-lock contention, same-key contention, posting/closure serialization, rollback/retry and absence of committed ledger rows. Generated metadata is removed afterward; audit history remains. This bounded test does not certify competing successful commits or production capacity. `test:load` runs 60 read-only local requests at concurrency four and stores timings in ignored test-results; it is a local smoke benchmark.

Historical quotation PDFs accept optional positive integer `version`; omission selects the latest visible version. The query remains scoped to its quotation and caller's RLS visibility. Staff version history links each PDF; filenames include the selected version. Missing/inaccessible versions return no unrelated document.

Synthetic native PostgreSQL restore is now verified: all 39 migrations apply from empty, row fingerprints match after restore, 186 workflow checks and 11 committed concurrency assertions pass. `test:migrations` and `test:restore:offline` use disposable loopback databases without Supabase contact. Managed Auth recovery, provider assets, backup ownership and recovery targets remain launch requirements; no live restore/reset is attempted.


## Catalog and hardening follow-up — 2026-10-15

Twelve session/read-role checks, five contention checks and five real browser media checks passed. Video duration is requested using media_metadata per the [Cloudinary Admin API](https://cloudinary.com/documentation/admin_api). See [test evidence](../testing/evidence.md) for failures found/fixed and fixture cleanup.


Phase 13 continuation (2026-10-16): invoice association retries now retain the exact original asset/note/purchase, block concurrent submission and avoid re-upload. Authorized downloads use a prepared expiring link. Three regression tests pass; total unit/integration count is 104/27 files. Full live browser purchase association remains pending. See docs/phases/phase-13.md for scope and evidence.
