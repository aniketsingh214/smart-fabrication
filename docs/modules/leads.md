> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Leads

## Site measurement visit requests — 2026-10-25

Guest enquiry accepts optional validated preferred date/time, site address and Indian PIN. The server appends these to the private requirement before the existing submit_lead RPC, with a combined 2000-character limit. Staff follow up through the existing assigned-lead workflow. Requests do not reserve or confirm a slot; service coverage and any charge require workshop confirmation. No measurement/order/financial posting is created. See [customer website improvements](../operations/customer-website-enhancements.md).

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

### Visitor contact popup and Call/Message gate - 2026-10-26

Public pages now show an optional welcome popup asking only name and Indian mobile. Close/Escape/Continue browsing dismisses it for the current tab session without creating a lead. Site Call, SMS/email and exact WhatsApp-host links ask for details before continuing when unregistered. React capture covers contact links in header/footer, product/cart/design sections and mobile actions. Successful POST /api/v1/visitor-contact uses the existing public submit_lead RPC and its rate/duplicate rules; records appear in staff-only Leads with city Not provided and an explicit website-contact intent/path in requirement. No separate visitor database or privileged write client was added. A signed, seven-day HttpOnly/SameSite=Lax cookie remembers registration; GET exposes only registered boolean. Name/phone are not stored in browser storage. Validation, honeypot, same-origin browser writes and constant-time token verification apply. Invalid cookies/failed saves cannot unlock the UI; valid cookies avoid duplicate contact registration. This is number-format validation, not OTP authentication; off-site/manual calls or browsers without JavaScript cannot be technically gated. Privacy notice and generated mobile/API contracts updated (294 paths /36 explicit methods). Existing public regression tests explicitly dismiss the optional welcome popup; contact gating is separately tested.

Validation - 2026-10-26: 229 unit/integration tests, production build/TypeScript, API contract validation (294 paths/36 explicit methods), targeted lint, docs and secret checks passed. Five real-browser checks passed: welcome dismissal/browsing, mandatory Call/WhatsApp details, invalid number and failed-save retry, original WhatsApp handoff (external destination mocked), and real contact creation verified through staff Leads. Synthetic contact submissions were marked LOST and temporary test owners retired. No calls/messages or financial/stock entries were made. Public regression scripts now choose the dismissed welcome state explicitly; their entire historical suites were not rerun.

Live verification - 2026-10-26: code commit 2f406d0 is deployed to https://smartfabrication.vercel.app. All five visitor browser checks passed on the new release, including mobile popup sizing, original WhatsApp handoff with destination mocked and actual API contact capture confirmed in staff Leads. The synthetic lead was marked LOST; temporary owner retired. No phone/message was sent. An initial production attempt ran before Vercel finished releasing; it was rerun after the new stylesheet was detected.
