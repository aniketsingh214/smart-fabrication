# Catalog, supplier statements and expense corrections

Updated 2026-10-15. Local development scope; no GitHub push or hosting activation.

## Catalog

Manage products, product variants and product options under Website. Variants have unique SKUs, optional integer millimetre dimensions, colour/finish and indicative price ranges. Options have a group, name and indicative extra cost. Archive records to retain history.

Product details include a private preview link and a duplicate form requiring a new name, SKU and URL slug. Duplication is transactional and idempotent: it copies product details, image links and unarchived choices into a new draft; all copied choices start as drafts. It does not copy BOM/pricing rules. Configure and review those separately before publication. Private preview requires `catalog.read`; duplication requires `catalog.write`.

Public product pages and `GET /api/v1/products/{id}/configuration` include only published choices under a published parent, even when the caller is staff. A draft parent remains hidden. Choice CRUD APIs remain authenticated; private preview is `/api/v1/admin/products/{id}/preview`. Duplication is `POST /api/v1/products/{id}/duplicate` or its admin equivalent with a UUID `Idempotency-Key`. Retry unchanged requests with the same key; conflicting reuse is rejected.

Video uploads, weight/design metadata and structured choice enquiry snapshots are implemented; complete live publication/customer acceptance remains. Indicative option prices do not automatically change authoritative quotation totals.

## Procurement

Open a purchase item to return received material. Enter a quantity and reason. The server checks received status, previous returns, unreserved stock and supplier balances; it atomically posts stock and return history. The immutable Purchase returns resource lists posted corrections. Draft purchase lines cannot be returned. Paid returns create supplier credit. Record an actual received supplier refund separately through Finance corrections; a return itself moves no money.

Open a supplier and load its statement. It shows exact all-time posted invoice, return, payment and outstanding totals, with 25 ledger entries per page. Older entries use an opaque cursor with timestamp, event kind and UUID to handle ties. Totals cover the complete posted history rather than only the visible page. Entry dates reflect record creation; they are not bank settlement dates. Draft bills are excluded. `suppliers.read`, `purchases.read` and `finance.read` are all required.

Statement endpoint: `GET /api/v1/suppliers/{id}/statement?cursor=...` and admin equivalent. Line discount/tax and paid-return/refund accounting are implemented; invoice attachment acceptance remains pending. See [refund and period policy](refunds-periods.md).

## Expense reversals

Finance → Expense reversals records full corrections of approved expenses. Select an expense, reversal date and reason. `finance.approve` is required. The server derives the amount and actor; clients cannot change them. Only one reversal is allowed per expense. UUID idempotency keys preserve retries; source, date, reason and actor must match. Original expenses and reversal history remain immutable.

A reversal date must be on/after the source expense date and no later than today's India date. Period reports separately expose gross approved expenses, reversals recorded in that period and net operating expenses. A correction in a later period does not rewrite the original period and can make a later period's net expense negative. This correction does not record a cash refund or change customer/supplier/worker payments.

Payment/labour/withdrawal/earning reversals, supplier refunds, full pre-production customer refunds and reviewed closed periods are implemented. WIP, tax reconciliation, depreciation, post-production refunds and accountant-approved P&L remain incomplete. Do not treat the provisional report as final accounts.

See [phase audit](../progress.md), [API contract](../api/openapi.yaml), [database metadata](../database/schema-dictionary.md) and [verification evidence](../testing/evidence.md). Browser form payload checks simulate responses after real login; SQL tests verify the actual permissions and transactions using rollback-only fixtures.

