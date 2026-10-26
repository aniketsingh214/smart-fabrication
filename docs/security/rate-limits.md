# Server-side form rate limits

Updated: 2026-10-26. Applies to database-related website/admin forms and direct application API writes.

## Coverage and defaults

| Layer / form | Limit | Identity / window |
| --- | --- | --- |
| Every `/api/v1/**` POST, PUT, PATCH, DELETE | 180 requests | Trusted client IP, 60 seconds |
| Enquiry + visitor popup (shared) | 6 requests | Client IP, 10 minutes |
| Login/signup/reset/password update | 10 requests | Client IP, 10 minutes |
| Login/signup/reset account attempts | 5 requests | Normalized email, 15 minutes |
| Saved estimates | 30 requests | Client IP, 60 seconds |
| Calculation previews | 60 requests | Client IP, 60 seconds |
| Guest upload sign/confirm (shared) | 20 requests | Client IP, 10 minutes |
| All authenticated application writes | 120 requests | Verified Auth user ID, 60 seconds |
| Finance, payments, returns, stock adjustments, role/permission/status changes, approvals and transitions | 20 requests | Verified user ID, 60 seconds, shared across these endpoints |

All matching layers must allow the request. Windows begin on the first request and reset at expiry; they are fixed windows, not sliding-window guarantees. Invalid submissions count at the gateway. Actor quotas apply after identity, active-profile and permission checks, so changing a token, record ID or resource does not reset the actor budget. Auth email attempts share a budget across login/signup/reset. Existing SQL enquiry limits (3/hour/phone, 200/hour globally), upload quotas and estimate guards remain in force. Existing idempotency keys and financial/stock transaction guards are unchanged; retries consume request quota but cannot create duplicate postings through idempotent workflows.

The generic gateway covers product/category/BOM/options/content, customer/lead/follow-up/measurement/quotation/order/job/worker/supplier/purchase records, all append-only posting forms, profile, permission changes, notes/assignment, private invoices and media confirmation, visitor capture and future application write endpoints. Shared role-authorized `requestContext` adds the verified-user layer. Account login/signup/reset now use same-origin `POST /api/v1/auth/form`; password update also requires a valid active user. Passwords are never used in quota identities or logs.

GET/HEAD/OPTIONS, browsing, GET search/export, local-only cart/wishlist preferences and the secret-authenticated reminder scheduler are not database-entry forms and do not consume these write quotas. Supabase Auth callback/session refresh/sign-out and direct provider calls retain Supabase's own protections; application quotas cover the supported app endpoints, not independent requests sent directly to Supabase or Cloudinary. Business RLS remains authoritative. A distributed upstream DDoS shield is outside this database form limiter.

## Enforcement and storage

`src/proxy.ts` matches every `/api/v1/:path*`; unsafe requests are checked before route execution. Future endpoints inherit the base quota without adding a button handler. `src/lib/auth/request.ts` checks actor quotas for authorized writes. `src/contracts/rate-limit.ts` is the central policy registry. Browser forms cannot override limits or submit identity headers to become another user.

The isolated `smartfabrication_rate_limit.request_rate_buckets` table stores only HMAC-hashed identities, counts and expiry timestamps. It has RLS enabled, no public policies, and no anon/authenticated grants. `consume_request_quota` is an atomic `INSERT ... ON CONFLICT ... UPDATE`, executable only by service_role. The server's dedicated privileged limiter client calls only this RPC; it never reads or writes workshop tables or replaces the RLS-scoped business client. Limits are shared across Vercel instances and cold starts. Expired rows older than one day are opportunistically pruned in bounded batches; this is not a guaranteed time-of-deletion SLA.

The HMAC pepper uses `RATE_LIMIT_SECRET` if set, otherwise the existing server-only `SUPABASE_SECRET_KEY`. Rotating it starts new quota identities. No raw IP, email, phone, JWT or password enters the bucket table. On Vercel, the platform-supplied `x-vercel-forwarded-for` header is preferred over `x-forwarded-for`; see [Vercel request headers](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for). Outside Vercel, untrusted forwarding headers are ignored and all local requests share a conservative `local-development` identity. A separately hosted reverse proxy would require an explicit trusted-IP configuration before claiming per-client limits there.

Storage/configuration/network failure returns **503** before business mutation; there is no process-memory fallback that silently disables quotas. GET browsing stays available. New quota 429 errors retain the standard API envelope with `RATE_LIMITED`, a readable retry-seconds message and `Retry-After`, plus precise blocked-layer limit/remaining/reset metadata. Existing SQL hourly enquiry/estimate guard errors retain their messages and receive a conservative 3600-second Retry-After header. Allowed gateway responses use separate X-RateLimit-IP-Limit/Remaining/Reset headers so proxy headers cannot overwrite a stricter actor-limit response. Failed forms retain values; existing red error toasts/inline errors display the message. A successful response is never shown for a blocked write. Do not auto-retry non-idempotent commands or clear unresolved financial/stock requests.

## Migrations and checks

Migrations 48 and 49 add the isolated quota store and fix a PostgreSQL timestamp-name collision detected by the first live concurrency test. Applied migrations remain immutable; no business schema/data was rewritten. The regular generated database snapshot documents the 58 public RLS tables; this extra isolated table is described here and in [quota store details](../database/rate-limit-store.md).

Run `npm run test:rate-limits` for real atomic-concurrency/expiry/grant checks, temporary-owner browser login, gateway coverage with invalid bodies, per-actor sensitive exhaustion, Retry-After and form-value preservation. No business records are posted: requests are malformed or mocked, and generated quota keys/accounts are retired. Unit/integration tests separately cover trust boundaries, HMAC, 429 headers, read exemptions and fail-closed storage failures. Runtime evidence and deployment results belong in [progress](../progress.md).

Validation - 2026-10-26: 241 unit/integration tests passed. Production build/TypeScript, targeted lint, API validation (295 paths/37 explicit methods), docs and secret scan passed. Runtime checks verified 25 concurrent quota requests (exactly 7 allowed), expiry reset, service-only quota execution, browser login with server session, representative public/media/admin write coverage, cross-endpoint actor exhaustion at 20 with precise 429 headers, and retained values/red retry feedback in category/profile/password forms. Backend checks and focused UI runs used only synthetic quota keys, a retired temporary owner and invalid/mocked submissions; no business postings occurred. The first SQL test exposed a CURRENT_TIME naming collision (fixed forward in migration 49); header tests also caught proxy metadata overwriting stricter actor headers, now separated. Native form validation required the test fixture to fill its required sort order. Applied migration and schema documentation refreshed; all 58 public RLS tables and business constraints remain unchanged.

Path classification decodes resource names and normalizes trailing slashes before choosing stricter quotas. Encoding a public/sensitive resource name cannot select only the broader fallback quota. Unsupported encoded API prefixes remain 404.
