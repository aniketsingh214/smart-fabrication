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
