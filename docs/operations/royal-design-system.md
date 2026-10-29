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

## Final verification

Release 0ccbdf5 deployed and all six browser groups passed on https://smartfabrication.vercel.app. Checks include actual populated core lists and reject hydration console errors, not only loading placeholders. The eight existing table/edit/remove/validation regression groups passed locally with intercepted category writes. 299 unit/integration tests, final production build, targeted lint without warnings, documentation and secret checks passed. Temporary test identities retired. Existing local port 3000 was restarted with its stale dev cache preserved and confirmed to return 200 with the new login UI.

## 2026-10-28 - Emblem-only branding and account navigation refinement

- Removed the added brand name/tagline next to or below the shared logo in public header, footer, admin sidebar and authentication branding. Supplied image artwork is unchanged.
- Replaced inline admin sign-out with an accessible account dropdown: account, permitted Settings/Staff links and sign-out. Public account dropdown includes account, saved designs, cart and a staff workspace link only for authorized users. Guest menus omit staff and sign-out actions.
- Compacted sidebar branding and navigation, balanced emblem sizes, refined topbar/header spacing and retained the charcoal/gold design and shared English/Hindi typography.
- Dropdown supports click, Tab navigation, Arrow Down entry, Escape with focus restoration and outside-click dismissal. Mobile dropdown bounds checked at 320px and 390px.
- Validation: targeted ESLint, TypeScript and production build passed. Guest browser checks passed. Full responsive browser results are recorded in the design-system operations document.

Refinement acceptance: all 7 Royal design browser groups passed locally, including the new account interaction checks, six viewport widths, both languages, admin/public pages, rail/drawer behavior and inline form validation. Browser hydration/page errors: none. Temporary test account retired. Separate guest menu check passed at 320px.

## 2026-10-29 - Compact mobile header and first-login destination

- Public mobile header now has two compact rows: emblem/wishlist/cart/menu, followed by full-width search. The crowded five-link navigation strip and search-row language control move into an accessible menu disclosure, retaining all links and language selection.
- Menu supports outside click, Escape with focus restoration, keyboard links, nested account disclosure and bounded scrolling on short screens. Desktop navigation remains available.
- Fixed successful password login defaulting every user to /account. Verified profile permissions now choose the dashboard or first permitted workspace; customers retain /account. Explicit safe account/admin return destinations are preserved. A failed profile lookup still navigates to the protected account page after successful sign-in.
- No auth grants, RLS, database schema or business pricing changes. Targeted auth/destination tests and production build passed. Mobile Hindi browser checks passed at 320/390/600/767px; full responsive acceptance tracked separately.
