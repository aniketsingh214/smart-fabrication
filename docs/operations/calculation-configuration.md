# Workshop calculation configuration and history

Updated: 2026-10-17. Technical implementation is distinguished from approved workshop inputs.

## Current business-data audit

`npm run calc:review` runs in a read-only repeatable-read transaction and writes an ignored local report. Before the current calculator acceptance fixtures, it found **zero active materials, zero rate versions and zero published products**. This is an unconfigured workshop, not a successful production configuration. The user's “ok done” acknowledged the request but supplied no rates/BOM file or actual values. No business rates/formulas have been invented.

The audit checks presence of published BOM/rules, empty/inactive/missing-rate BOM components and unavailable services with nonzero configured charges. It reports at most 100 problem details with explicit truncation and complete counts. Populated rows never imply workshop approval. Test rates may remain as immutable history linked to deactivated, clearly named test materials and archived products.

## Configure in this order

1. `/admin/materials`: create the actual section/hardware/paint variants, thickness and weight per canonical unit. Supported units are `kg`, `m`, `piece`, `litre`, `sheet`. A rate is per that exact unit; there is no guessed metre-to-kg or sheet-to-area conversion.
2. `/admin/material-rates`: append purchase/selling rates in INR with their effective timestamp. Money inputs are rupees in the UI and integer paise in the API. Future rates do not price current estimates. New rates never rewrite old ledgers/quotations/estimates.
3. `/admin/bom-versions` and `/admin/bom-items`: create a new draft version for a product, with each canonical-unit quantity per square metre and explicit wastage. Review the inputs, then publish. Published history is immutable; corrections require another version.
4. `/admin/calculation-rules`: supply the reviewed labour/finish rates per square metre, fixed hardware/delivery/installation charges, margin in basis points and approximate range percentage. Publish a new version after review. A service marked unavailable must not have a nonzero pricing charge.
5. Use `/estimate?product=<published UUID>` to verify boundary/example dimensions, weights, quantities and prices against independently reviewed workshop examples. Results remain approximate and do not approve structural/material suitability or replace a measured quotation.
6. `/admin/estimate-history` and `/api/v1/admin/estimate-history`: staff with `materials.read` can inspect original immutable inputs/results, formula and BOM version. Pagination/export follows the resource API. There is no history-edit/create endpoint. Legacy stored results retain their original shape; no rate IDs are backfilled into old records.

## Formula implemented

The current version is `area-bom-v1`: face area = width_mm × height_mm / 1,000,000; each material quantity = area × configured quantity_per_sq_m × (1 + wastage/100), rounded to four decimals. Each line is rounded to paise using its effective selling rate. Add area-based labour/finish and configured fixed hardware/delivery/installation, then the configured margin and range. Material weight uses the explicit kg-per-canonical-unit factor. New result lines also identify material UUID, exact rate UUID and effective timestamp; these are audit provenance, not client-controlled pricing inputs.

Null/out-of-range dimensions, empty/missing configurations, any inactive BOM material, missing current rates and unavailable-but-charged services fail rather than returning a partial price. Successful RPC output is validated against an explicit API DTO; malformed output produces a sanitized server error. The calculator retains entered dimensions after failures, prevents concurrent submissions and carries the chosen product/indicative dimensions to the quotation enquiry.

## Verification and remaining input

Latest read-only development audit (2026-10-17): 0 active materials, 0 published products, 0 configured published products and 9 retained synthetic rate versions. No published configuration means an empty issue list is not readiness approval. Test materials are deactivated and test products archived after acceptance. “ok done” supplied no actual workshop data.

To complete business configuration, record the actual material names/codes/canonical units/weight factors, dated purchase and selling rates, product BOM quantities/wastage/visibility, service coverage, labour/finish/fixed charges and independently checked dimension/price examples. Enter these through the existing admin workflows, then run `npm run calc:review` and compare calculations to those examples. Do not import TEST ONLY history as workshop defaults. Optional depth/customer-selected thickness requires a separately reviewed formula extension.

The local 46-migration native restore rehearsal passed 227 SQL/RLS workflow checks and 15 committed concurrency assertions. New cases cover exact provenance, future/effective rate selection, old estimate/quotation/stock preservation, published-rule immutability, kg/piece BOM version changes, missing rates, partial inactive BOMs, service conflicts and min/max/null dimensions. The real browser/API calculator acceptance result is recorded in progress after completion.

Actual workshop data and independently approved examples remain required. Optional depth/customer-selected thickness need an explicitly reviewed formula/configuration; they are not silently interpreted by the current 2D engine. Draft-formula preview and protected estimate history are implemented; actual workshop configuration and independently approved examples remain open. No accountant or workshop approval is asserted by synthetic tests.

## Draft preview and internal components

Open a pricing-rule detail and choose Preview calculation, or visit `/admin/calculation-preview`. Select the product, exact BOM and pricing-rule versions, and dimensions. Both `materials.read` and `catalog.read` are required by the page, API and database helper. Draft/published versions must belong to that product. `POST /api/v1/estimates/preview` returns `preview: true` without an issued estimate ID; no snapshot or published-price change occurs. Public and private flows share one SQL calculator, preventing divergent arithmetic. Anonymous/customer callers and direct helper execution are denied.

New BOM lines have a Show material to customer flag, defaulting true for compatibility. Internal lines still contribute fully to quantities, weight, costs and totals. Public estimate responses omit those line details; a fully internal BOM can therefore have an empty public materials array while retaining a valid full price. Staff preview/history keeps all components. Existing published BOMs remain immutable; review visibility in a new version. Old snapshots are never backfilled/reinterpreted.

New API DTOs distinguish public and private preview material visibility. The cookie-independent typed example is `examples/mobile/calculation.ts`; it validates inputs/results and does not automatically retry snapshot-creating requests. Public enquiries receive only validated product/dimension context, not an approved price or verified measurement.
