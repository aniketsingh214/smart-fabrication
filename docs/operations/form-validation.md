# Inline form validation

Updated: 2026-10-27. Applies to existing public, account and admin HTML forms through ValidatedForm. No schema migration or business-data rewrite.

## User behaviour

Input validation appears immediately below the relevant control in red, with a red border, aria-invalid, aria-describedby and an alert announcement. The Indian mobile message is below the complete +91 input group. Checkbox confirmations place the message after their label. Each form owns its own messages, so identical field names in another form are unaffected.

Fields are checked after blur. Once touched or rejected, correction rechecks the field; untouched fields do not show errors on the first keystroke. Submit checks the entire form, blocks the handler if invalid, and focuses/scrolls to the first invalid input. Native browser validation tooltips are replaced by these inline messages. Input values remain intact. Correcting a field clears its error; editing another field does not erase an unchanged server duplicate error. Reset/unmount cleans up messages and accessibility attributes.

Validation messages are not duplicated as generic validation toasts or an orange form notice. Successful saves retain existing green success toasts. Network, permissions, rate limits, transaction conflicts and errors without a reliable input path remain form-level feedback; they are never guessed onto an unrelated input. A server error on a hidden/uneditable value may require form-level feedback.

## Shared implementation

- src/components/validated-form.tsx preserves the actual form element and existing handlers/actions, including GET filters. It reads native constraints and optional shared schema validation, creates scoped error slots next to the real controls and renders accessible messages through React portals. Dynamic fields and nested record forms retain separate form scopes.
- src/lib/form-errors.ts preserves Zod issue paths and API details arrays. It binds FormData to its originating form with weak references, maps known UI aliases (amount_minor to amount, unit_cost_minor to unit_cost, measurement address to site_address), and never treats object-valued rate-limit details as input errors. No fetch interception, global active-form guessing or HTML injection is used.
- Shared resource forms reuse parseRecordForm/resourceSchema before submission; native required/type/range messages take precedence over generic schema type errors. Server/API validation remains authoritative.
- Quotation line inputs have stable path names such as items.1.quantity. Discount/subtotal and stock consumption quantity/job checks now return the relevant field paths while preserving their accepted business rules.
- Known duplicate constraints on an allowed resource field produce HTTP 409 with details:[{field,message}]. Unknown constraints retain sanitized generic conflicts. Product maximum-price/review limits also carry field paths. Invalid login retains its existing generic credential message, now assigned to the password field without revealing whether the email exists.
- File type/size/purpose validation targets the upload input. Upload confirmation failures and uncertain stock/invoice submissions keep their existing recovery/idempotency behaviour. No write is retried automatically by validation.

The existing /api/v1 error envelope and mobile contract remain compatible: details may be field-message arrays; non-field details remain objects where already supported. Permissions, RLS, database constraints, quotas, monetary units and posting protections remain in force.

## Checks

Unit/integration coverage includes nested field paths, display-unit aliases, safe duplicate mapping, ignoring rate metadata, quotation line/discount rules and consumption quantity/job errors. Browser acceptance is scripts/test-inline-validation.mjs (npm run test:inline-validation): required/email/password errors, first-error focus, clear-on-correction, red placement, Indian mobile group placement, public enquiry/API errors, shared admin slug/duplicate persistence, price/file validation, dynamic quotation fields, mobile overflow and runtime errors. Business saves are mocked; only a generated Auth test account/profile/role is created and retired. Actual results and release verification are recorded in docs/progress.md.

## Recorded release verification

Release ba0043b was observed on the live login page. All six browser groups passed locally and on https://smartfabrication.vercel.app; eight existing admin-table browser groups, 263 unit/integration tests, production build and API/docs/security checks passed locally. Live business saves were mocked. The live runner exited nonzero during fixture retirement because Supabase Auth returned a transient non-JSON sign-in error after the browser assertions had passed. Its disable/ban path ran; independent read-only verification found five generated owner fixtures in the run window, all disabled and banned with no roles. Global sign-out for the affected fixture is not claimed. Ignored artifacts: test-results/inline-validation-live.json and inline-validation-mobile.png.
