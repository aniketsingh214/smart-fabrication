# Mobile client handoff

This is preparation for a future native app, not a claim that an Android/iOS app or store release exists. Next.js `/api/v1` remains the only business backend. Local-only deployment scope remains unchanged.

## Shipped client and examples

Use [the client](../../src/contracts/client.ts), [generated API declarations](../../src/contracts/generated-api.d.ts) and the [profile/notification example](../../examples/mobile/profile-notifications.ts). The example uses generated response types and validates public DTOs at runtime; it preserves `nextCursor` instead of assuming the first page is the complete collection. `npm.cmd run typecheck` checks the example.

Pass an absolute HTTPS API base such as `https://your-host/api/v1`; loopback HTTP is accepted for development only. Queries, credentials and fragments in the base are rejected. Requests cannot traverse outside the API base. The client uses `credentials: omit`, refuses redirects, and does not cache private responses. A token supplier is called for every request. Acquire/refresh the session through the platform's Supabase SDK and secure OS-backed storage; only publishable credentials belong in the native bundle. Never store service-role, database or Cloudinary signing credentials there.

`ApiClientError` exposes `status`, `code` and optional `requestId`. A non-JSON or invalid success envelope produces `INVALID_RESPONSE`, preserving HTTP status/correlation when available. Transport/abort errors propagate. Never log Authorization headers or session tokens. A 401 requests login/session refresh; a 403 requires updated permissions or an enabled account, not repeated login loops. A 409 requires business-state review; 422 requires input correction. Reads can offer a bounded manual retry after 429/5xx. The client performs no automatic write retry or token refresh/replay.

## Workflow map

| Screen | API boundary | Required client behavior |
| --- | --- | --- |
| Identity/profile | GET/PATCH `/me` | Current identity; only documented profile fields may be changed |
| Catalog | `/products`, `/categories`, product detail | Published content, bounded pagination; final prices require a quotation |
| Enquiry/reference | POST `/leads`, `/uploads/guest/sign`, `/uploads/guest/confirm` | Keep scoped capability in memory; recover reference confirmation separately from enquiry submission |
| Quotations | `/quotations` and documented accept/reject actions | Use customer-safe alternative DTO; preserve quotation version/state |
| Orders/timeline | `/orders` and documented timeline endpoints | Only owned records; do not expose staff notes or unrelated identifiers |
| Notifications | GET `/notifications`, POST `/notifications/{id}/read` | Cursor continuation; repeated mark-read preserves the first timestamp |
| Staff workflows | Documented `/admin/*`, inventory and production endpoints | Current permissions plus ownership/domain guards; no privileged direct database writes |

Endpoint-specific paths, methods, bodies and permissions must come from [OpenAPI](openapi.yaml), not inferred from this screen map. Some DTOs differ for staff and customers.

## Offline/sync and revocation strategy

Start with public catalog caching and local unsent drafts. Partition any private cache by account ID and schema version; clear private drafts/cache on sign-out, account switch, disabled-account response or permission loss. Never persist bearer tokens in draft payloads, signed invoice URLs, guest upload capabilities or payment evidence in an unencrypted general cache.

Draft states are `draft → sending → confirmed`; an unknown network outcome becomes `uncertain`, not automatically `draft`. The current enquiry API must not be assumed to provide business-intent deduplication. Do not silently resubmit an uncertain enquiry. For endpoints that explicitly support idempotency, persist the original actor, exact payload and original key before dispatch and retry only that command. Keys are actor-bound; a changed payload or new key is a new request. Resolve stale-version conflicts from current server state.

Do not enable offline payment, refund, stock, wage, quotation-acceptance or installation posting in the first native release. These actions need a reviewed sync design, foreground reconciliation and dedicated acceptance before enabling. Server-ledger state always wins; a locally cached balance is never posting authority. Device storage/restart/encryption implementation is future native-app work, not part of the present website build.

## Push roadmap and compatibility

Internal notifications are implemented; push transport is not. Choose a provider, obtain per-device consent, store/revoke device tokens under the authenticated owner, and send only a generic notification identifier. Fetch private content through the API after opening the app. Test token rotation, duplicate deliveries, revoked permissions and sign-out before enabling push. Do not promise push delivery from the existing reminder dispatcher alone.

The current contract is a local v1 baseline, not a published compatibility guarantee. Additive fields must not break clients; consumers ignore unknown fields while validating fields they use. Breaking changes need a separate major API version, migration notes, a declared support interval and agreed retirement date. No retirement deadline is invented before a mobile release exists. Run API validation/types, DTO regression tests and the SDK acceptance suite before every handoff. A deployed compatibility-diff gate and full independent operational-write acceptance remain open.

Run `npm.cmd run test:mobile-client` with ignored development environment configuration. It executes the shipped TypeScript client through Node, real Supabase Auth and local APIs without browser cookies. Only generated profile/notification fixtures are changed. Immutable audit actor references require retaining a disabled/banned fixture identity; notification/role fixtures are removed, the session is globally signed out after a successful run, and no financial/stock entries are created. See [test evidence](../testing/evidence.md) for actual results and failed attempts.
