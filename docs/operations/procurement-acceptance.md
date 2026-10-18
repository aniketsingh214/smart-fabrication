# Real procurement browser acceptance

Updated 2026-10-16. Local engineering acceptance is verified; production/accountant acceptance is separate.

Run `npm.cmd run test:procurement-browser` against the local server and configured development integrations. The test uses generated owner credentials, the actual mobile purchase form, the actual signed Cloudinary PDF upload/verification APIs and the actual transactional invoice association RPC. It forwards the first association request to the real server and drops only its response after a successful commit; retry must return the same attachment ID and leave one history row. It verifies private PDF bytes/download headers and anonymous denial.

The fixture is a clearly labeled TEST ONLY zero-value draft purchase with no items. No receive, payment, refund or stock posting is performed. The synthetic supplier, draft, confirmed private invoice and immutable audit evidence remain labeled for review. Generated test login roles are removed, its profile disabled, sessions globally signed out and Auth access banned/password randomized. Credentials and signed URLs are not written to documentation. Identifiers/outcome are stored only in ignored `test-results/procurement-browser-latest.json`.

Latest result: four combined real mobile browser checks passed; retirement completed. The initial attempt failed on required-field label selectors before creating a purchase or invoice; its generated login was retired and its labeled supplier/audit evidence retained. The passing rerun corrected selectors, not application behavior. No historical business records were modified.

Together with existing real rollback SQL supplier/payment/receipt/return/tax/refund/reconciliation checks, invoice handler permission/input/pagination tests, simulated desktop/mobile operational form checks and passing build/lint/API/docs gates, this meets phase 13's local engineering gate. Full workshop rollout, real supplier invoices, accountant tax treatment, broader production load and production recovery remain launch/business requirements.
