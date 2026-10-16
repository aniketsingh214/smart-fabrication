# Purchase pricing, manual refunds, corrections and closed periods

Local development implementation, 2026-10-15. These operations record reviewed workshop transactions; no payment gateway or bank transfer is activated.

## Purchase line pricing

Draft purchase lines accept INR discount, percentage tax and an explicit recoverable-input-tax flag. Subtotal is rounded quantity × unit rate, discount is subtracted, and tax is rounded on that net amount. Receipt freezes net, tax, invoice and inventory values. Tax is capitalized into inventory unless staff explicitly selects recoverable input tax. The software does not determine legal tax eligibility or file GST returns; workshop/accountant review is still required.

Exact signed `book_value_minor` preserves stock valuation when per-unit rounding cannot represent the line amount. Legacy movements retain their original bytes and fall back to rounded quantity × unit cost. Outbound consumption/adjustment/return value is derived from the current weighted pool, with the final removal taking the remaining exact book value. Unit cost is an indicative rounded rate; use book value for reconciliation. Financial return credit uses the original immutable invoice snapshot. Stock return value and invoice credit can differ; final accounting treatment/variance review remains part of accountant acceptance.

Partial return credits use cumulative rounding: round(original invoice-line total × total returned quantity / original quantity) minus prior credits. A full return reconciles exactly to the original line total including discount/tax.

## Supplier credits and refunds

Returning paid material posts the physical return and creates a negative outstanding supplier balance (credit). It does not silently post cash. Financial corrections → supplier refund records an actual verified repayment, capped at outstanding credit. Partial refunds are supported. Net supplier payments, payable reports and supplier statements reflect refunds and payment reversals consistently. Original payments/returns remain immutable.

## Corrections

Financial corrections supports full customer/supplier/labour payment reversals, full work-entry reversals, owner-withdrawal reversals, supplier refunds and pre-production customer cancellation refunds. `finance.approve` is required. A customer cancellation refund additionally needs `orders.approve` and is restricted to CONFIRMED, ADVANCE_RECEIVED, MEASUREMENT_CONFIRMED or PRODUCTION_PENDING. It refunds all effective recorded receipts and cancels the order atomically. Completed/production-stage returns, partial commercial customer refunds and service/warranty refunds require a separate reviewed policy; they are not implemented by this endpoint.

Reversals correct an erroneous original entry and do not represent an actual cash refund. Refunds require explicit confirmation of the actual bank/cash repayment. Amount/party links for reversals and customer refunds are derived server-side. Supplier refunds alone accept an explicit capped amount. Unique references, source uniqueness, actor/payload-aware idempotency and target-row locks prevent duplicate/reused corrections. An already refunded amount cannot also be reversed. Worker earnings cannot be reversed if that would leave payments above net earnings; correct the erroneous payment first.

Pre-production status alone does not authorize cancellation: an active job, existing work-entry history or stock consumption blocks it. Unused active reservations must be released through the authorized inventory workflow first. Cancelled orders cannot receive new jobs, fabrication stages, reservations, consumption or worker earnings. Job-to-order provenance cannot be reassigned to hide historical work. Cancelled orders are excluded from open-order dashboard metrics. Complex cases require a separate reviewed commercial policy.

All correction history is immutable. Post a replacement correct source transaction separately after reversing the erroneous source. Net cash/earning/drawing reports apply corrections in their posting period without rewriting the original period; negative net totals in a later correction period are possible.

## Period closure

Finance period closures lets an approver close through a reviewed past India date. A confirmation and reconciliation reason are required. The date can only advance; today/future closure and UI reopening are unavailable. Nothing closes automatically. Posting and closure share a database advisory-lock protocol to serialize a competing closure; multi-session stress/drill acceptance is still pending.

Closed-period guards cover approved expenses, received purchases, withdrawals, corrections, payments, work entries, purchase returns and stock movements. Backdated writes into closed dates fail. A current-period correction of an older closed record is permitted and preserves the original. Retries that return an already posted result do not create a new closed-period write.

API: `POST /api/v1/finance/adjustments` and `POST /api/v1/finance/periods/close`, each with a UUID `Idempotency-Key`. Read history at `/financial-adjustments` and `/finance-period-closures` (or admin equivalents). The older expense-reversal flow remains supported. See [OpenAPI](../api/openapi.yaml) for schemas and [verification evidence](../testing/evidence.md) for actual results and limitations.

WIP, opening inventory valuation, depreciation, legal tax policy and official accountant-approved P&L remain separate acceptance items.
