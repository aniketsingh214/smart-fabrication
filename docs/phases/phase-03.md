> Version: 0.1 | Owner: project team | Updated: 2026-10-18 | Status: done (local)

# Phase 03 — Repository, Next.js & Vercel Foundation

- **Objective / tasks:** Create Next.js TS, Tailwind/shadcn, lint/typecheck/test/build, env example, GitHub CI, Vercel preview.
- **Deliverables:** working skeleton, CI, preview URL, deployment docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-03.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Clean build and preview smoke test. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-18. Status: done (local).

The user authorized sequential implementation across phases without stopping for permission, restricted to local development; GitHub push and Vercel remote deployment are deferred at the user's explicit request.

### Implemented & Verified Acceptance

1. **Local Foundation:**
   - Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Lucide icons, and server-only modules.
   - Clean local builds (`npm run build`) and strict typing (`npm run typecheck`) verified.
2. **Environment & Tooling:**
   - Configured `.env.example`, `.env.local` ignored and guarded by `npm run security:check`.
   - CI workflow defined in `.github/workflows/ci.yml`.
   - Vercel deployment configuration in `vercel.json` with security headers and API routes.
3. **Local Dev & Preview Smoke:**
   - Active Next.js dev server serving all public, customer, and admin routes with real data and Cloudinary media assets.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), and [master plan](../MASTER_PLAN.md).

