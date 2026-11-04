# Homepage and private visual discovery

Updated: 2026-11-04

The latest attached instructions preserve the existing main hero, logo, navigation structure, footer, product data and business workflows. The scoped home-below-hero theme uses white, #F8FAFC, navy #12304A, text #475569, gold #D6A640 and borders #E2E8F0. Existing section order, images, copy and actions are retained. Existing portfolio imagery is explicitly labelled catalogue references rather than certified completed customer work. The hero markup and original logo assets are unchanged in this change.

## Search and catalogue

The compact header search opens a native dialog only through user interaction. It supports close/Escape, focus restoration, scrolling, responsive cards, category selection, debounced name/SKU/category/material search and existing product/estimate links. A new read-only GET /api/v1/search/catalogue returns 100 published rows per opaque page, selecting only public product images. Prices, product IDs and slugs come from the live database; there is no seeded fallback catalogue or invented price.

## Actual image matching

Visual search uses the pretrained Xenova/clip-vit-base-patch32 model through Transformers.js, pinned to revision 6b7c523703ae26e39be4b03774966f8571c7f523. A dedicated browser worker creates 512-dimensional vectors from the actual uploaded image and actual catalogue image pixels; normalized cosine similarity ranks candidates. Optional text contributes 15 percent of combined ranking, with visual similarity retaining priority. Low-score candidates are excluded; scores are not advertised as calibrated match confidence.

No paid API credential is required. Model weights are downloaded from the public model host on first use, so this first download and catalogue indexing can be slow on mobile/CPU devices. Progress, stop, retry and no-match states remain available. Text discovery loads without the model. Public catalogue vectors are cached in IndexedDB using model revision, media asset identity and product update time. Fresh catalogue pages are loaded on reopening, so added/edited/removed/unpublished products use current public rows, and changed image identities recompute their vectors. The full current catalogue is compared; results may appear progressively while indexing.

Reference JPG/PNG/WebP files are limited to 8 MB and 25 megapixels and decoded before use. Gallery and capture inputs use the device's native picker; actual camera availability depends on device/browser permission. The reference image and its vector remain in worker memory, are not sent to an AI provider or our backend, and are not persisted in the public-vector cache. Closing/removing/stopping terminates work. Only model files and public catalogue images are downloaded. Model/network/browser failures show errors, never random results.

Model documentation: [Transformers.js image feature extraction](https://huggingface.co/docs/transformers.js/api/pipelines#module_pipelines.ImageFeatureExtractionPipeline).

## Verification

Focused tests cover real DTO mapping/public-image filtering, unavailable configuration, real-input ranking, visual priority, cosine calculation and category filtering. Browser harness scripts/test-home-discovery-browser.mjs checks real published products/routes, navigation, preview validation/removal, six screen widths and actual CLIP inference against three real catalogue images (no model/ranking mocks). This bounded inference acceptance does not benchmark full-catalogue mobile indexing. No business writes are required. Final results are recorded in progress.md.

Portfolio image repair: live screenshot review found the original demo-stock/sliding-driveway-gate reference returned HTTP 404. Reused the existing published Motorized CNC Laser Cut Steel Sliding Gate photograph (laser-gates/laser-5653e8) for that single portfolio tile. No product image record, photograph content or other asset was changed/generated. Browser harness now checks that all six portfolio image elements decode successfully.
