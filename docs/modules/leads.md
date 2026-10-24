> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Leads

## Indian mobile formatting — 2026-10-25

Public/admin mobile fields accept a 10-digit Indian mobile starting 6–9, optional +91/91 or domestic 0 prefix, and spacing/separators. API schemas validate and normalize new/explicitly edited phone values to `+91` plus ten digits. Inputs show a fixed +91 prefix and normalize pasted country codes on blur. Admin lists/details display `+91 98765 43210`; Call and WhatsApp URLs use the canonical number. Invalid legacy records remain unchanged, show `(verify number)` and have no contact links until corrected. No database history or customer number is guessed or bulk rewritten. This validates syntax, not subscriber ownership or OTP verification. Existing exact-string SQL duplicate matching is unchanged; legacy mixed-format duplicates require separate review.

Verification: 174 unit/integration tests across 43 files, production build/TypeScript and API contract checks passed. Real local mobile-browser validation checked valid/invalid inputs and pasted prefixes; an invalid-phone API request returned 422 without creating a lead.

## Source specification

- **Functional scope:** Name, mobile/WhatsApp, email, city/area/address, product, dimensions, material, requirement, uploaded design, source Google/Instagram/Facebook/WhatsApp/direct/referral/other; status, notes, assigned staff, call/WhatsApp, conversion.
- **Rules / acceptance:** Anti-spam, duplicate matching rules, source attribution, follow-up reminders, activity history.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Lead capture: Public guest enquiries via `/contact` and `/estimate` record name, phone, email, dimensions, notes, and optional design reference uploads into `leads` table.
- Source attribution: Captures campaign and origin metadata (`direct`, `whatsapp`, `instagram`, `referral`).
- Staff assignment: Owner and sales managers assign leads to specific sales personnel via `/admin/leads` and `/api/v1/leads/{id}/assign`.
- State transitions: Status progression (`NEW` -> `CONTACTED` -> `QUALIFIED` -> `PROPOSAL_SENT` -> `WON` / `LOST`).
- Notes & communication: Sales staff add timestamped internal notes, initiate WhatsApp chats via click-to-chat links, and schedule follow-ups.
- Guest reference confirmation: Successful upload intent is reused for confirmation retry without creating duplicate enquiries.

## Verification record — 2026-10-17

Verified in Phase 10 CRM acceptance (`npm run test:crm-browser`, artifact: `test-results/crm-browser-latest.json`):
1. Guest enquiry + private reference upload verified.
2. Cross-account access denial for anonymous and unassigned users verified.
3. Staff assignment in browser UI verified.
4. Sales staff workflow, internal notes, and private expiring media download verified.
5. Scheduled follow-up reminders and cron dispatch idempotency verified.
