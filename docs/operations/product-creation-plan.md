# Product creation workspace plan

Status: proposed; application implementation has not started. Requested 2026-10-28.

## Existing implementation to reuse

`src/contracts/resources.ts` already defines products with category references, indicative weight, material, price range, status, service availability and custom-size fields. Variants store width/height in millimetres. Product media has confirmed media references and display ordering. `src/features/media/upload.ts` already signs, uploads to Cloudinary and confirms assets through the existing API. The current media uploader handles one file at a time separately from the product form. Keep these protections and reuse their services.

The category selector already exists. The missing experience is a dedicated, integrated product workflow with multiple images, size selection and persisted per-kg pricing. Inspect the existing money field formatting before making changes: technical minor-unit storage does not imply that the user currently enters paise.

## Proposed page

Preserve `/admin/products?new=1` and existing edit/bookmark routes. Render inside the current admin rails and topbar, with responsive section cards, inline red field errors and a sticky Save draft / Publish action area.

1. Basic details: name, required database category, optional subcategory and description. Suggest SKU/slug automatically; allow editing in Advanced details and validate uniqueness on the server.
2. Size and material: category-specific saved size dropdown plus Custom; explicitly label Width and Height, allow feet/inches input and convert to canonical millimetres. Use database-backed/configured material choices. Keep finish and service availability in optional details.
3. Weight and pricing: editable approximate weight in kg; selectable configured selling rates in INR/kg with custom input. No sample rates are seeded as approved workshop rates. Show weight x rate as an indicative base price, with explicit inclusions/exclusions for labour, finish, tax, transport and installation. Store the selected rate and pricing mode rather than deriving a rate later from rounded totals. Preserve existing range/BOM-based pricing as an alternative; do not overwrite unrelated product pricing.
4. Images: select or drop up to five JPG/PNG/WebP images, each within the existing 10 MB limit. Show immediate local previews, file errors, upload progress, retry, cover selection, remove and accessible move-left/right controls. Cover is the first image by saved order. Validate count/type/size on server as well as browser. Preserve existing video/media features and legacy products with more media; the five-image rule must not silently remove old assets.
5. Review: show selected dimensions, approximate weight, rate, indicative base price, cover and publication state before saving. Draft can be incomplete where existing contracts permit; Publish validates required data and confirmed cover image. Keep failures beside the relevant field and show green success feedback only after confirmed save.

## Calculation rules

Weight cannot be inferred from dimensions alone. Only calculate it when a valid product BOM/material specification or explicitly configured category weight rule exists. Otherwise leave it for the administrator to enter. Distinguish an estimate from a measured weight and preserve a manual override when changing size unless the administrator chooses recalculation.

Use decimal-safe server calculations with explicit rounding into existing integer minor units. Recompute totals on the server. For illustration only, 115 kg x INR 110/kg gives INR 12,650 before any separately defined extras. Do not publish this example as business pricing.

Do not automatically create five variants from one selected size. Save the selected base dimensions; create additional variants only for sizes explicitly selected by the administrator, each with supported weight/pricing data.

## Save and recovery

Use the existing authenticated, rate-limited signing/upload/confirmation flow. Bound concurrent uploads, preserve successful uploads during retry and show partial failures. After confirmation, atomically save product data, selected variants and media associations through a permission-checked API operation/RLS-compatible transaction. Add an idempotency key to prevent double-submit duplicates. External Cloudinary uploads cannot share a PostgreSQL transaction: unassociated confirmed assets remain recoverable under the existing retention process; do not delete shared assets or report a partially published product as success.

Add only the required schema fields for per-kg pricing and base dimensions after auditing current migrations and existing records. Preserve historical quotations, calculator snapshots, pricing engines, stock and financial entries. Update API schemas/examples and mobile contracts alongside the additive change.

## Delivery order and acceptance

1. Audit current product schema, money input, public price presentation, media ordering and BOM/variant relationships; record exact migration/API changes.
2. Add dedicated create/edit form with category/size/material choices, pricing preview and inline validation.
3. Integrate five-image preview/upload/cover/retry into the same form and permission-checked save operation.
4. Verify draft/edit/publish, public catalog cover/details, size conversion, manual weight preservation, pricing modes and existing media compatibility.
5. Test invalid/oversized/sixth images, failed uploads, retries, double submit, rate limits, permission denial, duplicate SKU/slug, decimal pricing boundaries and atomic save rollback. Check keyboard navigation and 320/390/768/1024/1440/1920 layouts.
6. Run meaningful automated tests, lint/typecheck, production build and documentation/security checks. Publish the verified change through the authorized GitHub/Vercel flow and confirm the deployed create/edit/public journey.

This document records a plan, not implemented product functionality or acceptance evidence.
