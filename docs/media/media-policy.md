> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: planning draft; not implemented

# Media policy

Cloudinary only; signed constrained uploads, actor/context ownership verification, file type/size/count limits, sensitive assets private/authenticated. Concrete quotas and permitted formats require Phase 05 review.

## Current private PDF policy — 2026-10-16

Migration 39 permits PDFs only as owned private invoice media, maximum 10 MB. Both signing and confirmation enforce context-specific formats; guest designs, delivery proof and product contexts reject PDFs. Delivery requires authorization and returns a short-lived attachment download. Six real media browser checks passed, including provider-confirmed PDF bytes and anonymous denial. No global Cloudinary security setting was changed. Retention/orphan handling remains a separate acceptance item. See [implemented flow](upload-flow.md).
