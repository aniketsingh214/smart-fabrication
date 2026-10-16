> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: planning draft; not implemented

# Deployment

## 11. Vercel and Supabase environments

| Environment | Vercel | Supabase | Cloudinary | Purpose |
|---|---|---|---|---|
| Local | `next dev` | local Supabase or isolated dev project | dev folder/preset | coding/testing |
| Preview/staging | preview deployment | isolated staging project | staging namespace | PR QA/UAT |
| Production | production deployment | production project | production namespace | real users |

**Setup checklist:** create GitHub repo; Next.js project with TS/Tailwind; Supabase project and migrations; Auth redirect URLs per environment; RLS; Cloudinary credentials and presets; Vercel Git integration; env vars; custom domain, DNS/HTTPS; error/log monitoring; migration deployment procedure; staging seed; rollback plan; backups and restoration test. Verify Vercel commercial plan eligibility and current quotas/prices before commercial launch; free plans are not guaranteed appropriate.

**Environment variable names:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` (server only), `CLOUDINARY_API_SECRET` (server only), `NEXT_PUBLIC_APP_URL`, `APP_ENV`. Only add provider-specific secrets when integration approved.

**Deployment pipeline:** PR → lint/typecheck/unit/contract tests → preview build → staging migration/QA → approve → production migration with backup → deploy → smoke tests → monitor. Do not run migrations automatically on arbitrary previews. Protect secrets and database service role from build/client bundles.



No external accounts connected or deployments created.
