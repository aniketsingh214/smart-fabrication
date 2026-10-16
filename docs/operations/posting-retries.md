# Posting retries and authenticated authors

Updated 2026-10-15. Reuse a UUID idempotency key only for the same intended action, original payload and authenticated author. A second authorized staff member cannot claim the first author's payment, stock or earning request key. Permission checks still run before retry lookup. This changes retry authorization, not balances or bank movement.

Customer receipts and stock movements already record authors. Supplier/labour payments and work entries now record `created_by` for new posts. Existing rows were not backfilled with a guessed user and their original ledger values remain immutable. API clients cannot supply these author fields through generic resource writes.

For an old row with no recorded author, the private helper accepts only one immutable INSERT audit entry with a matching non-null current actor. Missing/ambiguous provenance rejects the retry; inspect the original posted record rather than creating a second receipt/payment. The helper is not executable by application or service roles; vetted posting functions call it internally.

Unchanged retries by the original author retain their posted result, even after subsequent refunds/corrections. Conflicting payloads and other authors are rejected. Existing correction, withdrawal and catalog-copy actor checks remain in place.

Verification: the offline restored/forward-migrated database passed 180 rollback workflow checks and 11 concurrent-commit assertions. Cross-author tests give the second synthetic actor full owner permissions before asserting denial, so these are author-isolation checks rather than ordinary permission denials. Private-helper access, original-author retry, legacy audit lookup and unverifiable legacy lookup are covered. All fixtures are synthetic; disposable PostgreSQL stops after the run.
