> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Customers

## Source specification

- **Functional scope:** Contact info, multiple addresses, enquiry/quotation/order histories, totals, notes, attachments.
- **Rules / acceptance:** Guest leads may exist without auth account; later link identity safely.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Customer data model: `customers` table with `name`, `phone`, `email`, `address`, and optional `user_id` linkage.
- Identity linking: Unauthenticated guest leads link securely to customer accounts upon authentication via matching phone or email without leaking stranger records.
- Aggregated history: Customer directory `/admin/customers` aggregates all historical enquiries, issued quotations, and confirmed work orders.
- Self-service protection: Customer portal `/account` restricts visibility strictly to the authenticated user's own profile and associated orders via database RLS.

## Verification record — 2026-10-18

Verified in Phase 04, 10, 11, and 12 acceptance:
1. Customer record creation and profile updating verified.
2. Guest enquiry conversion and identity linking verified.
3. Cross-customer IDOR protection verified (`test:orders-browser`, `test:quotation-browser`).
4. Keyset pagination on customer receivables verified (`test:reporting-audit`).
