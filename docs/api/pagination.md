> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: implemented for resource lists

# Pagination

Resource lists use `limit` (default 25, range 1–100) and an opaque `cursor`. Read the `data` array and `meta.nextCursor`; null means the last page. Ordering is descending `created_at`, then descending UUID `id`. Keep the same filters when requesting the next page. Invalid cursors return 422.

Supported text-search fields and status filters vary by resource; unsupported search returns 422. Customer order lists use a customer-safe RPC with the same cursor ordering. Computed financial balances use separate UUID cursors (25 default, 100 maximum). Supplier statements use timestamp/kind/UUID cursors. CSV exports use opaque created-at/UUID cursors with at most 500 records per batch and continuation headers. See [complete export rules](../operations/reporting-exports.md). Snapshot consistency, large-data performance and full all-role export acceptance remain pending.


## Notifications

`GET /api/v1/notifications` uses the same 25-default / 100-maximum cursor contract: `data` is an array, `meta.nextCursor` is nullable. Rows belong to the current user and contain only id, name, body, read_at and created_at. The admin page provides first/older links. `POST /notifications/{id}/read` preserves an existing read timestamp; unknown or unowned IDs return 404. Conditional updates avoid resetting the first read time on retries. No managed database migration is needed for this change.
