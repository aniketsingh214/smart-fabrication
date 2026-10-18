> Version: 0.1 | Owner: project team | Updated: 2026-10-18 | Status: done (local)

# Phase 02 — Architecture, UX, API & ERD

- **Objective / tasks:** Choose module boundaries, sitemap, design system, state diagrams, RBAC, REST contracts, ERD, threat model, finance assumptions.
- **Deliverables:** architecture.md, wireframes, OpenAPI skeleton, ERD, ADRs, security model.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-02.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Web/mobile contract review, no missing critical entity. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-18. Status: done (local).

The user authorized sequential implementation across phases without stopping for permission, restricted to local development.

### Implemented & Verified Acceptance

1. **Architecture & Module Boundaries:**
   - Single Next.js App Router codebase, TypeScript, Tailwind, Supabase PostgreSQL with RLS, and Cloudinary media integration.
   - All server business logic behind `/api/v1` for both web and future mobile clients.
2. **Applied Relationship Documentation & ERD (`npm run db:document`):**
   - Captured PostgreSQL catalog metadata: **58 public tables, 134 policies, 319 constraints, and 46 applied migrations**.
   - 0 tables with RLS disabled.
   - Updated `docs/database/actual-schema.json`, `docs/database/erd.md`, `docs/database/schema-dictionary.md`, and `docs/database/migrations-log.md`.
3. **Security, RBAC & Contracts:**
   - Strict deny-by-default RBAC across 6 roles (`accounts`, `content`, `customer`, `owner`, `production`, `sales`).
   - OpenAPI 3.1.0 contract verified across 292 paths with generated TypeScript declarations.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), [database ERD](../database/erd.md), [schema dictionary](../database/schema-dictionary.md), and [master plan](../MASTER_PLAN.md).

