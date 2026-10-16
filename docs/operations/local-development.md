# Local development and first owner setup

The current delivery scope is local application hosting, using the configured Supabase and Cloudinary development services. GitHub push and Vercel deployment are deferred by the user.

```powershell
cd 'D:\Work\New folder\aniket\smart-fabrication'
npm.cmd run dev -- --hostname 127.0.0.1
```

Open `http://localhost:3000`. Public pages work without a customer account. `/admin` and `/account` require Supabase Auth.

To select the first real owner, create and confirm the chosen email account through `/login`, then run:

```powershell
npm.cmd run owner:grant -- your-confirmed-email@example.com
```

The account must already exist. This maintenance command uses the ignored development database connection. It is not an anonymous signup privilege and no shared/default admin password is created. The user's selected confirmed account received the owner role on 2026-10-15. Open `/admin` after signing in; refresh an already open account page to load the new permissions.

`npm.cmd run test:auth` creates isolated, confirmed test accounts through Supabase's administrative Auth API without sending emails, then tests real browser sign-in, role checks and sign-out. It uses administrative database access only to bootstrap/remove its own fixtures. Business requests use the normal session and RLS. Test passwords exist only in process memory; the real owner's credentials are never used. Temporary accounts are removed in cleanup; immutable audit events remain. Quotation editor/revision browser payloads are simulated, while corresponding business rules have real rollback-only SQL tests. Optional `TEST_AUTH_VIEWPORT` and `TEST_AUTH_ROLE` restrict a diagnostic run.

Run local checks with `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run docs:check`, `npm.cmd run api:check`, `npm.cmd run build` and `npm.cmd run security:check`. Live tests require network access: `npm.cmd run test:db` rolls back its fixtures; `npm.cmd run test:media` creates and removes only its newly generated test image. `npm.cmd run test:e2e` uses installed Chrome on desktop and mobile viewports.

Secrets belong only in ignored environment configuration. `NEXT_PUBLIC_*` values are browser-visible identifiers/publishable keys; privileged database, Supabase and Cloudinary values must never use that prefix. Credentials shared in chat require rotation before launch.
