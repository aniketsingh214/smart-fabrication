> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: implemented and verified (local)

# Delivery & Installation

## Source specification

- **Functional scope:** Schedule, assigned crew, address, transport, proof of delivery, installation checklist, sign-off.
- **Rules / acceptance:** Consent and restricted media; delivery/installation status transitions.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- **Database Models**:
  - `public.deliveries`: `id`, `name`, `order_id`, `scheduled_at`, `address`, `crew`, `status` (`'scheduled'`, `'dispatched'`, `'delivered'`), `proof_media_id` (references `media_assets(id)`), `confirmed_at`, `created_at`.
  - `public.installations`: `id`, `name`, `delivery_id`, `checklist` (`jsonb`), `customer_confirmed` (`boolean`), `status` (`'pending'`, `'completed'`), `created_at`.
  - Database Trigger `completion_evidence_guard` (`202610150011_publication_completion_guards.sql`):
    - Blocks delivery transition to `'delivered'` without `confirmed_at` and `proof_media_id` referencing a verified private media asset (`context = 'delivery_proof'`, `visibility = 'private'`).
    - Blocks installation transition to `'completed'` without `customer_confirmed = true`, `checklist @> '{"fixings_checked":true,"alignment_checked":true,"finish_checked":true,"site_cleaned":true}'`, and verified delivered delivery.
    - Database Trigger `transition_order` blocks order transition to `'COMPLETED'` until both delivery and installation sign-offs are satisfied.
- **API Endpoints**:
  - `GET /api/v1/admin/deliveries`, `POST /api/v1/admin/deliveries`: Delivery scheduling.
  - `POST /api/v1/admin/deliveries/:id/transitions`: Transition delivery stage (`status: 'dispatched' | 'delivered'`, `proof_media_id`, `confirmed_at`).
  - `GET /api/v1/admin/installations`, `POST /api/v1/admin/installations`, `PATCH /api/v1/admin/installations/:id`: Manage installation checklist and customer sign-off.
  - `GET /api/v1/orders/:id/timeline`: Customer portal view reflecting `OUT_FOR_DELIVERY`, `INSTALLATION`, and `COMPLETED` milestones.
- **Security & Permissions**:
  - Requires `delivery.write` for scheduling and transition actions; `orders.write` for order milestones.
  - Delivery proof media assets are strictly private (`visibility = 'private'`).
  - RLS enforces that customers only see their own order milestones; stranger access is blocked (404 / 0 rows).
- **Verification**:
  - Automated Playwright & API suite: `scripts/test-delivery-installation-browser.mjs` (`npm run test:delivery-installation`).
  - Artifact: `test-results/delivery-installation-browser-latest.json` (6/6 checks passed).

## Operations workspace navigation - 2026-10-31

Removed Quality checks and Installations from the Orders & Workshop workspace resource links, including All lists & history. The workspace description now lists orders, job cards, workers and delivery. This is a navigation removal scoped to /admin/workspaces/operations; underlying records, API routes and order stages remain available for existing workflows/history. No database deletion or migration.

## Delivery Add/Edit status dropdown - 2026-10-31

Delivery forms explicitly show Scheduled, Dispatched and Delivered with clear labels and workflow help. Add starts at Scheduled; Edit displays the current persisted stage. Only the current value is selectable in this details form. Stage changes remain on the existing delivery detail workflow: Scheduled to Dispatched, then Delivered with verified private proof and confirmation time. The display-only select is excluded from generic save payloads, preserving server defaults and evidence requirements. No API/schema or database migration is needed.
