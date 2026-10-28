> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Quotations

## Source specification

- **Functional scope:** Lead conversion, versioned line items for material/labour/finish/hardware/transport/installation/other/discount/tax, PDF, send link, accepted/rejected/expired.
- **Rules / acceptance:** Quote snapshot, expiry, revision, authorized approval, idempotent convert-to-order.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Quotation data model: `quotations` table linked to `leads` with versions tracked in `quotation_versions` and itemized costs in `quotation_items`.
- Price calculation: Exact decimal rounding for material, fabrication, finish, hardware, transport, installation, discounts, and GST tax (CGST + SGST or IGST).
- Immutability: Every approved version is immutable; updates create a new version draft without overwriting prior records.
- PDF generation: Server-rendered PDF via `@react-pdf/renderer` generates on-demand `%PDF-` documents for current and historical versions with `private, no-store` caching headers.
- Customer link: Direct link `/account#quotation-{id}` enables authenticated customer to review line items, download versioned PDFs, and accept or reject.
- Idempotent conversion: Accepted quotes convert to orders via `/api/v1/quotations/{id}/convert`; duplicate conversion attempts return the existing order ID without creating duplicate orders.

## Verification record — 2026-10-17

Verified in Phase 11 Quotation Lifecycle & Customer PDF acceptance (`npm run test:quotation-browser`, artifact: `test-results/quotation-browser-latest.json`):
1. Draft quote and draft PDF privacy protection verified (404/401 for unauthorized callers).
2. Immutable version snapshots (v1 and v2) and exact discount-before-tax calculations verified.
3. Historical and latest version PDF generation and download verified.
4. Customer approval, PDF access, and cross-account isolation verified.
5. Revised draft creation, superseding source quote, and separate approval workflow verified.
6. Customer acceptance and idempotent conversion to confirmed order verified.

## PDF alignment and browser links - 2026-10-28

PDF line columns now include unit rate, fixed widths, right-aligned monetary values and a separate right-aligned totals block. Long rows and the totals group do not split across pages. Copy customer link retains /account?quotation=UUID through login; permitted staff redirect to /admin/quotations?record=UUID, while linked customers keep their account view and existing RLS restrictions. This is an authenticated link, not anonymous sharing. Open customer link is available next to the copied value. Tests include a new browser context, requested-record PDF download and 40-row PDF coordinate alignment.
