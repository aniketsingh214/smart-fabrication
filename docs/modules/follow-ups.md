> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Follow-ups

## Source specification

- **Functional scope:** Assigned staff, due date/time, reminder, call/WhatsApp, note, reschedule, completed/overdue.
- **Rules / acceptance:** Timezone handling, permission and notification deduplication.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Follow-up model: `follow_ups` table with `lead_id`, `assigned_to`, `due_at`, `type`, `note`, `status` (`pending`, `completed`, `cancelled`).
- Scheduling & timezones: Dates and times validated in Asia/Kolkata timezone with ISO-8601 formatting.
- Reminder dispatcher: Internal service-role endpoint `/api/v1/system/reminders/dispatch` guarded by `CRON_SECRET`.
- Deduplication: Due reminders processed exactly once using atomic updates; duplicate runs within the same time window process 0 items.
- Notifications: Generates in-app notifications in `notifications` table for assigned sales staff with direct links to the relevant lead.

## Verification record — 2026-10-17

Verified in Phase 10 CRM acceptance (`npm run test:crm-browser`, artifact: `test-results/crm-browser-latest.json`):
1. Creation of scheduled follow-ups with due date and internal notes verified.
2. Status updates (`pending` to `completed`) verified.
3. Reminder dispatcher execution with `CRON_SECRET` protection verified (unauthorized callers receive 401).
4. Idempotent retry processing 0 duplicate notifications verified.
