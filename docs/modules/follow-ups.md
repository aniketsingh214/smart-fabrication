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

## Action fixes - 2026-10-28

Shared record actions keep the current detail page and reload latest status/version. Follow-ups now expose assignment correction and field-level inactive-staff errors; role/database restrictions remain intact. Lower dashboard metrics link to explicitly labelled all-permitted record lists. Validation and verification scope: [progress](../progress.md).

### 2026-10-29 Sales relationship/search update

See [Sales workspace audit](../operations/sales-workspace-audit.md). Staff search now follows permitted saved CRM relationships by IDs, contact name, phone and email. Exact context filters, RLS and keyset pagination remain enforced. Customer related tabs include quotations, follow-ups and measurements; lead-context quotations use the linked customer and reject conflicting customer IDs. The separately approved Saloni identity repair changed only that lead customer link, preserving its stage and unconfirmed visit request.

## Five follow-up statuses - 2026-10-31

Add/Edit follow-up forms and API validation accept pending, processing, working, delay and completed. Dropdown labels include English and Hindi; saved values remain lowercase stable identifiers. Migration 202610310056_follow_up_statuses.sql expands follow_ups_status_check without changing existing rows, permissions or assignment guards. The existing pending-only reminder/dashboard/lead filters keep their explicit pending meaning; this change adds workflow choices and does not redefine those filters.

The API OpenAPI contract and generated mobile types include the five-value enum. Focused create/update validation and a rolled-back database fixture verified all five valid states and rejection of an invalid state. Migration 56 was applied with its checksum tracked. The general migration runner stopped at pre-existing migration 55 policy drift (staff_delete already exists on product_media); that unrelated policy/migration was left untouched, and only requested migration 56 was applied transactionally. No existing business records were changed.
