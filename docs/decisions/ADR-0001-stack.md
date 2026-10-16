> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: planning draft; not implemented

# ADR-0001 — Fixed full-stack boundary

Status: recorded constraint from supplied master plan.

Use one Next.js App Router + TypeScript application for UI and REST /api/v1, Supabase PostgreSQL/Auth, Cloudinary media and Vercel hosting. Shared server-only services contain business rules; clients receive stable DTOs. Tailwind/shadcn for UI, Zod validation, Vitest/Playwright tests. No replacement database, media backend or separate server. Native mobile and external payments are future scope.
