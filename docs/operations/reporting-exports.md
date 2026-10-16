# Filtered reports and complete CSV batches

Updated 2026-10-15. Read alongside [refund/period rules](refunds-periods.md) and [verification evidence](../testing/evidence.md).

`/admin/reports` filters up to 366 days using India business dates. Charts show lead sources, the top ten product labels by enquiries, orders created by month (all states), received purchase invoice totals and net recorded customer cash. Unavailable domains are omitted instead of being displayed as zero. SQL RLS and domain permissions still apply; cash is not recognized profit. Bars are scaled within each chart; negative net cash uses grey bars.

Customer receivables, supplier payables and worker balances use 25-row live pages with stable UUID cursors. APIs `/api/v1/finance/receivables`, `/payables` and `/workers` accept `limit` (1–100) and `cursor`; responses preserve the page array in `data` and expose `meta.nextCursor`. A final page has a null cursor. Finance read plus the relevant orders/purchases/workers read permission is required. Negative supplier outstanding is explicitly labelled as credit/refund due. Refresh starts again from the first page.

CSV exports now return bounded batches rather than a single nominally 5,000-row file. `/api/v1/reports/{resource}/export` accepts `limit` (1–500, default 500), opaque `cursor`, optional `from`/`until`, and supported `q`/`status` filters. `X-Next-Cursor` and `Link: rel=next` identify the next batch; `X-Export-Row-Count` is the actual returned count. No next cursor means the final batch. The service uses an exact RLS-scoped remaining count to detect further records even when the project's returned-row cap is below the requested batch size.

The website export button downloads a numbered batch, offers the next batch when available, and indicates when all batches are downloaded. Resource-list exports retain active text search. Report-page exports retain the selected date interval. Financial corrections use posting date, expenses use expense date, purchases use bill date, withdrawals use withdrawal date and other resources use record creation timestamps. CSV formula-injection protection is retained.

These are live reports, not a transactionally frozen cross-file snapshot: records can change between pages. Exact-count performance, multi-user load, immutable export snapshots, historical report PDFs and full all-role/export acceptance remain hardening work. The local pre-release export contract changed from an unpaged target to cursor batches; API clients must follow continuation metadata rather than treating the first file as complete.
