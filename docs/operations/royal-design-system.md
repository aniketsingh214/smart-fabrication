# Royal Gates visual system

Updated: 2026-10-28. Shared public/account/admin presentation; no business-data migration or permission changes.

## Identity and assets

- Owner-provided transparent emblem: /rg-logo-no-bg.webp (1971 x 798), used on the public header, dark footer and admin rail.
- Owner-provided background emblem: /rg-logo.webp (1972 x 798), used in the login brand panel. Original artwork is not cropped, recoloured or stretched.
- BrandLogo owns intrinsic image ratios, responsive delivery sizes and the Royal Gates wordmark. Collapsed admin navigation uses RG. A small RG/crown SVG replaces the previous browser icon.
- Old public logo files were already removed by the user; active components now reference the two supplied WebP files.

## Colour and typography

Charcoal #1a1e20 anchors navigation/footer; gold #c7a24f marks selection and primary actions; warm white #f7f6f2 and white separate content surfaces. Fine neutral borders, modest shadows and consistent rounded corners replace the competing blue/purple/teal treatments. Success, error, destructive and operational status colours remain semantic, with labels retained.

Inter variable and Noto Sans Devanagari variable fonts are bundled locally through next/font/local, with swap and system fallbacks. Their original SIL OFL licences are retained in public/fonts. Body and font-sans utilities share the same stack. Forms use a consistent 12px label/14px input scale, tables 13px data, and headings a restrained negative tracking scale. Numeric table values retain tabular spacing. Local Font Awesome Free 6.4 CSS/webfonts are bundled from public/css, with decorative glyphs aria-hidden and visible text/accessibility labels retained. Existing Lucide controls remain supported.

## Components and navigation

- Public header: responsive emblem/wordmark, search, segmented language control, wishlist/cart, design/account navigation and quote action. Narrow-screen navigation wraps labels rather than expanding the document.
- Footer: dark four-column information hierarchy, project/design/help links, brand panel and compact bottom row; stacks to two/one columns on smaller screens.
- Admin: charcoal eight-entry rail, independent white contextual rail, gold active states, translucent sticky topbar, local search, account/notification shortcuts and compact footer. Existing role filters, URLs and record tabs remain intact.
- Cards/KPIs: shared border/radius/shadow, consistent icon tiles and chart palette. Existing data definitions, demo scope and financial captions are preserved.
- Tables: white toolbar, neutral header, subtle row hover, semantic view/edit/archive controls and existing sorting/pagination. Wide data scrolls inside its table container.
- Forms/dialogs: shared spacing, single-column mobile fields, sticky save areas and constrained dialogs. Inline red validation and green/error toasts retain their accessibility and posting/retry behavior.
- Login: background-art brand panel on large screens and a single compact form card on mobile. Authentication and safe-return logic unchanged.

## Responsive and accessibility checks

Target widths: 320, 390, 768, 1024, 1440 and 1920px; public header checked in English and Hindi. CSS keeps local table/tab scrolling, keyboard focus, mobile drawer Escape handling, independent rail collapse, reduced-motion preferences and inline field errors. Review screenshots are local ignored artifacts, not business-content approvals.

The initial responsive run identified a 22px overflow in the mobile quote navigation label; it now wraps inside its column. A stale existing dev-server stylesheet error was avoided with an isolated preview: SF_NEXT_DIST_DIR=test-results/next-design, npm run dev -- --port 3001. The optional dist directory does not change normal builds or deployments. Final build/browser evidence is maintained in ../progress.md.

No stock/payment/order mutations, accountant approvals, prices, project counts or new business claims are introduced by this visual work. Existing procurement API contract gaps remain outside this change.
