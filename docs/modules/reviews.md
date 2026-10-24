> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Reviews

## Source specification

- **Functional scope:** Customer name/rating/text/photo/date, approval, publish/hide.
- **Rules / acceptance:** Moderation, spam prevention, verified order optional.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Review model: `reviews` table tracking `customer_name`, `rating` (1–5), `review_text`, `status` (`pending`, `approved`, `rejected`), `verified_order_id`, and timestamps.
- Moderation workflow: New reviews default to `pending` status. Only authorized staff with `content.write` permission can approve or reject reviews.
- Public display: Public endpoints and homepage testimonial components query strictly with RLS guard `status = 'approved'`.
- Verified badge: When linked to an actual completed order (`orders.id`), displays a "Verified Installation" trust badge.

## Verification record — 2026-10-17

Verified in Phase 06 CMS & Public website acceptance:
1. Public review submission and moderation queue verified.
2. Moderation action (`pending` -> `approved`) and public publication verified.
3. Strict RLS hiding of unapproved reviews from anonymous visitors verified.
