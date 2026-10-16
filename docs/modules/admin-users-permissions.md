> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

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
