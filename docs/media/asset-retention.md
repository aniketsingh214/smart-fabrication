# Asset retention and review

Updated 2026-10-16. A read-only stale-intent report is implemented; automatic deletion and a business-approved retention schedule are not.

Run `npm.cmd run media:review` with ignored development configuration. Optional `--hours 24 --limit 100 --cursor <uuid>` controls a bounded review page. The default 24 hours is a report filter after intent expiry, not an approved deletion period. Each page excludes confirmed intents and intents that already have a verified media row; a continuation cursor prevents silent truncation. Invalid/unknown/repeated options and unsafe bounds are rejected.

The query runs in a repeatable-read, read-only transaction. It records only intent ID, media context/type/visibility and timestamps under ignored `test-results/media-retention-latest.json`. It does not expose guest capabilities, owner/customer details, provider public IDs or signed URLs. It makes no provider requests and does not prove an asset exists or is safe to delete. Latest configured-development run succeeded with zero matching stale intents.

Before any deletion implementation or operation: agree retention/consent periods by context, identify invoice/evidence legal holds, recheck references and immutable snapshots, verify provider ownership, choose a recovery/quarantine approach, and record the specific reviewed target set and deletion outcome. A list of missing foreign-key associations alone does not prove an asset is unused; quotation/history JSON may retain references. No broad provider search/destroy or application/audit deletion is configured.

Test fixture cleanup remains precisely scoped to generated test identities/assets. It does not define customer-data retention. See [upload flow](upload-flow.md), [phase 05](../phases/phase-05.md) and [evidence](../testing/evidence.md).
