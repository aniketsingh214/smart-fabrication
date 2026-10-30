# Lead collection filters

Implemented 2026-10-30 on the existing Leads collection and customer-context enquiries.

## Behavior

Quick creation-date presets: All leads, Today, Yesterday, Last 7 days (today plus six prior calendar days), This month (calendar month), Custom dates. All boundaries use Asia/Kolkata. A custom range includes both selected dates; the backend applies an inclusive start and exclusive next-day end in UTC. Both dates are required, real dates must be valid, and From must not exceed To.

The Filters dialog provides creation dates, lead status, assigned staff, source and pending follow-up. Options are drafts until Apply; Cancel/Escape leave the list unchanged. Reset selections resets the draft. Desktop uses a centered modal and small screens use a bottom drawer with scrolling. Applied filter chips remove individually; Clear all also removes search/sort and resets pagination.

Assigned staff supports the verified actor (`me`), unassigned, or a specific staff UUID. Staff options are fetched only through the existing permitted staff API, with pagination, active owner/sales filtering and retry. Roles without `users.read` retain me/unassigned and do not receive a staff directory. Lead RLS remains authoritative even for a selected UUID.

Sources match stored values: google, instagram, facebook, whatsapp, direct, referral, other. Website enquiries currently use direct; the UI says **Direct / website**, without inventing a separate source or reclassifying records.

Follow-up today means an actual pending follow-up due in today's India calendar day. Overdue means an actual pending follow-up with due_at before now, including earlier today. These filters can overlap and are independent of lead creation dates. Completed follow-ups are excluded; multiple matching follow-ups do not duplicate a lead. All selected filters combine using AND.

No matches shows “No leads match your filters” with clear/change guidance. This also fixes status-only empty results previously shown as “No leads yet”. Filtering never changes stages, assignments, appointments or stored customer data.

## API and URL

GET `/api/v1/admin/leads` accepts `date=all|today|yesterday|last7|month|custom`, `from=YYYY-MM-DD`, `until=YYYY-MM-DD`, `assigned=me|unassigned|UUID`, `source`, `follow_up=today|overdue`, plus existing q/status/context/sort/direction/limit/cursor.

Preserve these parameters on cursor requests. Clear/change resets the cursor. Filters apply before sorting and keyset pagination, not just to the loaded page. Date/staff/source/follow-up requests use the security-invoker filtered_sales_leads RPC; relational search, status and exact parent-context constraints still intersect. Invalid filters return 422. No new public/customer read grant was added.

The CSV lead export uses the same filter parser/RPC and status/search intersection. Existing CSV permission and continuation rules remain. Browser URL state uses the Next.js supported native replaceState integration for filter/search changes, preserving mounted input/drawer state without a duplicate server remount. Record/create/edit links include applied filters; refresh reconstructs filters from URL parameters.

## Files and validation

- Contract/date conversion: src/contracts/lead-filters.ts; unit tests cover India midnight, leap years, year boundaries and invalid combinations.
- Read-only DB functions: additive migrations 53/54. Migration 54 refines overdue to the actual current timestamp. Existing applied migrations remain immutable.
- Backend list/export: operations/services.ts and reports export route; tests cover combined search/status/context and invalid input.
- UI: features/leads/lead-filters.tsx, ResourceWorkspace, admin module page and scoped admin CSS.
- Rollback database fixture: scripts/test-lead-filters-db.mjs covers boundaries, actual follow-up membership, assignment/source, deduplication and role denial.
- Browser: scripts/test-lead-filters-browser.mjs covers API/CSV parity, URL/clear/chips, custom validation/cancel, related-record return, keyboard behavior and six viewport widths. Real business records are read-only; generated test identities are retired.

Actual acceptance outcomes are recorded in [progress](../progress.md).
