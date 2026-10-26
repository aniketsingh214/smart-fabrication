# Isolated rate-limit store

Applied: migrations 202610260048_request_rate_limits.sql and 202610260049_quota_timestamp_fix.sql.

Schema: `smartfabrication_rate_limit` (not exposed by the application data API).

| Table / column | Meaning |
| --- | --- |
| request_rate_buckets.bucket_key | Primary key: 64 hex characters from server HMAC |
| hits | Positive integer, capped at max_hits + 1 |
| resets_at | Timestamp with time zone; indexed for expiry cleanup |

RLS is enabled. Public, anon and authenticated have no schema/table grants. No public policies exist. The security-definer function `public.consume_request_quota(text,integer,integer)` has an empty search_path and fully qualified table references; only service_role may execute it. It validates arguments, atomically increments or resets the matching key and returns allowed/remaining/retry_after/reset_at. Its privileged scope is restricted to quota counters, never business records. Multiple API instances share one database-backed counter; no in-memory quota state is trusted.

No raw IP/email/phone/token/password is stored. Old expired keys are opportunistically removed in bounded batches. Business tables, permissions, audit history, transaction/idempotency behavior and backups remain unchanged. The public schema snapshot still lists 58 tables; this separate schema adds one additional RLS-enabled infrastructure table. See [limits, coverage and failure behavior](../security/rate-limits.md).
