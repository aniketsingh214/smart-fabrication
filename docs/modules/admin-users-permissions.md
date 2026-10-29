> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Admin Users & Permissions

## Source specification

- **Functional scope:** Super Admin, Sales, Production, Accounts, Content; per-module read/write/delete/approve/export.
- **Rules / acceptance:** Role matrix, revocation tests, audit privilege changes.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.

## Current implementation contract — auth reliability follow-up

Routes: /login, /auth/callback, /reset-password, /account and /admin/users. Browser auth uses Supabase email/password and SSR cookies; mobile uses bearer tokens validated in requestContext. GET /me exposes a narrow profile/customer DTO. Staff roles/status and role grants have protected /api/v1/admin endpoints; server/database checks remain authoritative.

RoleEditor and PermissionEditor catch network/non-JSON failures, display an alert, guard simultaneous calls and always release busy flags. QuoteResponse has the same failure recovery. Sign-out checks the SDK result before navigating. Login submissions preserve inputs after handled failure, disable mode changes while busy, use a POST fallback and remain disabled until client hydration. No role, RLS or authorization policy was relaxed.

Verification and remaining scope: see [completion audit](../operations/completion-audit.md). Natural token expiry, real email/password-reset delivery, complete object/write permissions and staff-list pagination remain outstanding. Temporary test owner grants belong only to generated fixture identities; real-owner credentials are never used.

### Staff collection update — 2026-10-16

GET /api/v1/admin/users now returns the same data array with meta.nextCursor, stable descending created_at/id ordering, limit 1–100 (legacy default 100) and an explicit safe DTO including created_at. /admin/users requests 25 records and provides first/older links. Lead assignment can load more staff instead of truncating at the initial collection; failures are visible. Existing permission checks and protected roles are unchanged. Three focused service tests verify continuation precision, default/final page and invalid pagination/access failures. Real auth/role-control failure recovery was verified by the six-check reliability run; expanded paging/sign-out browser checks are recorded separately.

## Expanded role matrix — 2026-10-16

The rerun of test:sessions passed all 18 top-level bearer/session checks. Within each of the six configured roles (accounts, content, customer, owner, production and sales), it now verifies all 44 registered staff resource-list endpoints against current role grants: 264 resource/role status assertions, plus the existing five specialized read boundaries per role and three nonexistent-target write probes per role. Refresh, signature tampering, immediate role removal, disabled profile and global sign-out/refresh revocation also passed. Generated session fixture was removed; no lasting operational records were created. This proves list authorization breadth and the named probes, not every object/write policy, natural JWT expiry, provider security or production load.

## Admin collection presentation ? 2026-10-25

Staff and notification collections use serial/action tables and bounded reversible cursor paging. Staff trash opens account-disable controls and preserves identity history; owner protections remain server enforced. Role-matrix search/pagination does not change grants. See [admin table workflows and validation](../operations/admin-list-workflows.md).

## Navigation update - 2026-10-26

The eight-entry sidebar, section directories and parent-record tabs replace the long resource menu. All legacy routes and role boundaries remain available. See [full mapping and verification](../operations/admin-workspace-navigation.md).

## Request rate limits - 2026-10-26

Auth forms now use same-origin POST /api/v1/auth/form, with shared IP and email-attempt quotas; password update requires an active verified session. Authorized record/profile/permission mutations also consume per-actor quotas. Existing disabled-user checks, owner protections, CSRF and RLS remain authoritative. Service-role access is limited to the isolated quota RPC, not business operations. See [complete limits and runtime verification](../security/rate-limits.md).

## Table sorting follow-up - 2026-10-27

Staff account/status/roles lists sort on the server before pagination. Roles are alphabetically aggregated under users.read with invoker rights; the API keeps the existing safe profile DTO. The complete permitted permission matrix sorts by permission ID or role grant before its 25-row pages. Sort headers expose aria-sort and keyboard controls; source permission mutation protections are unchanged. See [sorting contract and checks](../operations/table-sorting.md).

## Inline validation - 2026-10-27

Account/profile/password and shared admin forms display validation below the input in red. API field paths are form-scoped; credential errors retain the generic email/password wording. Permission, session, quota and unknown transaction failures retain form-level feedback. See [form validation](../operations/form-validation.md).

## Royal Gates workspace presentation - 2026-10-28

Primary/contextual navigation and account controls use the shared gold/charcoal design system, local Font Awesome decoration and locally hosted English/Hindi fonts. The eight-entry mapping, permission filtering and mutation guards are unchanged. See [visual contract and responsive coverage](../operations/royal-design-system.md).

## 2026-10-28 - Emblem-only branding and account navigation refinement

- Removed the added brand name/tagline next to or below the shared logo in public header, footer, admin sidebar and authentication branding. Supplied image artwork is unchanged.
- Replaced inline admin sign-out with an accessible account dropdown: account, permitted Settings/Staff links and sign-out. Public account dropdown includes account, saved designs, cart and a staff workspace link only for authorized users. Guest menus omit staff and sign-out actions.
- Compacted sidebar branding and navigation, balanced emblem sizes, refined topbar/header spacing and retained the charcoal/gold design and shared English/Hindi typography.
- Dropdown supports click, Tab navigation, Arrow Down entry, Escape with focus restoration and outside-click dismissal. Mobile dropdown bounds checked at 320px and 390px.
- Validation: targeted ESLint, TypeScript and production build passed. Guest browser checks passed. Full responsive browser results are recorded in the design-system operations document.

## 2026-10-29 - Compact mobile header and first-login destination

- Public mobile header now has two compact rows: emblem/wishlist/cart/menu, followed by full-width search. The crowded five-link navigation strip and search-row language control move into an accessible menu disclosure, retaining all links and language selection.
- Menu supports outside click, Escape with focus restoration, keyboard links, nested account disclosure and bounded scrolling on short screens. Desktop navigation remains available.
- Fixed successful password login defaulting every user to /account. Verified profile permissions now choose the dashboard or first permitted workspace; customers retain /account. Explicit safe account/admin return destinations are preserved. A failed profile lookup still navigates to the protected account page after successful sign-in.
- No auth grants, RLS, database schema or business pricing changes. Targeted auth/destination tests and production build passed. Mobile Hindi browser checks passed at 320/390/600/767px; full responsive acceptance tracked separately.
