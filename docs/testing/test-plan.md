> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: planning draft; not implemented

# Test plan

## 12. Testing, quality, performance and operations

**Required CI gates:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, OpenAPI validation, dependency audit review, migration checks; E2E on staging for critical flows. Configure scripts explicitly.

**Test pyramid:**
- Unit: Zod validators, pricing formulas, unit conversions, finance calculations, status transitions, permissions.
- DB integration: Supabase RLS role matrix, unique/FK constraints, atomic stock/finance posting, migration forward tests.
- API integration: status/error envelope, bearer auth, 401/403/404/409/422/429, pagination, idempotency, ownership and rate limits.
- E2E: public enquiry → staff lead → quote → order → work order → inventory → delivery; supplier purchase/payment; labour work/payment; finance report; role-specific admin views.
- Security: IDOR, privilege escalation, CSRF, malicious file upload, signed upload abuse, webhook replay, leaked secrets, sensitive logs.
- Non-functional: mobile responsiveness, keyboard access, SEO metadata/sitemap/robots, image optimization, caching, performance budgets, basic load tests, backup restore, failure/retry handling.

**Definition of Done (each feature):** spec approved; migrations and RLS; backend service; `/api/v1` contract if applicable; web UI; tests; docs; logs/audit; accessibility/error/empty/loading states; review; verified build; changelog/progress update.

**Operations:** monitor API latency/error rate, database usage, failed uploads, lead form abuse, inventory reconciliation failures, payment mismatches when enabled, failed scheduled jobs, auth failures. Maintain `runbook.md`, incident severity, owner, restore procedures and tested backup schedule. Define retention and legal/tax needs with business owner.


