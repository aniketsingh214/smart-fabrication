> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: active production deployment on Vercel

# Release Notes

## 2026-10-24 — Release 1.0.0: Laser Cutting Gates, Mobile Sticky Header Search & Dynamic Bilingual SSR Sync

- **Laser Cutting Gates Ingestion & Catalog Scale (432 Products)**:
  - Created new top-level category `Laser Cutting Gates` (`laser-cutting-gates`) with 4 specialized subcategories:
    - `modern-cnc-gates`: Modern Geometric & CNC Sheet Gates
    - `floral-laser-gates`: Intricate Floral & Nature CNC Cut Gates
    - `luxury-black-gold-gates`: Luxury Black & Gold Dual-Tone Accent Gates
    - `laser-sliding-gates`: Motorized Heavy-Duty Laser Cut Sliding Gates
  - Ingested 22 flagship laser-cut gate designs (`GATE-LSR-001` through `GATE-LSR-021` + variants) with high-definition Cloudinary imagery.
  - Total catalog scaled to **432 published products** and gallery expanded to **420 verified items**.
- **Mobile-First Sticky Header Search Architecture**:
  - Removed hero search bar from homepage per user instructions for a cleaner, modern layout.
  - Built unified `GlobalSearchBar` component (`src/components/layout/global-search-bar.tsx`) with search query persistence (`value={query}` synced with URL parameter `?q=`).
  - Added instant Clear (✕) button and dedicated Search action icon button.
  - Integrated category quick-suggestion dropdown directly in the search bar.
  - Enhanced `PublicHeader` (`src/components/layout/public-header.tsx`) with a dedicated full-width Row 2 search bar on mobile screens, permanently accessible during scrolling, and centered in navigation for desktop viewports.
- **Dynamic Bilingual Switcher & Server Re-rendering**:
  - Updated `LanguageSwitcher` and `CompactLanguageToggle` to invoke Next.js `router.refresh()`, triggering immediate server component re-rendering upon cookie change (`sf_locale`).
  - Refactored `src/app/(public)/contact/page.tsx` with `getServerLocale()` for clean bilingual rendering without language mismatch.

---

## 2026-10-23 — Release 0.9.0: Homepage Visual Excellence & Gallery Purification

- **Gallery Purification**:
  - Purified `/gallery` from generic/stock imagery to 398 authentic fabrication and gate project photos.
  - Added gallery real-time search and category filtering with cursor pagination.
- **Interactive Visual Components**:
  - **6-Slide High-Impact Hero Banner Carousel** (`HeroBannerCarousel`) with autoplay, touch swipe, manual navigation arrows, and bilingual title/subtitle.
  - **Interactive Before & After Transformation Slider** (`BeforeAfterSlider`) with before/after comparison of worn rustic iron gate vs. modern luxury CNC laser-cut gate.
  - **Workshop Video Reels Showcase** (`VideoReelsShowcase`) featuring real fabrication floor processes (plasma cutting, argon TIG welding, powder coating).
  - **Fabricator Comparison Matrix** (`ComparisonMatrix`) contrasting SmartFabrication vs. unorganized local fabricators (clear pricing, laser accuracy, warranty, on-site measurement).
  - **Mobile Sticky Action Bar** (`MobileActionBar`) providing persistent quick actions: Call, WhatsApp, Free Estimate, and Catalog.

---

## 2026-10-22 — Release 0.8.0: Commercial Rolling Shutter Album & 2-Tier Subcategory Drill-Down

- Sourced and ingested 100+ commercial rolling shutter and iron pipe gate models with Cloudinary media integration.
- Implemented 2-tier Category & Subcategory drill-down architecture in catalog and navigation.
- Subcategories configured: `commercial-rolling-shutters`, `industrial-heavy-shutters`, `perforated-grill-shutters`, `motorized-remote-shutters`.
- Added dynamic subcategory pills and filter parameters on `/catalog` and `/gallery`.

---

## 2026-10-18 — Release 0.7.0: End-to-End Operational Workflows & Standalone Mobile SDK

- Verified business modules:
  - **Materials & BOM**: Append-only rate versions, margin limits, confidential component redaction.
  - **Inventory & Stock Control**: Balance ledger reconciliation, movement idempotency, negative stock prevention, reservation bounds, server-derived consumption costing.
  - **Labour & Production**: Worker creation, staged work orders, quality check trigger gate, wage privacy RLS.
  - **Delivery & Installation**: Delivery scheduling, guarded transitions ('scheduled' -> 'dispatched' -> 'delivered'), verified private proof media gate, 4-point installation checklist.
  - **Financial Workflows**: Operating expenses lifecycle, immutable reversals, owner drawings exclusion, supplier payables/returns/refunds, period closures.
  - **Reporting & Audit**: Filtered trend charts, KPI reconciliation, keyset balance pagination, streamed CSV exports.
- **Standalone Mobile SDK**: TypeScript SDK verified across 7 live flows without browser/cookies dependency.

---

## 2026-10-17 — Release 0.6.0: Cloudinary Media Integration & Mobile CMS Publication

- Cloudinary development environment integrated; signed private upload, provider verification, atomic DB confirmation, expiring private delivery.
- Real mobile CMS publication verified: site sections publish and update live for anonymous mobile visitors.
- Added product-level delivery/installation availability flags (`delivery_availability`, `installation_availability`).
- Homepage category cards populated dynamically from database.

---

## 2026-10-16 — Release 0.5.0: Deterministic Cursor Pagination & SEO Routes

- Catalog and consented gallery lists migrated to deterministic `created_at`/`id` cursor pagination (48-row pages).
- Public `/about` 5-stage fabrication process page implemented.
- Dynamic `/sitemap.xml` and `/robots.txt` routes deployed for search engine indexing.

---

## 2026-10-15 — Release 0.4.0: Notifications Continuation & CRM Quotation Lifecycle

- Owner-scoped cursor pagination for notifications; mark-read timestamp preservation.
- CRM lead follow-ups, quotation lifecycle with historical PDF generation, and customer order conversion.

---

## 2026-10-14 — Release 0.3.0: Core Application Runtime & Database Schema

- Next.js 16 App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL with RLS across all 58 tables.
- 6-role permission matrix, OpenAPI 3.1.0 contract generation (292 paths).

---

## 2026-10-14 — Release 0.1.0: Phase 01 Planning Artifacts

- Phase 01 planning artifacts prepared: initial requirements analysis, 34 traceable requirements, 20 phases, master plan baseline.
