> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: planning draft; not implemented

# Architecture draft

## 2. Stack, architecture and system boundaries

| Concern | Fixed choice | Implementation guidance |
|---|---|---|
| Full-stack app | Next.js App Router + TypeScript | React Server Components for read-heavy pages, client components for interactive UI; Route Handlers for stable REST API; Server Actions for web-only UX where useful |
| Styling | Tailwind CSS + shadcn/ui | accessible reusable components; responsive mobile-first layouts |
| Data | Supabase PostgreSQL | SQL migrations, constraints, views/RPC for atomic operations; no direct privileged DB access from browser |
| Authentication | Supabase Auth | SSR sessions for web, JWT bearer access tokens for mobile; server validation and authorization |
| Authorization | Supabase RLS + server-side RBAC | enforce both, never trust hidden UI buttons; service-role key server-only and exceptional |
| Media | Cloudinary | signed server-authorized uploads, metadata in PostgreSQL, secure private asset handling |
| Hosting | Vercel | deploy Next.js frontend and serverless APIs together; preview/prod environments |
| Validation | Zod | shared DTO schema with server authority; avoid leaking internals |
| Tests | Vitest + Playwright + integration tests | contract, RLS, webhook, calculation, finance and E2E tests |
| Observability | structured server logs + Vercel logs | correlation/request IDs, error reporting integration only if approved |
| Repository | GitHub | protected main, PRs, review and CI |

**Request flow:** Browser / future mobile → `https://<domain>/api/v1/*` → auth/permission check → Zod DTO validation → domain service → Supabase SQL/RPC with RLS and transactional integrity → response envelope. UI pages may call shared server services directly for efficient SSR, but business logic MUST remain reusable through versioned API endpoints. Do not duplicate rules in UI.

**Architecture layers:** `app` routes and pages → `features/*/api` handlers/controllers → `features/*/services` business rules → `features/*/repositories` typed Supabase access → Supabase database. Cross-cutting auth, permissions, media, logging, validation, errors, idempotency and audit under `lib/` or `server/`.

**Serverless limits:** no always-on workers or in-memory durable queues; avoid long-running uploads/PDF tasks in requests. Prefer short transactional operations; scheduled jobs may use Vercel Cron with protected endpoint and idempotency, subject to plan limitations. External notification integrations need separate approval.

**Configuration:** `.env.example` with names only; `.env.local` never committed; separate dev/staging/prod credentials; use Vercel env vars; Supabase service role and Cloudinary API secret never `NEXT_PUBLIC_*`.



## 9. Next.js repository structure

```text
smartfabrication/
├── AGENTS.md
├── README.md
├── CHANGELOG.md
├── .env.example
├── .github/workflows/ci.yml
├── docs/
│   ├── MASTER_PLAN.md
│   ├── requirements.md
│   ├── architecture.md
│   ├── roadmap.md
│   ├── progress.md
│   ├── decisions/ADR-0001-stack.md
│   ├── modules/<module>.md
│   ├── api/openapi.yaml
│   ├── api/authentication.md
│   ├── api/mobile-integration.md
│   ├── api/versioning.md
│   ├── api/changelog.md
│   ├── database/erd.md
│   ├── database/schema-dictionary.md
│   ├── database/rls-matrix.md
│   ├── database/migrations-log.md
│   ├── database/finance-policy.md
│   ├── security/permissions.md
│   ├── testing/test-plan.md
│   ├── operations/deployment.md
│   ├── operations/backup-restore.md
│   ├── operations/incident-response.md
│   ├── operations/runbook.md
│   ├── mobile/roadmap.md
│   └── phases/phase-01.md ... phase-18.md
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/                 # store, gallery, calculator, contact
│   │   ├── (auth)/                   # login, reset
│   │   ├── account/                  # customer portal
│   │   ├── admin/                    # workshop ERP/CRM
│   │   └── api/v1/                   # mobile-ready REST Route Handlers
│   ├── components/ui/
│   ├── components/layout/
│   ├── features/
│   │   ├── catalog/
│   │   ├── leads/
│   │   ├── quotations/
│   │   ├── inventory/
│   │   ├── finance/
│   │   └── ...                       # feature UI/services/repositories/DTOs
│   ├── contracts/                    # public API DTOs and schemas
│   ├── lib/supabase/                 # browser, SSR server, admin server only
│   ├── lib/cloudinary/               # server-only signing and media helpers
│   ├── lib/auth/
│   ├── lib/errors/
│   ├── lib/audit/
│   └── types/
├── supabase/migrations/
├── supabase/seed.sql
├── tests/unit/
├── tests/integration/
├── tests/e2e/
└── scripts/
```

**Code placement:** Keep `app/api/v1` thin; all business logic in server-only feature services. Avoid direct database mutations from client components. Mark secret-bearing modules server-only. All docs must be relative-linkable from README.



This is a planning baseline, not evidence of runtime files or finalized Phase 02 design.
