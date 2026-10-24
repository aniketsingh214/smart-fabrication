> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (live/local); engineering complete

# Customer Account & Future Checkout

## Source specification

- **Functional scope:** Optional login, own quotations/orders, saved designs, addresses, wishlist/cart for ready-made products later.
- **Rules / acceptance:** Do not force account to submit lead; prevent IDOR; mobile-ready endpoints.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Optional guest experience: Browsing, estimation calculator, Wishlist, Project Cart, and lead submission do not force user registration.
- Customer account portal: `/account` presents linked quotations, approved PDF downloads, and interactive order milestones.
- Anti-IDOR isolation: Database RLS strictly enforces that customers can only read/action quotations and orders associated with their verified `user_id` or customer profile.
- Wishlist & Project Basket: Hydration-safe persistent storage (`sf_wishlist_items_v1`, `sf_cart_items_v1`) powering `/wishlist`, `/cart`, slide-over drawers, header counters, and 1-click combined quotation requests.
- Customer order timeline: 7-milestone visual progression (Order Placed -> Measurement Verified -> Fabrication Started -> Ready for Dispatch -> Out for Delivery -> Delivered -> Completed).

## Verification record — 2026-10-22

Verified across Phase 04, 11, 12, and Wishlist/Cart test suites:
1. Anti-IDOR isolation and stranger-customer denial verified (`tests/integration/orders.test.ts`, `npm run test:orders-browser`).
2. Customer quotation review and PDF download verified (`npm run test:quotation-browser`).
3. Shop state management, reactive context, and drawer UI verified (41 test suites passed).
4. Customer 7-stage order milestone timeline verified.
