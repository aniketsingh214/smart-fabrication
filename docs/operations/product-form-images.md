# Product form image upload

Updated: 2026-10-30

Add product includes a visible Choose images control before fabrication settings and product details. Select up to five JPG/PNG/WebP images, maximum 10 MB each. Preview, remove, and choose the cover before saving. Selection alone makes no upload request. Save verifies/uploads selected files through the existing media sign/upload/confirm flow, creates the product, and links its images in cover-first order.

Edit product retains the persisted gallery manager: upload more images (up to five total), choose a cover or remove a product image link. Its uploader waits for the gallery read to succeed; failed initial reads offer Retry loading images. Product Save/Cancel is disabled during image actions. Upload requires media.write in addition to catalog write permission. Publication guards remain unchanged.

## Failure and cancellation behavior

Product creation and media links are separate requests. During the same Add session, confirmed uploads and successful links are remembered. If linking fails after product creation, Retry images completes pending links using that product; it does not recreate the product or upload confirmed files again. Before retrying a link, the client checks the saved product gallery to recover from a lost successful response. This is client-session recovery, not a cross-session transaction. Reload/Cancel after a partial save preserves the created product; reopen Edit to review its images. Verified uploads without links remain subject to the existing media retention policy.

## Verification

- Three focused unit tests cover partial upload retry, lost link-response recovery and partial link retry.
- Full unit/integration suite: 329 tests in 70 files passed.
- Browser harness: scripts/test-product-form-images-browser.mjs. Uses a generated owner login, mocked catalog/media writes and mocked Cloudinary transport; no real product/image fixture is created. Checks Add selection/preview/validation/cover, Save with partial failure and Retry, Edit upload and details save, six responsive widths (320/390/768/1024/1440/1920), no nested forms or page/hydration errors. Generated login is retired afterward.
- This task does not claim a real Cloudinary roundtrip; it reuses the existing verified upload API and permissions.
- Final browser/deployment results are recorded in progress.md.
