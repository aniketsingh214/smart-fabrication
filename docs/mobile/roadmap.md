> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: backend preparation in progress; native app future scope

# Mobile roadmap

Current backend preparation includes local v1 handlers, generated OpenAPI/types, bearer-aware client and boundary tests. See [current integration status](../api/mobile-integration.md). This is not a completed native app or authenticated mobile acceptance result.

## 15. Future mobile app readiness and mobile app plan

**Mobile target (future, not current build):** Android and iOS customer app first; optional staff app later. Candidate UI technology React Native + Expo because TypeScript contracts can be shared; this does NOT introduce a second backend. Final mobile UI choice is a future decision.

**Customer app feature mapping:** browse catalog/categories/gallery, search/filter, estimator, lead submission, image upload, measurement requests, login/profile, quotation list/details/acceptance, order status timeline, notifications, saved addresses. Optional later cart, payments and AI design.

**Staff app feature mapping:** assigned leads/follow-ups, site measurements/photos, assigned work orders, stage updates, inventory request, delivery/installation checklist, limited offline entry with conflict handling. Restrict finance and admin operations by permission.

**Required now:** stable REST v1; OpenAPI contract; bearer auth; role/ownership controls; cursor pagination; upload-sign endpoint; explicit unit/currency/timezone fields; backward-compatible DTOs; predictable errors; idempotency; request IDs; no web cookie dependence; SDK generation; staged mobile contract tests.

**Offline strategy (future):** cache public catalog and assigned tasks; queue safe writes with idempotency keys; server remains source of truth; conflict detection with version/updatedAt; do not queue sensitive payment or stock-posting operations without explicit review. Push notification integration later requires provider selection and consent; internal notification records can exist now.

**Mobile rollout sequence:** M0 contract audit → M1 generated API SDK + mock app → M2 authentication/profile → M3 catalog/quotes/orders → M4 media upload + notifications → M5 staff workflows/offline pilot → M6 store publishing, security and crash monitoring. App release dates are intentionally uncommitted.

**Maintain `docs/api/mobile-integration.md`:** environments/base URLs, token acquisition/refresh, headers, endpoint catalog, DTOs/examples, pagination, errors, uploads, retries, idempotency, version support, deprecation, offline considerations, push roadmap and test users (no secrets). Update on EVERY API change.


