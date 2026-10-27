# Table sorting

Updated: 2026-10-26. Scope: all eight existing table renderers; no business records rewritten.

## Behaviour

Click a data-column heading for ascending order; click again for descending. Arrow icons and aria-sort announce the current direction. Keyboard Tab/Enter/Space work through native buttons. Serial numbers and action columns remain ordinal/action controls. Changing a column or direction resets to page one. Switching related-resource tabs remounts the child list, clearing incompatible sort/filter/cursor state. Form footer positioning is scoped to forms so record tab panels cannot cover the tab controls. Search, page size, previous/next and refresh retain the selected sort in the current screen. A full navigation/reload restores the original screen order.

- All 45 shared resources, including related-record lists: sorting happens in PostgreSQL before the page limit, with the record UUID as a deterministic tie breaker. Only visible column keys plus created_at are accepted. Amounts, quantities, booleans and dates use their database types. Nulls are last in either direction. Existing permissions, projections, context filters and RLS remain authoritative.
- Staff: account/status use database keyset paging; roles use sorted, alphabetically aggregated role IDs across the permitted staff dataset. Notifications sort name/creation/read timestamp on the server. Read status uses read_at: ascending groups Read before Unread, descending groups Unread before Read; timestamps order within the Read group.
- Inventory and permission matrix: the complete permitted snapshot is sorted before local pagination. Inventory stock-level sorting groups its boolean reorder condition; permissions can sort by permission name or whether a role has that grant.
- Receivables, payables and worker balances: read-only database sorting over all derived balances, numeric minor units, stable source-ID ties, bounded offset pages. Supplier statement sorting also runs over all posted events; existing all-time summary totals are unchanged. Type and reference are separate sortable columns.
- Dashboard samples and calculator/preview material breakdowns: sort only the explicitly displayed snapshot, using raw timestamps/amounts/quantities. Dashboard samples remain samples, not complete activity lists.

## API/mobile contract

Supported collection routes accept sort=<visible_column>&direction=asc|desc. Explicit-sort calls default to descending if direction is omitted; UI first clicks explicitly request ascending. Follow meta.nextCursor unchanged; never construct a cursor. Switching sort invalidates its cursor and requires starting without cursor. Old date/UUID cursors work when sort is omitted. Resource keyset cursors bind column/direction; report cursors additionally bind report/supplier. Query/filter scope always applies before page selection.

Examples:

- GET /api/v1/admin/products?sort=price_min_minor&direction=asc&limit=25
- GET /api/v1/admin/leads?sort=name&direction=desc&limit=25
- GET /api/v1/admin/users?sort=roles&direction=asc&limit=25
- GET /api/v1/finance/payables?sort=outstanding_minor&direction=desc&limit=25
- GET /api/v1/admin/suppliers/{id}/statement?sort=delta_minor&direction=asc

Invalid sort keys/directions/cursors return 422. Server literals are quoted/escaped before constructing PostgREST keyset filters. Public visibility filters and authenticated parent scoping are preserved. CSV exports retain their separate chronological export contract; these table controls do not change export order. Customer card lists are not tables and keep their existing pagination contract.

## Database/security

Forward-only migration 50 adds sorted_report_page, SECURITY INVOKER, with fixed source queries, allowlisted identifiers/directions and explicit domain guards. Anonymous/public execute is revoked. Authenticated execution still requires users.read for staff, or finance.read plus the source-domain read permission for reports/statements. No table grant, RLS policy, money formula or posting rule changes. Old report/statement RPCs remain intact. Report offsets are bounded at 100,000 and page size at 100. Concurrent data changes can move offset boundaries; this is a live list, not an immutable export snapshot.

## Verification

Automated unit/integration coverage: typed numeric sorting, natural snapshot text ordering, nulls last, sort toggling, cursor mismatch rejection, filter punctuation escaping and accessible heading state. Full resource-column database comparison and browser acceptance are maintained in scripts/test-table-sorting.mjs (npm run test:table-sorting). Results and actual run status are recorded in docs/progress.md; screenshots/reports go to ignored test-results. Test accounts are generated and retired; tests do not post financial/stock transactions.

Verification note: the wider workspace browser script passed navigation, relationship API and denied-context checks, then stopped on a legacy root-dialog expectation after the separately committed record-details-as-page change (a065a84). That broader script was not counted as a complete pass. Sorting-specific browser checks cover the current lists independently.

Final scoped checks: production build, 255 unit/integration tests in the full run and 23 relevant tests after the tab correction; local browser header/pagination/refresh/mobile inventory checks and the related-tab reset check passed. Child-tab list responses are mocked to isolate client state; real contextual API permission/filter checks are covered separately. All 362 resource/database comparisons completed across resumed runs. Live cursor/staff/notification checks passed; a broader live finance comparison was interrupted by a stale direct test-database connection and was not counted as passing. Test requests now have bounded GET retries and direct-database read timeout/keepalive; the stalled generated test account was verified and retired.

Live completion (2026-10-27): release d839e39 correction confirmed in the served stylesheet. All three deployed-browser checks passed: sorted heading/cursor reset/refresh; numeric inventory sorting before pagination and mobile sizing; related-tab state reset. Evidence: ignored test-results/table-sorting-live-browser.json. The related product is read through the authenticated browser API; mocked child collections verify only client state and perform no business writes.
