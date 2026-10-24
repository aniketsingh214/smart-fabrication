# Customer website improvements

Updated: 2026-10-25.

Wishlist/cart follow-up: badges count unique product IDs, independently of cart quantities. Stored wishlist duplicates are consolidated on hydration. Current-state references ensure rapid/batched additions retain all designs instead of overwriting earlier updates. Six desktop/mobile regressions pass for restoration/deduplication, quantity/new-design counts, reload persistence and Move All to Cart. Build/TypeScript and targeted lint pass. No wishlist/cart server synchronization or database changes were added.

1. **Mobile header:** action controls wrap below the brand on narrow screens; search has a bounded flexible width; navigation remains available until the desktop links fit. Checked at 320, 390, 768 and 1440 pixels.
2. **Catalog/details:** material text, maximum recorded indicative starting price in INR and newest/name/price sorting. Filters survive category navigation and pagination; reset clears all. Budget excludes unpriced designs and does not promise a quotation. Timestamp cursors are only used for newest-first ordering. Published public product images have a thumbnail selector and keyboard-dismissable enlargement; concept fallback and product videos remain available.
3. **Measurement visit requests:** `/contact?measurement=1`, also linked from product/account pages. Preferred date (India time), time window, site address and PIN are validated on the server and stored in the existing lead requirement, visible to authorized staff. This is a visit request; availability, coverage and any charge require workshop confirmation. No calendar reservation, guaranteed slot, physical measurement or automatic dispatch is created. Existing source, anti-spam, private upload and role/RLS workflow remains in use. Combined requirement is capped at 2000 characters.
4. **WhatsApp design enquiries:** links use only the public configured valid workshop phone, selected product name/code and canonical product URL. Missing/invalid configuration hides the link. Opening WhatsApp drafts a message; sending is the customer's action. No message was sent during testing and no default number was invented.
5. **Customer account:** page-scoped quotation/order overview, pending-decision count, India-time quotation expiry, expired-price revision guidance, and direct measurement/catalog links. Existing PDFs and owned order timelines remain accessible. Order totals are not mislabeled as unpaid balances; independent page cursors and RLS remain intact.

No price, review, work-completion count or workshop approval was fabricated. Catalog amounts remain recorded indicative figures; business accuracy and imagery ownership/consent require the existing workshop review.

## Verification

- 181 unit/integration tests across 45 files passed, including India date/PIN validation, payload persistence, overflow limit, WhatsApp contact handling, server price predicates, filter continuation and scoped dashboard/expiry rendering.
- Eight desktop/mobile Playwright scenarios passed. Header sizes, catalog filtering/reset, real published product image enlargement/design links and a simulated enquiry response are distinguished in `tests/e2e/customer-enhancements.spec.ts`.
- Real measurement/browser evidence is recorded in ignored `test-results/measurement-browser-latest.json`. Labeled test leads are closed LOST and generated staff logins retired; audit is retained. No real appointment, payment or stock posting was made.
- Production build/TypeScript and API contract validation passed (292 paths / 33 explicit methods). OpenAPI/types include optional `measurement_request` on guest enquiry writes. No database migration is required.
- Earlier browser failures were an origin assertion expecting a localhost share link instead of the configured public URL and a missing exact accessible label on the preferred-time select; both were corrected. Failed fixtures were closed/retired and are not counted as passing runs.

Full-project lint issues recorded before this change remain separate; verify the changed files with targeted lint. Deployment verification is recorded after publishing, not inferred from a local build.
