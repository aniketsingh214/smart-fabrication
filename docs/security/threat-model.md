> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: scoped security verification; see current progress

# Threat model

Review IDOR, privilege escalation, JWT expiry/revocation, cookie CSRF, spam, signed-upload abuse, malicious assets, concurrent stock/payment writes, webhook replay and secret/PII leakage. Current form-abuse protection includes distributed request/actor quotas, trusted-IP handling, fail-closed storage errors and private quota execution. Atomic concurrency, expiry, grant denials, 429 headers and retained-form feedback were checked; this does not certify every threat listed here. See [rate-limit evidence and policies](rate-limits.md) and [progress](../progress.md).
