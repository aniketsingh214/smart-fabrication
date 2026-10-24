> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Suppliers/Vendors

## Source specification

- **Functional scope:** Shop/name/mobile/address/GST if applicable, supplied materials, opening balance, purchases, payments, outstanding.
- **Rules / acceptance:** Duplicate supplier check, financial history, restricted contact access.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Supplier model: `suppliers` table with `name`, `shop_name`, `phone`, `email`, `address`, `gst_number`, `opening_balance_minor`, and active status.
- Statements & balance: Cursor-paginated statement API `/api/v1/suppliers/{id}/statement` aggregates purchases, goods receipts, returns, credits, and payments.
- Duplicate prevention: Phone number uniqueness and GST format validation.
- Role boundaries: Contact and financial details restricted to `owner` and `accounts` roles; production and content roles denied access.

## Verification record — 2026-10-18

Verified in Phase 13 & 17 acceptance (`npm run test:procurement-browser`, `npm run test:finance`):
1. Supplier creation and profile updates verified.
2. Keyset pagination on supplier ledger statements verified.
3. Supplier payables reconciliation across receipts, credits, and payments verified.
4. Access control matrix and RLS denial for non-finance roles verified.
