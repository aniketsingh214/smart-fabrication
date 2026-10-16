> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: local v1 baseline

# Versioning

REST endpoints live under `/api/v1`. Preserve additive compatibility; incompatible published contracts need `/api/v2` and documented deprecation. No externally released version or deprecation date exists yet. `npm.cmd run api:check` validates OpenAPI and explicit handler coverage; `npm.cmd run api:types` regenerates TypeScript declarations. A deployed compatibility-diff gate remains pending.
