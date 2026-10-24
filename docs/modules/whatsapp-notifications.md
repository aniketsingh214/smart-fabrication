> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (live/local); engineering complete

# WhatsApp & Notifications

## Source specification

- **Functional scope:** Direct call/WhatsApp links; internal events for lead, follow-up, quotation, order; optional future automation.
- **Rules / acceptance:** No unsupported promise of WhatsApp message delivery; notification delivery audit.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Direct WhatsApp integration: Deep-linked `https://wa.me/` URLs with URL-encoded messages prefilling customer inquiries from the catalog, project cart (`/cart`), and mobile sticky action bar.
- In-app notification engine: `notifications` table capturing alerts for new leads, follow-up reminders, quotation status changes, and order progress.
- Cursor pagination: Deterministic `created_at`/`id` cursor pagination for notification history without artificial result caps.
- Idempotent mark-read: Updates `read_at` timestamp preserving the original read moment; unauthorized reads return 404.
- Automated reminder runner: `/api/v1/system/reminders/dispatch` executes follow-up notification dispatch under `CRON_SECRET` protection.

## Verification record — 2026-10-18

Verified in Notifications & CRM browser acceptance suites (`npm run test:notifications-browser`, `npm run test:crm-browser`, `npm run test:reporting-audit`):
1. Notification cursor pagination across desktop and mobile viewports verified (10/10 checks passed).
2. Mark-read timestamp preservation and concurrent retry safety verified.
3. Automated reminder dispatcher delivery under `CRON_SECRET` verified.
4. WhatsApp pre-filling and direct phone dial actions verified across public and mobile action components.
