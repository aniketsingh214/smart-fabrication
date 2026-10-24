> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Activity Log

## Source specification

- **Functional scope:** Actor, timestamp, action, entity, old/new safe fields, request ID.
- **Rules / acceptance:** Append-only, redact secrets/PII, retention policy.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Audit model: `audit_events` table capturing `actor_id`, `action`, `resource_type`, `resource_id`, `diff`, `ip_address`, `created_at`.
- Immutability: Database triggers reject `UPDATE` and `DELETE` queries on `audit_events`, ensuring tamper-evident history.
- Redaction: Passwords, bearer tokens, API keys, and private customer documents are excluded or redacted prior to insertion.
- Access control: Strictly accessible only by users with `audit.read` permission (`owner` role).

## Verification record — 2026-10-18

Verified in Phase 18 Dashboards, Reports & Audit acceptance (`npm run test:reporting-audit`, artifact: `test-results/reporting-audit-browser-latest.json`):
1. Automated audit event generation upon state transitions and critical writes verified.
2. Immutability guards preventing updates or deletes to audit rows verified.
3. Owner-only audit review interface on `/admin/audit` verified.
