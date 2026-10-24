> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Settings

## Source specification

- **Functional scope:** Workshop details, logo, contact, address, hours, GST if applicable, delivery areas, installation, taxes, enquiry, WhatsApp, security.
- **Rules / acceptance:** Version and audit configuration; protect sensitive values.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Settings model: `workshop_settings` table key-value/document store with workshop branding, contact numbers, workshop address, operating hours, GST registration details, and delivery radius settings.
- Security & access: Only users with `settings.write` permission (`owner` role) can modify system configurations.
- Audit logging: Every setting modification is recorded in `audit_events` with previous and new values.
- Public projection: Public routes read only safe workshop details (branding, address, public contact phone, working hours) without exposing operational secrets.

## Verification record — 2026-10-18

Verified in Phase 02, 06, 18 acceptance:
1. Workshop branding and contact retrieval on public site verified.
2. Owner-only permission guard for configuration updates verified.
3. Audit trail generation for settings mutations verified.
