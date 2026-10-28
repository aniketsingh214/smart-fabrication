> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (live); interactive components active

# Website Content

## Source specification

- **Functional scope:** Banners, hero heading, buttons, featured items, offers, About, Contact, address/map, hours, social links.
- **Rules / acceptance:** Draft/publish, cache revalidation, SEO and content sanitization.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.

### Public About/process completion — 2026-10-16

/about reads published about/process website_sections, presents five enquiry-to-installation planning stages, shows a labeled/credited Cloudinary demo photo and links to catalog/contact. Footer discovery, sitemap inclusion and mobile layout passed the 24-check public suite. Default copy describes the workflow without fabricated workshop tenure, addresses or prices; actual workshop content and legal/retention decisions remain required. Photo inspiration links carry fixed source references into the enquiry text.

## High-Impact Visual Components & Mobile Search Architecture — 2026-10-24

A suite of interactive, modern visual components and responsive UX enhancements were deployed to maximize visitor engagement:

1. **6-Slide Hero Banner Carousel** (`HeroBannerCarousel`):
   - Features 6 high-definition fabrication banners (Laser Gates, Rolling Shutters, Commercial Sheds, Modern Railings, Metal Pergolas, Iron Gates).
   - Automated 5-second slide transitions, touch swipe support, navigation arrows, slide dots, and bilingual titles with direct CTAs (`Explore Catalog`, `Price Estimate`).
2. **Interactive Before & After Transformation Slider** (`BeforeAfterSlider`):
   - Interactive draggable comparison slider showcasing the renovation of a rusted iron gate into a modern precision CNC laser-cut entrance gate.
   - Touch-enabled handle with responsive badges for "Before (पुराना गेट)" and "After (नया लेज़र गेट)".
3. **Workshop Video Reels Showcase** (`VideoReelsShowcase`):
   - Displays real workshop process video clips (CNC laser cutting, argon TIG welding, durable powder coating).
   - Interactive play preview modal with sound toggle and mobile reel layout.
4. **Fabricator Comparison Matrix** (`ComparisonMatrix`):
   - "Unorganized Local Welder vs. SmartFabrication" comparison table highlighting guaranteed gauge thickness, laser accuracy, itemized transparent quotes, 3-year warranty, and doorstep site measurement.
5. **Mobile Sticky Action Bar** (`MobileActionBar`):
   - Persistent bottom action bar on mobile viewports providing 1-tap access to Call Now, WhatsApp Chat, Free Estimate, and Catalog.
6. **Mobile-First Sticky Header Search Architecture** (`GlobalSearchBar` & `PublicHeader`):
   - Removed hero search bar from homepage per user feedback to prevent visual clutter.
   - Built a unified `GlobalSearchBar` component with query retention (`value={query}` synced with `?q=`), instant clear button (✕), search submission, and quick category suggestions dropdown.
   - Positioned permanently visible in Row 2 of `PublicHeader` on mobile viewports for effortless one-handed thumb interaction during scrolling.

## Royal Gates logo - 2026-10-28

Owner-supplied black/gold crowned gate artwork now appears in the header, footer, login and admin sidebar. The original PNG is preserved at /royal-gates-logo.png; intrinsic 1672x941 dimensions and responsive widths prevent distortion. Compact admin initials use RG. Browser/build/deployment evidence is maintained in [progress](../progress.md).

## Royal Gates responsive presentation - 2026-10-28

The two supplied WebP logos replace legacy asset references. Header/search/navigation, dark footer, login brand panel, typography and shared surfaces follow the [Royal Gates design system](../operations/royal-design-system.md). Actual business content, prices and project claims are not certified by this visual change.
