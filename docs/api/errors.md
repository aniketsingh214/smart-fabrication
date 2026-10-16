> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: implemented

# API errors

JSON success: `{ "data": {}, "meta": {}, "requestId": "..." }`. JSON failure: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] }, "requestId": "..." }`. `details` is optional. Both return `X-Request-ID` and `Cache-Control: no-store`. PDF and CSV downloads use their own content types.

Relevant statuses: 400 malformed JSON, 401 missing/invalid identity, 403 permission/origin denied, 404 missing record, 405 unsupported mutation, 409 stale state/business conflict, 413 body too large, 415 unsupported content type, 422 invalid fields, 429 quota, 500 sanitized internal error. JSON bodies are limited to 65,536 streamed bytes. Do not depend on database error text or retry a financial write with a new idempotency key after a network timeout.
