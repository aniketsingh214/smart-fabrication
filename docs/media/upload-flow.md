# Implemented upload flow

Updated: 2026-10-16. Implemented and tested within the scopes below; full phase acceptance remains open.

1. The API authorizes an authenticated actor or scoped guest-enquiry capability and validates context, format, size and quota.
2. The server issues short-lived signed Cloudinary upload parameters. The browser uploads directly; privileged provider credentials remain server-only.
3. Confirmation verifies provider ownership, type, bytes and context before atomic, idempotent database finalization. Client metadata alone cannot establish provenance.
4. Authorized association endpoints link the verified media ID to a product, lead, purchase or evidence record. Upload does not itself publish or change financial totals.
5. Sensitive media uses authorized expiring delivery. Private invoice PDFs use attachment download, never public product delivery.

Images are limited to 10 MB. Product videos accept MP4/WebM/MOV, at most 100 MB and 120 seconds. PDFs are limited to owned private invoices, at most 10 MB. Other contexts reject PDFs; guest capabilities cannot upload product media or invoice PDFs. Migration 39 and the API policy enforce these distinctions.

Six real browser/provider checks passed for image, video and private PDF upload/confirmation/delivery; generated assets/accounts were removed. Four real guest-enquiry checks previously verified private reference association and capability boundaries. Native and cloud rollback SQL evidence is tracked separately in [test evidence](../testing/evidence.md).

Remaining: complete purchase and delivery/installation browser association journeys, retention/orphan cleanup execution, approved consent/retention rules and managed provider recovery. See [progress](../progress.md), [policy](media-policy.md) and [retention](asset-retention.md). Provider uploads can precede failed confirmation, so automatic orphan cleanup must not be claimed complete.

## Guest reference confirmation recovery — 2026-10-16

After an enquiry is acknowledged, a failed optional reference upload exposes Retry reference image on the success screen instead of requiring another enquiry. Once the provider returns upload success, the task retains its intent and retries only confirmation; it caches verified success and blocks concurrent calls. The guest capability is sent only to the application signing/confirmation endpoints, never to the provider. Two focused tests cover lost confirmation, exact retry, capability scope, invalid files and concurrency.

Recovery is mounted-page scope. Closing/reloading loses the file/task. An ambiguous provider-upload response before confirmed upload success is not claimed to have durable exactly-once recovery; capability expiry/quotas and orphan retention still apply. No API or database authorization rule changed. Browser recovery testing uses intercepted APIs; provider/database live evidence remains separately scoped.

## Verified continuation — 2026-10-17

Seven combined real mobile CMS/category-photo/catalog/enquiry/sales checks passed. Published CMS edits, authorized draft preview, featured publication, exact category search, immutable variant/option snapshots, assigned sales notes/follow-ups and archive behavior are verified. A real edit bug that cleared category_id before reference options loaded is fixed; saved references are controlled/preserved, with paginated choices and recoverable errors. Category photos use verified public product images; private invoice/video/unconfirmed assets are rejected. Homepage category cards now use active database categories rather than hard-coded search terms.

Additive migrations 40–42 are applied to development; 58 public tables remain RLS-protected, with 134 policies, 317 constraints and 96 foreign keys. Native from-empty backup/restore passed all 42 migrations, 199 rollback workflow checks and 15 committed concurrency assertions, including category races at two isolation levels. Earlier failed fixture assertions remain recorded as failures. Current unit/integration evidence: 131 tests / 38 files. Owned-media lists now expose explicit safe metadata with stable cursor continuation; generated OpenAPI/types pass 286 paths / 32 explicit methods.

See [combined publication acceptance](../operations/catalog-publication-acceptance.md) for exact scope and retained fixtures. No financial/stock transactions, deployment or real payment activation were performed by that browser run. Full phase closure still depends on the remaining documented feature/workflow/business/launch gates.