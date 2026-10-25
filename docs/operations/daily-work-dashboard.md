# Daily-work dashboard

Updated: 2026-10-25. `/admin` defaults to **Aaj ka kaam**; **Business overview** is a separate tab. Both use the same RLS-scoped SQL/API contract. No records or financial history were deleted or rewritten.

## Daily action definitions

| Card | Count / matching task predicate |
| --- | --- |
| Nayi enquiries | Visible leads with NEW status; needs initial customer contact |
| Follow-ups due | Pending follow-ups for active leads due before the end of today in Asia/Kolkata; includes overdue work, excludes future days and LOST/COMPLETED leads |
| Overdue label | Follow-up due time is before the response's database as_of timestamp |
| Approval pending | Draft quotation has at least one price version and has not expired; does not imply every draft is ready for commercial approval |
| Aaj ki deliveries | Scheduled/dispatched delivery with scheduled_at inside today's India calendar day |
| Pending installations | Separate pending-job count; no scheduled installation date exists in the current schema, so these are not labeled today's appointments |

Card links select the corresponding server task predicate. The queue returns ten rows per page, full matching count and previous/next continuation. Each Open link targets the exact authorized record via `?record=<UUID>`; guessed/unowned records still fail the normal API/RLS check. Quick actions use `?new=1` and require the existing write permission. Recording a measurement does not schedule a visit.

Business overview groups non-cancelled orders into Confirmed, Production, Ready, Delivery/installation and Completed. Each column shows its complete scoped count and at most three sample records. No order value is described as received payment or outstanding balance. Finance remains in existing finance/report modules. Activity includes visible enquiry creation, quotation creation and order-status history; it is not falsely described as customer-generated payment activity.

## Data scope and limitations

Business is the default, with Demo/Test and All permitted records alternatives. Recognition uses explicit TEST ONLY prefixes, the reserved `@example.invalid` domain and exact UUID-suffixed naming conventions from the shipped finance/delivery/reminder acceptance scripts. Child records inherit available visible parent markers where appropriate. This is read-only marker recognition, not a permanent classification ledger or a certification that unmarked data is genuine. Unknown historic fixtures may still need business review. RLS can hide parent metadata from a restricted role; classification never bypasses RLS to retrieve it. Only permitted domain metrics appear; missing scope returns null, not a fabricated zero. All-permitted view explicitly labels business/test mixing.

Existing lists and finance ledgers are not globally filtered or changed by this dashboard view. Tests remain inspectable; no irreversible ledger cleanup was attempted.

## API, security and migration

`GET /api/v1/dashboard?scope=business|demo|all&task=all|new|followup|approval|delivery&page=1` supports SSR cookies and bearer authentication. At least one operational read permission is required. `page` is bounded 1–10000. Inaccessible metrics are null. DTOs include only task/board/activity identifiers, labels, times, statuses and relative drilldown URLs—no contact addresses, private financial values or actor tokens. Anonymous/customer/disabled callers are denied. OpenAPI/types cover the response.

Migration 47 adds pure marker recognition and the read-only SECURITY INVOKER dashboard function. Existing RLS policies, tables and historical values are unchanged. India-day boundaries and all displayed data are evaluated against one database response time.

## Verification

- 188 unit/integration tests across 46 files passed; seven new API/rendering checks cover defaults, invalid filters, denial propagation, safe DTOs, null permissions and drilldowns.
- 12 SQL/RLS checks passed in a rollback-only candidate rehearsal and again on the applied function. Synthetic user/workflow fixtures rolled back. One intermediate rerun had a database connection reset; it was not counted as passing and the bounded rerun passed.
- Six real owner Auth/browser/API checks passed: default daily tab/scope, matching card/list count, order board at desktop/mobile widths, explicit demo view, exact record/new-form links and anonymous denial. Generated test login retired; no business records written.
- Production verification also completed all six functional browser checks. The final Auth ban request lost its response and the raw run remains recorded as failed; read-only reconciliation confirmed the generated account is disabled, has zero owner-role grants and is banned. No test or real owner was left with privileged access. This reconciliation does not rewrite the original failed transport result.
- Build/TypeScript, API contract checks and targeted lint passed. Separate legacy/full-project checks retain their earlier scope; these results do not establish accounting sign-off or production-load certification.
