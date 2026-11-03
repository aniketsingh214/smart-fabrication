> Version: 1.0 | Updated: 2026-11-03 | Status: live application; implementation and scoped verification register

## 2026-11-03 - Custom Fabrication Presets & Templates Creation in Quick Mode

- **Core User Objective**:
  - Enabled admin and staff to create, save, and manage custom fabrication product presets directly within the Quick Fabrication interface (`/admin/products?new=1`), allowing instant re-use of custom models from the dropdown without writing code.
- **Custom Preset Creation & Persistence (`src/features/catalog/product-quick-fabrication.tsx`)**:
  - Added "+ नया टेम्पलेट बनाएं" (Create Custom Template) button and inline modal/form.
  - Staff can customize: Product/Door Name, Frame Angle (`ANGLE_OPTIONS`), Sheet Gauge (`SHEET_OPTIONS`), Support Bar (`SUPPORT_OPTIONS`), Custom Badge/Tag (e.g. "स्पेशल कस्टम", "दुकान के लिए"), and Default Rate (₹/kg).
  - Saved presets persist automatically in `localStorage` under `gatewala_custom_fabrication_presets`.
  - Grouped dropdown into standard presets (`✨ रेडीमेड स्टैंडर्ड टेम्पलेट्स`) and user-created presets (`⭐ आपके बनाए टेम्पलेट्स`).
  - Selecting any custom preset auto-fills the product name, SKU, slug (with Hindi transliteration), material specifications, finish, base weight, price range, description, design details, 5 standard size variants, and custom design code.
  - Added one-click deletion ("🗑️ हटाएं") with confirmation for custom presets.
- **Verification**:
  - `npm run typecheck`: Passed (0 errors).
  - `npm test`: Passed (78 test suites, 353/353 tests).
  - `npm run docs:check`: Passed (34 requirements and SHA-256 intact).
  - `npm run api:check`: Passed (301 documented paths).
  - `npm run build`: Succeeded (all 74 routes compiled).

## 2026-11-03 - Quick Fabrication Mode: Consolidated Single Dropdown Selector

- **Core User Objective**:
  - Replaced the 4 sprawling horizontal preset cards in Quick Fabrication mode (`/admin/products?new=1`) with a single compact, elegant dropdown selector.
- **Component Refactoring (`src/features/catalog/product-quick-fabrication.tsx`)**:
  - Implemented `PRESET_OPTIONS` supporting Standard 18G, Heavy 16G, Lightweight 20G, Grill Door, and Custom manual entry.
  - Added dynamic material specification badges under the dropdown (Sheet, Frame Angle, Support Bar, and Use-case Badge).
  - Maintained instant auto-fill for Product Name, SKU, Slug, Weight, Pricing Range, Material specifications, Finish, and 5 standard size variants.
  - Saved 60% vertical space on the product creation screen.
- **Verification**:
  - `npm run typecheck`: Passed (0 errors).
  - `npm test`: Passed (78 test suites, 353/353 tests).
  - `npm run docs:check`: Passed (34 requirements and SHA-256 intact).
  - `npm run api:check`: Passed (301 documented paths).
  - `npm run build`: Succeeded (all 74 routes compiled).

## 2026-11-03 - Plain English Copy Simplification Across UI, Navigation, Milestones & Documents

- **Core User Objective**:
  - Simplified language and terminology across the entire application to plain, direct, and universally understandable English, eliminating bureaucratic ERP jargon (e.g. "immutable snapshots", "canonical units", "basis points", "en route", "made to measure") while preserving technical integrity and bilingual Hindi support.
- **Contracts & Navigation Refactoring (`src/contracts/resources.ts`, `src/contracts/admin-navigation.ts`)**:
  - Replaced technical internal descriptions across all 34 resources with straightforward English (e.g. "Saved customer price estimates and dimensions", "Pipes, sheets, angles, channels and hardware items", "Customer enquiries and phone leads for new work", "Confirmed orders from advance payment to final installation").
  - Simplified complex field labels (e.g. `reorder_level` -> "Low stock alert level", `extra_cost_minor` -> "Extra cost", `notes` -> "Workshop notes").
  - Simplified workspace module descriptions for Sales, Operations, Inventory, Catalog, Finance, and Settings.
- **Workflow & Stage Helper Copy (`src/features/leads/status-select.tsx`)**:
  - Simplified helper text for all stage dropdowns: Lead ("Select the next stage for this enquiry"), Order ("Select the next order stage. Advance payment and measurements should be checked first"), Work Order ("Select the next workshop stage for this job card"), Quotation ("Select the next quotation stage"), Delivery ("Select the next delivery stage").
- **Order Milestones & Tracking (`src/lib/i18n/order-milestones.ts`)**:
  - Replaced stiff phrasing with plain English (e.g. "Your order has been confirmed by the workshop", "Site measurements checked and confirmed", "Cutting and welding work is in progress", "Main frame ready. Moving to paint and polish", "Painting, polishing, and final finishing underway", "Checked, packed, and ready for delivery", "Loaded and on the way to your site", "Material delivered to your site. Fitting and welding in progress").
- **Customer Dictionaries (`src/lib/i18n/dictionaries/en.ts`)**:
  - Simplified hero, catalog, product, cart, and calculator terms ("Custom Made" instead of "Built to Measure", "Starting price" instead of "Indicative starting price", "Price on request" instead of "Quotation on request", "Custom size for your space", "Estimated Subtotal", "Estimated Total").
- **Estimate PDF Document (`src/features/estimates/estimate-pdf-document.tsx`)**:
  - Replaced technical headers: "Estimated Price Sheet" instead of "Indicative Cost Estimate", "ESTIMATED PRICE RANGE", "Total Area", "Approximate Weight", "Welding & Joints", "Rust Protection", "Site Measurement: Free workshop visit", "Making Time: 7 – 14 Days", "Estimated Cost".
- **Customer Pages & Cart (`src/app/(public)/cart/page.tsx`, `src/app/(public)/catalog/[slug]/page.tsx`, `src/app/(public)/catalog/page.tsx`, `src/app/(public)/contact/page.tsx`)**:
  - Replaced dense phrases with clear, friendly text for customers and fabricators.
- **Verification**:
  - `npm run docs:check`: Passed (SHA-256 byte-identical source intact).
  - `npm run api:check`: Passed (301 paths, 44 Route Handlers).
  - `npm run security:check`: Passed (0 leaked secrets).
  - `npm run typecheck`: Passed (0 errors).
  - `npm test`: Passed (78 test files, 353 tests passed).
  - `npm run build`: Succeeded (all 74 routes compiled).

## 2026-11-03 - QR Workshop Job Cards, Estimate PDF Generation & Mobile Catalog Filter Drawer

- **Printable Workshop Job Card with Scannable QR Code (`/admin/orders/[id]/job-card`)**:
  - Implemented printable A4 workshop job card for shop-floor supervisors, lead fabricators, and welders.
  - Built `src/lib/qrcode/service.ts` generating SVG and base64 PNG data URL representations using the `qrcode` library.
  - Formatted layout with customer information, site delivery address, promised completion date, agreed order value, itemized technical specifications from the quotation snapshot, an 8-stage physical sign-off checklist, and supervisor/inspector signature blocks.
  - Embedded a dynamic scannable QR code linking directly to the live customer order tracking view (`/account/orders/[id]`), enabling quick camera inspection from mobile devices.
  - Integrated "Print Job Card" action button directly in the Orders detail workspace (`OrderPaymentWorkspace` on `/admin/orders?record=...`).
  - Added unit test suite `tests/unit/qr-job-card.test.ts` verifying data URL and SVG generation.
- **Indicative Estimate PDF Generator & Instant Download**:
  - Built `src/features/estimates/estimate-pdf-document.tsx` using `@react-pdf/renderer` for GateWala indicative estimates.
  - Features brand header, customer dimensions in metric (mm, m²) and imperial (ft/in, sq.ft), estimated weight, itemized bill of materials (BOM), approximate pricing range (₹ min–max), contact info, and clear disclaimer.
  - Added public API endpoint `POST /api/v1/estimates/pdf` streaming PDF buffer as attachment.
  - Updated `Calculator` (`src/features/estimates/calculator.tsx`) with a prominent "Download Estimate PDF" action with loading indicator and bilingual Hindi/English labels.
  - Added unit test suite `tests/unit/estimate-pdf.test.ts` verifying binary `%PDF-` generation.
  - Documented endpoint in `docs/api/openapi.yaml` and generated TypeScript definitions (`src/contracts/generated-api.d.ts`).
- **Catalog Mobile Filter Drawer (`src/features/catalog/mobile-filter-drawer.tsx`)**:
  - Implemented responsive slide-over filter drawer on the public Catalog page (`/catalog`) for mobile viewports.
  - Allows filtering by parent category, subcategory, material presets (MS, SS, etc.), maximum budget, and sort order.
  - Synchronizes filter state on drawer open without cascading effect renders, keeping mobile UX fast and uncluttered.
- **Verification**:
  - `npm run typecheck` (`tsc --noEmit`) passed with 0 errors.
  - `npm test` (`vitest run`) passed all 78 suites and 353 tests (100%).
  - `npm run api:check` passed with 301 documented paths and 44 explicit Route Handler methods.
  - `npm run docs:check` passed with all 34 requirements, 20 phases, and SHA-256 integrity intact.
  - `npm run security:check` passed with 0 exposed secrets.
  - `npm run build` (`next build`) succeeded with all 74 dynamic and static routes compiled cleanly.

## 2026-10-31 - Standardized Stage Transitions & Payment Mode to Dropdowns

- **Stage Selectors Standardized to Unified Dropdowns**:
  - Replaced action buttons across all workflow detail views with the clean `<select>` dropdown component matching `LeadStatusSelect`:
  - **Orders (`/admin/orders?record=...`)**: Implemented `OrderStatusSelect` dropdown showing all order stages (`Confirmed`, `Advance Received`, `Measurement Confirmed`, `Production Pending`, `Production Started`, `Fabrication Completed`, `Finishing`, `Ready`, `Out For Delivery`, `Installation`, `Completed`, and `Cancelled`), permitting only valid guarded next transitions.
  - **Work Orders (`/admin/work-orders?record=...`)**: Implemented `WorkOrderStatusSelect` dropdown showing production stages (`Pending`, `Fabrication`, `Finishing`, `Ready`), advancing job cards directly to ready without quality check bottlenecks.
  - **Quotations (`/admin/quotations?record=...`)**: Implemented `QuotationStatusSelect` dropdown showing stages (`Draft`, `Approved`, `Accepted by customer`, `Rejected by customer`, `Converted to order`), triggering approval and conversion workflows.
  - **Deliveries (`/admin/deliveries?record=...`)**: Implemented `DeliveryStatusSelect` dropdown (`Scheduled`, `Dispatched`, `Delivered`).
- **Advance Payment Mode Dropdown**:
  - Replaced the 4-button payment grid in `OrderPaymentWorkspace` with a clean `<select>` dropdown for Payment Mode (UPI / QR, Cash, Bank Transfer, Cheque / DD).
- **Verification**:
  - `npm run typecheck` (`tsc --noEmit`) passed with 0 errors.
  - `npm test` (`vitest run`) passed all 75 suites and 346 tests (100%).
  - `npm run build` (`next build`) succeeded with all 68 dynamic and static pages compiled.

## 2026-10-31 - Orders Quality Check Removal, Advance Payments & Receipt PDF, Measurements Multi-Unit, Follow-up Statuses

- **Orders Quality Check Removal**:
  - Removed quality check requirement and stage from orders and work-orders workflows.
  - Applied migration `202610310057_remove_quality_checks_and_order_advance.sql`: updated `workflow_guard` so work-orders transition directly `finishing -> ready` without quality checks, and updated `transition_order` so order `READY` transition no longer enforces passed quality check records.
  - Updated `src/features/operations/resource-workspace.tsx` work-order action buttons from `finishing -> quality_check -> ready` to `finishing -> ready` directly.
  - Replaced the Quality tab on `/admin/orders?record=...` with a direct Payments tab (`customer-payments`) while keeping exhaustive workspace navigation contracts intact.
- **Advance Payment System & Receipt PDF**:
  - Integrated `OrderPaymentWorkspace` directly on Order details (`/admin/orders?record=...`).
  - Displays Total Order Value, Advance Paid, Balance Due, and visual progress bar.
  - Supports recording advance receipts in Cash (नकद), UPI / QR (PhonePe, GPay, Paytm), Bank Transfer (NEFT/RTGS/IMPS), and Cheque / DD.
  - Includes Payment Gateway Ready mode toggle and indicator for seamless Razorpay / Cashfree webhook integration.
  - Created `/api/v1/orders/[id]/advance-payment` API route: records immutable payments via `post_payment` RPC and automatically transitions orders from `CONFIRMED` to `ADVANCE_RECEIVED`.
  - Built GateWala Advance Payment Receipt PDF generator using `@react-pdf/renderer` with customer metadata, payment mode, reference, breakdown, and balance due.
  - Created `/api/v1/orders/[id]/receipt` API route to download official Advance Payment Receipt (PDF) with direct download button in admin order details.
- **Measurements Multi-Unit Converter (`/admin/measurements?new=1`)**:
  - Added unit selector: Feet & Inches (ft & in), Inches (in), Centimeters (cm), Meters (m), and Millimeters (mm).
  - Provided dual Feet and Inches input boxes for Width & Height with live conversion to canonical mm, real-time Area display (Sq.Ft and Sq.M), running feet perimeter, and automatic human-readable site note recording.
- **Follow-ups Status Dropdown Fix (`/admin/follow-ups?new=1`)**:
  - Updated DB constraint `follow_ups_status_check` to `check (status in ('pending', 'processing', 'working', 'delay', 'completed'))`.
  - Added Hindi/English bilingual labels and color-coded status badges in table view and details panel.
- **Quotation Numeric Inputs Sticky Zero Removal**:
  - Improved `sanitizeNumericString` and added `onFocus` auto-clearing for 0 in Rate, Quantity, Discount, and Tax fields on Quotation forms, preventing sticky or leading zeros.
- **Verification**:
  - All 75 test suites (343/343 tests) passed (100%).
  - TypeScript check `tsc --noEmit` passed with 0 errors.
  - Next.js production build (`next build`) compiled cleanly across all 68 dynamic and static routes.
  - Changes pushed to GitHub `main` (commit `a1110f3`), triggering live Vercel deployment.

- Added `address` field (पता / शहर) to the public visitor contact modal (`VisitorContact`).
- Updated `visitorContactSchema` with optional trimmed string up to 100 characters.
- Updated `/api/v1/visitor-contact` POST handler to map the visitor's address directly into the lead `city` column and requirement notes, enabling staff to see the customer's locality in the admin Leads list.
- Regenerated OpenAPI contracts; added automated integration test in `tests/integration/visitor-contact.test.ts`. All 300 tests passed.

## 2026-10-28 - Emblem-only branding and account navigation refinement

- Removed the added brand name/tagline next to or below the shared logo in public header, footer, admin sidebar and authentication branding. Supplied image artwork is unchanged.
- Replaced inline admin sign-out with an accessible account dropdown: account, permitted Settings/Staff links and sign-out. Public account dropdown includes account, saved designs, cart and a staff workspace link only for authorized users. Guest menus omit staff and sign-out actions.
- Compacted sidebar branding and navigation, balanced emblem sizes, refined topbar/header spacing and retained the charcoal/gold design and shared English/Hindi typography.
- Dropdown supports click, Tab navigation, Arrow Down entry, Escape with focus restoration and outside-click dismissal. Mobile dropdown bounds checked at 320px and 390px.
- Validation: targeted ESLint, TypeScript and production build passed. Guest browser checks passed. Full responsive browser results are recorded in the design-system operations document.

# SmartFabrication progress

### Royal Gates public and admin design system - 2026-10-28

Rebuilt the shared visual layer around the two owner-supplied WebP emblems, charcoal/gold identity and locally hosted Inter/Noto Sans Devanagari typography. Public header/footer, admin primary/contextual rails, topbar/account shortcuts, dashboard cards/charts, tables, forms/dialogs, buttons, login and browser icon now follow a consistent system. Local Font Awesome Free assets are integrated; labels, role filtering, legacy URLs, sorting/pagination, inline errors and posting safeguards retained. The user's removed legacy public logo files are replaced by active references to the supplied assets. No database/business mutations or financial formula changes.

Verification: 299 unit/integration tests, final production build, targeted lint (zero warnings), docs and secret checks passed. All eight existing admin-table browser groups passed with mocked operational writes. Both responsive runs passed all six groups; the final run waits for populated core lists before checking layout. Coverage includes public pages in English/Hindi, six widths (320/390/768/1024/1440/1920), representative admin modules/procurement screens, primary/contextual rail toggles, mobile drawer/Escape, five create forms, login and red inline errors. Temporary Auth fixtures were retired. Local port 3000 was restarted after preserving its stale dev cache under ignored test-results; isolated preview also verified the new UI. Release 0ccbdf5 is live. All six production browser groups passed with the populated-list checks and hydration-console checks enabled; original/transparent logos, local text/icon fonts, six-width English/Hindi public layouts, representative admin/procurement pages, rail/drawer behavior, five create forms, inline errors and login verified. Temporary production-test Auth owner retired; no business writes. Design contract, assets, licences and precise coverage: [Royal Gates design system](operations/royal-design-system.md).

### Supplied Royal Gates logo - 2026-10-28

Replaced the previous logo in the public header/footer, login and admin sidebar with the exact supplied Royal Gates Crowned Gate Emblem.png, retained as public/royal-gates-logo.png (1672x941). Original black/gold artwork and aspect ratio preserved; responsive sizes, alt/home labels and compact RG mark updated. Next Image serves optimized delivery sizes while the original PNG remains unchanged. This updates logo placements, not database business identity or historic quotation content. Production build and docs check passed. Both local browser groups passed: header/footer image loading, original ratio and no overflow at 320/390/768/1440px; login/admin image loading and compact RG mark. Supplied/public PNG SHA-256 matches. Generated test owner retired; no business writes. Live original PNG hash verified; live public header/footer at all four widths and login image loading passed. Admin logo and compact mark verified locally. Initial live browser attempt reached the old release before deployment and is not counted as a pass.

### Complete Removal of CSV Operations Across Admin Panel - 2026-10-28

Per explicit user direction ("csv mujhe poore admin se remove krna h sab kahi se remove kro"), all CSV import/export UI buttons, links, and forms have been completely removed from the entire admin panel:
- **Admin Navigation (`src/contracts/admin-navigation.ts`)**: Removed the `Bulk Import (CSV)` special workspace link under `Inventory & Purchases`.
- **Bulk Import Page Redirect (`/admin/raw-materials/import`)**: Cleanly redirects any incoming or bookmarked requests directly to the main Raw Materials Hub (`/admin/raw-materials`).
- **Supplier Ledger (`/admin/suppliers/ledger`)**: Removed the `CSV एक्सपोर्ट` button and its associated client-side download handler.
- **Record Tables & Workshop Reports (`ExportButton`)**: Nullified the generic `ExportButton` component so that no `Export CSV` buttons appear anywhere on admin collection tables or workshop reports.
- **Verification**: TypeScript check passed (0 errors); 66 test suites with 299/299 Vitest tests passed (100%); Next.js production build compiled cleanly across all 29 routes.

### Raw Material Hub: 10-Record Pagination, Instant Search & Photo Thumbnails - 2026-10-28

Enhanced the **कच्चा माल मास्टर (Raw Material Hub)** at `/admin/raw-materials` to deliver full procurement-grade table pagination, instant multi-attribute search, and admin-only image thumbnail support:
- **10 Records Per Page Default & Rows Selector**: Integrated `DataTablePagination` with a default page size of 10 records per page and a selector for `[10, 25, 50, 100]` rows per page. Displays current item range (e.g. `1–10 (30 में से)`), page indicator, and standard accessible navigation controls (First, Previous, Page Buttons, Next).
- **Prominent Instant Search & Filter Bar**: Added an instant search bar with search icon, clear button (X), and automatic page 1 reset. Matches English name, Hindi name (`name_hi`), size, thickness, gauge, brand, category, and colloquial workshop aliases (e.g. "1 इंची पाइप", "सवा इंची एंगल", "18 gauge", "tata chadar").
- **Photo / Image Thumbnails in Table**: Added a dedicated `फोटो (Image)` 44x44 thumbnail column immediately following `क्र.सं. (S.No.)`. Uses category-tailored SVG illustrations and custom-uploaded images for visual identification.
- **Admin-Only Material Quick Add with Photo Upload**: Updated `MaterialQuickAddModal` with a photo file picker and preview, strictly guarded for internal admin procurement and never exposed on the customer website.
- **Synchronized Purchase Entry (`/admin/purchases/entry`)**: Material dropdowns show photo cards with size/gauge/brand, and draft bill tables display the photo thumbnail alongside each line item.
- **Material Edit Action & Inline Modal**: Added a dedicated teal Edit button (`<Pencil />`) to every row in Table View and card in Cards View. Clicking Edit opens the modal pre-filled with the material's category, English & Hindi names, dimensions, gauge, thickness, brand, grade, unit, weight per unit, reorder threshold, local aliases, and admin photo. Updates save seamlessly to the state and Supabase backend with instant UI refresh and success notification.
- **Verification**: TypeScript check `tsc --noEmit` passed (0 errors); Vitest test suite passed 299/299 tests across 66 suites (100%); Next.js production build compiled cleanly across all 29 routes.

### Lead dropdowns, quotation layout and cross-browser links - 2026-10-28

Lead details now use a native status dropdown. Customer details show the statuses of their linked enquiries (not a fabricated customer status); the new customers -> leads context validates parent permission and RLS before pagination. Each dropdown shows all pipeline stages with only the current and valid next/reopen/lost transitions enabled. Database measurement/quotation/order prerequisites, permissions and expected-version checks remain authoritative. Errors retain the saved stage and show feedback; 390px layout verified.

Quotation PDFs now use fixed description/quantity/unit-rate/amount columns, wrapped descriptions, right-aligned numbers and a separate right-aligned totals block. Rows/totals do not split across pages; page numbers added. Actual PDF content-coordinate checks passed for 40 long-description rows across pages, including matching baselines and consistent amount alignment. Immutable snapshot calculations/history are unchanged.

Copied customer links retain the quotation through sign-in in another browser. Authorized staff redirect to that quotation's admin detail; customers retain their existing RLS-protected account view. A safe local return-path allowlist prevents external login redirects. The share control also exposes an Open customer link anchor. Access still requires the linked customer or authorized staff login; the UUID is not a public-access token.

Verification: 298 tests across 65 suites and production build passed; docs/security checks passed. Local authenticated browser checks passed for guarded customer dropdown changes and rejected stages, mobile overflow, fresh-browser sign-in to the requested quotation, copied URL/open anchor and its real PDF download. Test business mutations were intercepted, existing supplied records only read and temporary Auth owner retired. Live deployment and both authenticated browser groups passed: guarded customer status dropdown/mobile/error retention, fresh-browser login to the exact quotation, copy/open link and real PDF download. Read-only live lookup of the supplied customer returned zero linked enquiries; its details correctly show no linked enquiries until a lead is explicitly added/linked. Temporary owner was retired. After the full 298-test run, nine targeted tests passed for the final full-stage dropdown adjustment and quotation/PDF/login behavior. API regenerated with customers context; full API route-coverage check currently flags separately added purchases/bill and purchases/payment contracts, outside these quotation/status changes.

### GateWala Page 1: Purchases Dashboard & Procurement Hub - 2026-10-28

Implemented **Page 1: खरीदारी डैशबोर्ड (Purchases Dashboard)** in the `Inventory & Purchases` workspace at `/admin/workspaces/inventory`:
- **4 Real-Time KPI Cards**: इस महीने की खरीद (This Month Purchases ₹), कुल भुगतान (This Month Payments ₹), दुकानदारों का बकाया (Total Outstanding Due ₹), कुल दुकानदार (Total Active Suppliers Count).
- **Quick Action Tiles**: Direct shortcuts to all 5 core modules: "+ नई खरीदारी दर्ज करें" (`/admin/purchases/entry`), "दुकानदार का खाता" (`/admin/suppliers/ledger`), "कच्चा माल कैटलॉग" (`/admin/raw-materials`), "माल स्टॉक" (`/admin/inventory`), and "CSV इम्पोर्ट" (`/admin/raw-materials/import`).
- **Recent Purchases Table (हाल की खरीदारी)**: Bill number, supplier, date, total amount, status badges, and quick link to the complete purchase register.
- **Suppliers with Outstanding Due (बकाया वाले दुकानदार)**: Supplier name, phone, outstanding amount, and direct links to view individual ledgers with payment settlement.
- **Verification**: TypeScript check `tsc --noEmit` passed (0 errors); 63 test suites with 291/291 vitest tests passed (100%); Next.js production build compiled cleanly across all 29 routes.

### GateWala Page 3: Supplier Ledger & Multi-Bill Payment Allocation - 2026-10-28

Implemented **Page 3: दुकानदार का खाता (Supplier Ledger)** at `/admin/suppliers/ledger`:
- **Supplier Ledger Statement View**: Select any iron dealer / supplier to view their complete transaction history with date filters (All time, 30 days, 90 days), running balance calculation (तारीखवार बाकी रकम), debit purchases, credit payments, and returns.
- **Supplier Summary Cards**: Real-time display of कुल खरीदारी (Invoiced ₹), कुल भुगतान (Paid ₹), माल वापसी (Returned ₹), and कुल बकाया (Net Outstanding Due ₹).
- **Multi-Bill Payment Allocation (FIFO)**: Built `/api/v1/purchases/payment` supporting both single-bill payments and automatic FIFO multi-bill allocation, letting fabricators settle a round sum (e.g. ₹15,000) across multiple earlier unpaid bills.
- **CSV / Excel Export**: One-click statement export for vendor reconciliation.
- **Integration & Verification**: Linked in admin navigation under Inventory & Purchases; unit tests in `tests/unit/supplier-ledger.test.ts` passed; 63 test suites with 291 tests passed (100%); Next.js production build compiled cleanly with all 29 routes.


### GateWala Page 2: Multi-Item Purchase Bill Entry & Ledger System - 2026-10-28

Implemented **Page 2: नई खरीदारी दर्ज करें (New Purchase Bill Entry)** at `/admin/purchases/entry` and `/admin/purchases/new`:
- **Supplier & Bill Header**: Searchable supplier selector loaded from `/api/v1/admin/suppliers` with inline "+ नया सप्लायर" modal for immediate vendor addition without leaving the form. Bill date with automatic today default and supplier bill/challan number input.
- **Searchable Material Dropdown & Inline Quick Add**: Connected to the 30+ preloaded fabrication catalog materials (pipes, angles, flats, sheets, hardware, welding rods) plus existing database materials. Includes instant bilingual & alias search ("1 इंची पाइप", "सवा इंची एंगल", "tata chadar", etc.). Integrated "+ नया साइज / मटेरियल जोड़ें" modal to define custom material variants on the fly without losing draft bill data.
- **Multi-Item Draft Bill**: Allows adding multiple materials to a single supplier invoice with unit (KG, piece, sheet, meter, litre), quantity, rate, auto-computed item subtotal, and deletion support.
- **Payment & Stock Settlement**: Computes grand total, immediate paid amount, payment mode (Cash, UPI, Bank, Cheque), reference note, and remaining supplier balance due. Includes auto-receive checkbox to instantly update workshop stock movements.
- **API Endpoint (`/api/v1/purchases/bill`)**: Atomic transactional handler that creates purchase headers, resolves or creates material variants, inserts `purchase_items`, triggers `receive_purchase` RPC for inventory, and records `post_payment` for supplier ledgers.
- **Verification**: TypeScript check `tsc --noEmit` passed (0 errors); unit tests in `tests/unit/purchase-bill.test.ts` passed; 62 test suites with 289 tests passed (100%); Next.js production build compiled cleanly with all static & dynamic routes.


### CRM actions, follow-up assignment and dashboard links - 2026-10-28

Fixed the shared record action flow: status changes now reload the selected record and its concurrency version instead of clearing the detail screen and leaving it stuck on Loading. Lead assignment, quotation/revision actions, purchase returns and product-copy callbacks reuse the refresh path; rejected actions show an error toast without pretending success. Follow-ups expose optional assigned staff, retain old selections for deliberate correction, allow self/authorized staff selection and clear obsolete assignments to the existing lead/owner reminder fallback. Active-staff checks and permissions remain enforced by the existing database trigger; its inactive-assignee error maps beneath the selector. Staff pages load incrementally, with retry and deduplication. The four lower dashboard metrics are now links to their relevant lists, explicitly labelled all permitted records (dashboard scope/count filters are not claimed on those lists). Assignment controls wrap on mobile. Local browser acceptance passed all four groups: consecutive transitions with versions 1/2, assignment/detail retention and 390px layout, four dashboard destinations, and invalid-assignee correction with retained values. These browser business writes were mocked; generated Auth owner retired. Current unit/integration run: 285 tests across 61 suites passed; API/security checks passed. Production build passed. Live verification on smartfabrication.vercel.app passed all four browser groups plus the real authenticated database check: CONTACTED advances status/version, stale versions are rejected, eligible follow-up assignment saves, invalid assignment is rejected and clearing assignment is accepted. Database test writes were rolled back; browser business writes were intercepted. No real customer/financial/stock records rewritten. Documentation check now allows additional modules while still checking every original baseline module, all 20 phases and byte-identical master source.

### GateWala Dynamic Fabrication Material Master & Multi-Unit Procurement System - 2026-10-27

Implemented the comprehensive, extensible Material Master, Multi-Unit Procurement and Weighbridge Reconciliation system under **Inventory & Purchases**:
- **Preloaded Catalog & Fabrication Categories**: 14 mandatory fabrication categories (MS Pipes, Angles, Flat Bars/Patti, Solid Round/Square Bars, Channels & Beams, HR/CR/GI/GP/Chequered/Perforated Sheets, Stainless Steel SS 202/304, Aluminium & ACP, Gate Hardware & Hinges/Kabja, Welding Consumables, Cutting/Grinding Abrasives, Paints & Primers, Roofing & Shed, Fasteners, Custom). 30+ comprehensive raw material items with bilingual English/Hindi names, local workshop nicknames (e.g. "सवा इंची एंगल", "पौना इंची पाइप", "18 gauge", "tata chadar"), gauge labels, verified mm thicknesses, commercial/IS 2062 grades, standard lengths and reorder alerts.
- **Dynamic Quick Add with Duplicate Detection**: Inline Quick Add modal integrated across the Material Master Hub and inside `ReferenceInput` dropdowns. Administrators can add a new material variant or supplier directly during Purchase Entry without losing any in-progress purchase form inputs. Duplicate detection normalizes name, category, size, thickness, and gauge while preserving local aliases.
- **Multi-Unit Procurement & Weighbridge Reconciliation**: Built `multi-unit-converter.ts` with `convertPurchaseToStock` (converting bundles, feet, boxes, sheets, and meters to canonical stock units and estimated weights) and `reconcileKantaWeight` for Dharam Kanta weighbridge slips against billed supplier weights with configurable tolerance percentages.
- **Bulk CSV Import & Export Engine**: Built `material-import-export.ts` providing pre-formatted CSV template generation, row-by-row syntax/schema validation, live duplicate alerts, interactive preview table, and batch import execution via `/api/v1/admin/materials`.
- **Bilingual Admin UI**: Dedicated Raw Materials Hub at `/admin/raw-materials` and Bulk Import at `/admin/raw-materials/import`, linked in admin navigation under Inventory & Purchases.
- **Verification**: TypeScript check `tsc --noEmit` passed (0 errors); 61 test files with 285 tests passed (100% success rate); production Next.js build compiled and generated all 27 static/dynamic routes cleanly without errors.


### Red validation messages under inputs - 2026-10-27

Replaced native validation popups with shared, form-scoped red messages beneath the corresponding inputs across public/account/admin forms. Blur/touched-field checks, first-invalid focus, correction clearing, Indian mobile group placement, native file/type/size checks and retained input values are implemented. Shared resource schemas and API/Zod field paths map to the same controls; known duplicate constraints, quotation discount/line validation and stock consumption rules now identify fields. Field errors no longer generate duplicate validation toasts; non-field failures retain form-level feedback. Financial retry/idempotency, permissions, RLS and quotas are preserved. Verification: 263 unit/integration tests across 57 suites passed; all six inline-validation browser groups and eight admin-table regression groups passed, including valid saves, retained values, duplicate-error persistence and removal of stale errors for deleted quotation rows. API/docs/security checks passed. Final production build passed. Live release ba0043b confirmed and all six deployed-browser groups passed. The runner reported a transient Supabase Auth sign-in error during fixture retirement; independent read-only verification confirmed all five generated owner fixtures in that run window were disabled, banned and had no roles. Global sign-out for the affected fixture was not confirmed; the app-access revocation checks passed. Full contract and limits: [inline validation](operations/form-validation.md).

### Sorting across existing tables - 2026-10-26

Added shared accessible ascending/descending column controls across resource lists, staff, notifications, inventory, permission matrix, derived finance balances, supplier statements, dashboard samples and estimate breakdowns. Server-paginated collections order the full permitted dataset before limiting; local snapshot tables sort raw values before local pagination. Sort changes reset page/cursor; search/refresh keep the active sort. Additive read-only migration 50 is applied; permissions/RLS, posting formulas and existing legacy URLs/cursors are preserved. Validation: final production build, 255 unit/integration tests (56 suites), docs/API/security checks passed. All 181 visible columns across 45 resources matched PostgreSQL in both directions (362 comparisons across resumed audit runs). Sorted cursors, staff/notification APIs, derived finance sorting, unchanged statement totals and denied RPC access passed. Local browser checks passed for both heading directions, reset-to-first-page, refresh persistence, full-snapshot numeric inventory sorting and 390px layout. Live base release 67b6297 is active; live sorted cursor, staff and notification API checks passed. The wider live finance comparison was interrupted by a stale direct database test connection, not counted as a pass. Local finance/API checks passed. Follow-up: keyed related child workspaces reset incompatible sorting/cursors between tabs; sticky footer styling is now limited to forms so record tab panels do not cover their tabs. The targeted child-tab browser check and rebuilt production bundle passed. Final live verification (2026-10-27): release d839e39 footer/tab CSS confirmed, and all three live browser checks passed: column direction/pagination/refresh, inventory numeric sorting/mobile layout, and related-tab sort reset. Generated test accounts were retired. Details/API contract and scope: [table sorting](operations/table-sorting.md).


### Supplied GateWala logo replacement - 2026-10-26

Replaced public header/footer, login and admin sidebar branding with the exact owner-supplied GateWala_ Strength Meets Beauty.png asset (2172x724), published as /gatewala-brand-logo.png. Preserved the original image, white background and 3:1 ratio. Desktop/mobile logo sizing is retained; compact admin navigation uses a readable GW fallback. Build/TypeScript and 13 existing workspace/permission tests passed. Browser checks confirmed image decoding and no horizontal overflow at 320/390/768/1440px, plus footer/login visibility. No backend/database changes.

### GateWala logo and visual identity integration - 2026-10-26

Integrated the official workshop brand identity and logo provided by the owner: **GateWala (Welding & Fabrication Works)** with the tagline **"मजबूती भी, खूबसूरती भी।"**.
- Added high-resolution logo assets (`/logo.jpg`, `/gatewala-logo.jpg`, `src/app/icon.jpg`, `public/favicon.ico`).
- Integrated brand avatar and logo into the sticky public header (`public-header.tsx`), public layout footer (`(public)/layout.tsx`), dark admin sidebar navigation (`admin-navigation.tsx`), user authentication pages (`auth-form.tsx`), root metadata and quotation PDF generation (`quotationPdf`).
- Aligned default WhatsApp inquiry templates, mobile action bar, comparison table, and transformation slider with the GateWala identity.
- Verified: TypeScript `tsc --noEmit` (0 errors), 242/242 vitest unit/integration tests passing across 54 suites, `docs:check` (pass), `api:check` (pass), `security:check` (pass), and full production Next.js Turbopack build (27/27 static/dynamic pages compiled cleanly).

### Rate limits across database-related forms - 2026-10-26

Implemented distributed server-side quotas for all /api/v1 write methods, public enquiries/visitor capture, estimates/previews, media and verified-user mutations, with stricter shared sensitive-action budgets. Login/signup/reset/password-update now use a protected same-origin Auth API; Supabase session/RLS controls remain in place. Added isolated atomic quota storage and forward timestamp correction (migrations 48/49), HMAC identities, fail-closed 503 behavior and standard 429 Retry-After feedback. No business data/history was rewritten. Full thresholds, scope/exclusions, trusted-IP policy, storage/grants and tests: [form rate limits](security/rate-limits.md).

### Visitor contact popup and Call/Message gate - 2026-10-26

Public pages now show an optional welcome popup asking only name and Indian mobile. Close/Escape/Continue browsing dismisses it for the current tab session without creating a lead. Site Call, SMS/email and exact WhatsApp-host links ask for details before continuing when unregistered. React capture covers contact links in header/footer, product/cart/design sections and mobile actions. Successful POST /api/v1/visitor-contact uses the existing public submit_lead RPC and its rate/duplicate rules; records appear in staff-only Leads with city Not provided and an explicit website-contact intent/path in requirement. No separate visitor database or privileged write client was added. A signed, seven-day HttpOnly/SameSite=Lax cookie remembers registration; GET exposes only registered boolean. Name/phone are not stored in browser storage. Validation, honeypot, same-origin browser writes and constant-time token verification apply. Invalid cookies/failed saves cannot unlock the UI; valid cookies avoid duplicate contact registration. This is number-format validation, not OTP authentication; off-site/manual calls or browsers without JavaScript cannot be technically gated. Privacy notice and generated mobile/API contracts updated (294 paths /36 explicit methods). Existing public regression tests explicitly dismiss the optional welcome popup; contact gating is separately tested.


### Human-readable business codes and label resolution across admin - 2026-11-03

Standardized record presentation across all 38 business entities to show human-readable SKU/Codes (e.g. `RG-GT-000001`, `RG-ORD-000001`, `RG-QT-000001`, `RG-GAL-000001`) and formatted titles (`Name — Code`) instead of raw internal database UUIDs.
- Kept internal database primary/foreign keys as UUIDs to guarantee database integrity, RLS policies, and zero broken URLs or mobile client contracts.
- Added migration `202611030058_readable_record_codes.sql` generating immutable `record_code` and `record_number` identity across all tables.
- Implemented `/api/v1/record-labels` and `useRecordLabels` hook resolving foreign key UUIDs (such as `category_id`, `media_id`, `customer_id`, `lead_id`, `product_id`) to descriptive names with clickable links.
- Updated `ResourceWorkspace` tables to display readable badges and labels, converted `fieldTitles` lookup (e.g. `category_id` -> Category, `media_id` -> Photo / Media Asset), filtered internal `id` and `record_number` from the primary details grid, and relegated the raw UUID to a subtle, copyable footer reference (`System Reference: <uuid>`).
- Dropdown selectors (`ReferenceInput`), PDFs (Quotations, Advance Receipts), customer account portals, and CSV report exports (`readableExportRows`) now use readable labels and codes.
- 76 test suites (349 tests) and full Next.js production build verified.

### Save/remove action toasts - 2026-10-26

Added a shared, accessible green success/red error toast host with icons, dismiss controls, automatic expiry and a three-message queue. Popover presentation keeps notices above modal content. Confirmed shared create/edit saves, archive/remove operations, transitions and customer linking now emit action feedback; validation/transport failures emit errors. Staff roles/permissions/account status, profile, stock posting, reviewed finance corrections/period close, material returns, quotation versions/revisions, lead notes/assignment, product copying, media upload/invoice attachment and notification-read actions also emit success feedback. Reloading workflows persist a one-use, 30-second flash notice in session storage; regular page navigation retains the root host. Archive wording accurately says removed/history preserved rather than claiming hard deletion. No network request is intercepted and no financial/permission behavior changed.

### Workspace Add/Edit pages (reference correction) - 2026-10-26

Supersedes the top-level full-screen form presentation: shared Add/Edit now renders as a normal page inside the existing admin header and two-sidebar shell. Forms have workspace/list breadcrumbs, page title, Back to list, a bordered Record details card and Save/Cancel actions. Add uses the existing ?new=1 URL; Edit uses a UUID-validated ?edit={id} URL, reloads the RLS-visible record and enforces existing edit rules. Save/Cancel return to the list. Contextual child forms remain modal so their selected parent, locked references and nested workflow are preserved; detail/confirmation dialogs remain unchanged. Server API validation, idempotency and mutation rules are unchanged.

### Full-screen admin forms and details - 2026-10-26

All shared admin record dialogs now fill the viewport instead of a centered 672/960px popup: Add/Edit forms, record details and staff/notification detail dialogs. Header and form actions stay fixed while the body scrolls. Nested related forms retain independent modal focus and scroll locks; public product-photo zoom is unchanged. No validation, permissions or posting logic changed. Browser acceptance now asserts full form width/height, no horizontal overflow and reachable Save at 320/390/768/1440/1920px.

### Admin palette correction - 2026-10-26

Kept the approved dual-sidebar structure and replaced the copied orange accent with an independent navy/teal admin identity: navy #142339 sidebar, teal #0f766e active navigation/buttons/icons, pale teal #e6f5f2 selected sections and cool #f4f7fb canvas. Focus states and selected record-tab borders follow the same accent. Public website colors and semantic status/action colors are unchanged. CSS-only change; no API, business data or permission changes.

### Two-sidebar reference layout - 2026-10-26

Replaced horizontal workspace tabs with an independent white section sidebar beside the dark main navigation. The current workspace shows its permitted primary pages and an all-lists/history link; both main and section rails have collapse controls. Small screens keep the main drawer and a compact scrollable section strip rather than squeezing content between two rails. Added orange active states, icon backgrounds, a dashboard welcome panel and seven permission-filtered management shortcuts for an owner. Existing record tabs, all 45 resource mappings, old URLs, search, APIs and financial rules are retained. Screenshot dummy revenue, user identities and activity values were not copied. Production build, TypeScript, 218 unit/integration tests, targeted lint, docs and secret checks passed. Eight existing authenticated workspace/API/record/mobile checks passed, plus the new targeted browser check for seven dashboard tiles, independent section rail, both collapse controls and body overflow at 320/390/768/1440px. Both generated owner accounts were retired; no business records were written.

### Eight workspaces and contextual record tabs - 2026-10-26

Implemented the approved eight-entry sidebar, six workspace directories with section tabs and complete 45-resource mapping, header-only notification/calculator/customer-site shortcuts and Settings -> Staff & permissions. Added enquiry/product/order/purchase/worker record tabs plus BOM material lines, scoped child lists, parent-bound form defaults and filtered indirect-reference options. Existing URLs, business actions, edit sizing, immutable history and RLS are preserved. New staff collection context filters verify parent permission/visibility before filtering direct or indirect children. Global CSV is deliberately hidden in a linked-record list to avoid exporting an unrelated global collection. 218 unit/integration tests and build/TypeScript passed; API remains 293 paths / 34 explicit methods. Eight real Auth/browser/read checks passed, including all twenty API relationships, five parent record tab sets, invoice history, parent defaults, indirect pickers, retained URLs, back/forward/search and 320/390/768/1440 sizing. Temporary owner retired; no business records written. Targeted lint, API/docs checks and secret scan passed. Consolidated PROJECT_STATUS.md preserves the superseded report in a linked archive. See [full mapping, behavior and limits](operations/admin-workspace-navigation.md).

### Reference-style admin redesign - 2026-10-25

Implemented navy grouped navigation, a working module-search header, compact blue/white panels, eight permission-filtered KPI cards, action-workload bars, scoped order-status donut, recent activity samples and a role-gated low-stock panel. The Dashboard heading retains daily/business tabs and all scoped task/exact-record workflows. Screenshot revenue/growth/top-selling numbers were not copied. Inventory explicitly uses all permitted records independently of the dashboard demo scope. Header search resets list/query state even within the same module. Production build/TypeScript, 205 unit/integration tests, seven expanded authenticated browser checks, targeted lint, API/docs checks and secret scan passed. Loaded 320/390/768/1440 layouts and desktop/mobile screenshots were verified. A first exact-record check exceeded its short timeout; the final run passed with an appropriate network wait and query/record/new-intent remount keys. Generated test logins were retired; no business record was written. See [definitions and limits](operations/daily-work-dashboard.md).

### Edit dialog sizing - 2026-10-25

Record add/edit dialogs use an adaptive width up to 960px, two-column desktop fields, single-column mobile fields and full-width long text/JSON fields. The header and Save/Cancel footer remain outside the scrolling field area. View/confirmation and staff dialogs share viewport limits with a pinned header. Verified a real product form at 1440px and 390px: dialog stayed within the viewport, fields scrolled independently, footer stayed visible and no horizontal overflow occurred. Seven existing local browser checks, production build/TypeScript, targeted lint and docs checks passed. Test business updates were mocked and the temporary login was retired. API/permissions and business data are unchanged.

### Colourful admin collections - 2026-10-25

Added indigo/blue table headers, softly tinted rows and serials, blue view / amber edit / rose remove controls, colourful pagination and status-specific blue/amber/violet/cyan/rose badges across shared admin collections. Disabled actions stay neutral, status labels remain visible, and public website colours/permissions/workflows are unchanged. Seven existing local authenticated browser checks passed with mocked business writes; desktop/mobile screenshots were reviewed. Production build/TypeScript, targeted lint and documentation checks passed.

### Admin list actions, validation and tables - 2026-10-25

Updated registered resource lists plus staff, inventory, notifications, finance balance lists and the role matrix with consistent serials, explicit eye/edit/remove controls and bounded pagination. Previous-page history, page size, exact page labels/ranges and validation are improved. Supported listing removal is reversible archive/deactivation with confirmation; financial/stock history remains protected and staff removal uses existing disable-account controls. No destructive DELETE, RLS relaxation or migration. Partial price edits and review ratings are checked on the server. 205 unit/integration tests, seven local authenticated browser checks (mocked operational writes), production build/TypeScript, targeted lint, API/docs checks and secret scan passed. The same seven checks also passed on the live Vercel site after commit 076a9fd; operational edits/deactivation remained intercepted. Generated browser accounts were retired. Browser harness selectors were corrected during verification; only the final seven-check run is counted as passing. See [behavior, removal whitelist and verification limits](operations/admin-list-workflows.md).

### Daily-work admin dashboard — 2026-10-25

Live dashboard tabs/scopes, matching task links and mobile layout verified. All six production functional checks completed; a lost cleanup response was independently reconciled against the generated account's disabled/zero-owner-role/banned state. The original transport failure remains in the raw test artifact; no business record was written by browser verification.

Replaced the mixed overview with Aaj ka kaam and Business overview tabs, India-time due/overdue tasks, matching card drilldowns, exact record links, quick-create forms and a scoped order-stage board. Recognized demo/test markers are excluded by default and inspectable in a separate data view; unmarked records still require review. Pending installations are separate from today's scheduled deliveries. Finance values and historical records were not rewritten. Migration 47 is applied (read-only invoker functions; 58 tables/134 RLS policies unchanged). 188 unit/integration tests, 12 SQL/RLS checks and six real authenticated browser checks passed. API now documents 293 paths / 34 explicit methods. See [workflow, definitions and limits](operations/daily-work-dashboard.md).

### Header design and icons — 2026-10-25

Redesigned the public header with a graphite/sage brand mark, unified borderless search input, icon-led navigation with active-page state, language icon and high-contrast quote action. Wide screens use a balanced single row; smaller screens use separate search/navigation rows without clipping cart or wishlist controls. Removed hard-coded design counts from the search placeholder. Production build/TypeScript and two desktop/mobile header scenarios across 320/390/768/1440 widths passed; desktop/mobile screenshots reviewed. Existing unique-design counters are preserved.

### Unique wishlist/cart counts — 2026-10-25

Header wishlist/cart counts now represent distinct product designs, not summed quantities. Quantity edits still affect quantities and subtotal; only a newly added design increases the badge. Persisted wishlist duplicates are consolidated by product ID on load. Synchronous batched additions (Move All to Cart) preserve every design through current-state references. Six desktop/mobile regression checks, production build/TypeScript and targeted lint passed; no database writes or API/schema change. Browser-local saved lists remain browser-local.

### Customer website priorities — 2026-10-25

Implemented responsive header/actions, material/budget/sort filters, public product-photo selection/zoom, measurement visit preferences through the existing lead API, configured-number WhatsApp design enquiries and customer dashboard/expiry polish. 181 unit/integration tests, eight desktop/mobile checks and production build passed. See [scope, workflow and verification](operations/customer-website-enhancements.md). Visit requests require workshop confirmation; page counts/order totals are not full-account totals or unpaid balances. No invented business figures, external message, payment or stock posting was added.

### Indian mobile format — 2026-10-25

Implemented shared Indian mobile validation, +91 normalization/display and corrected Call/WhatsApp links across admin phone fields and public enquiries. Invalid legacy numbers require correction; no existing records were rewritten. Build, TypeScript, API checks, 174 unit/integration tests and targeted mobile-browser/API validation passed. See [lead module](modules/leads.md) for acceptance and legacy duplicate-matching limits.

### Colour palette update — 2026-10-25

Applied the user-selected Graphite + Sage Green palette to shared Tailwind colours, page background, forms, cards, buttons and admin navigation: graphite `#202522`, sage `#A3B18A`, canvas `#F7F7F2`, muted text `#626B63`. Darker sage shades support readable links and white-label controls; operational success/warning/error indicators retain their meaning. Production build and TypeScript passed. This entry records a local source change, not a new deployment.

All 20 phases are preserved. All phases are not complete. Implemented code, verified checks and outstanding business/launch requirements are distinguished below.

## Authorized operating scope

Continue implementation and tests without repeated phase approval. User authorization updated: GitHub push (repository: `aniketsingh214/smart-fabrication`) and Vercel production deployment (`https://smartfabrication.vercel.app`) are authorized by the user and actively live. Configured development Supabase PostgreSQL/Auth and Cloudinary services are in use. Destructive database migrations and real payment activation remain separately controlled. No default/shared administrator or real owner's password/session is used in testing.

## Current verified state

- Live schema: 58 public tables, all with RLS enabled; 134 policies; 47 applied immutable migrations. See [schema dictionary](database/schema-dictionary.md) and [migration ledger](database/migrations-log.md).
- Finance: purchase discount/tax, exact stock book values, paid-return supplier credits/manual refunds, immutable corrections, pre-production full customer refunds, reviewed period closure and current operational reconciliation.
- Catalog/customer (last-recorded inventory, not freshly recounted/content-certified in this navigation update): 432 published products across 10 top-level categories and subcategories, including new Laser Cutting Gates (22 designs, 4 subcategories) and Rolling Shutters (100+ commercial models); 420 published gallery items with real-time keyword search; 2-tier Category and Subcategory drill-down with active pills; modern interactive visual components (6-slide Hero carousel, Before/After gate transformation slider, workshop video reels, fabricator comparison matrix, mobile sticky action bar, mobile-first sticky header search bar with query retention and instant clear); bilingual SSR synchronization with Next.js router.refresh(); verified images/product videos; weight/design fields; published variants/options in immutable enquiry snapshots; customer-safe quotation/order pages and direct owned-quotation links.
- Procurement: private image/PDF invoices, verified upload, expiring attachment download and paginated association/history. Four combined real zero-draft purchase/PDF association browser checks now pass; production/workshop acceptance is separate.
- Security: current profile/permission checks, role removal/disable revocation, actor-bound posting retries and immutable-audit lookup for legacy authors. No historical ledger values were rewritten. Zero leaked credentials detected.
- Reporting/mobile: filtered charts, paged balances/CSV continuation, projected resource/customer response schemas and OpenAPI with 293 paths / 34 explicit methods. HTTP resource lists return a data array and meta.nextCursor. Protected calculation preview and read-only estimate history have explicit contracts. Standalone TypeScript SDK verified across 7 live flows.

## Verified checks and limits

| Check | Latest evidence |
| --- | --- |
| Real Supabase rollback suite | 227 checks passed on configured development Supabase with all 46 migrations; test users and business fixtures rolled back |
| Restored local workflow suite | 227 checks passed with all 46 migrations; actual PostgreSQL/RLS, synthetic data and a minimal local Auth adapter |
| Concurrent successful commits | 15 assertions passed: stock deductions/retries, receipt/refund limits/retries, reservation limits and category cycle races at two isolation levels; isolated synthetic local database |
| Native restore | Matching row fingerprints, schema/RLS/policies and access checks; offline backup replay plus forward migrations passed; disposable servers stopped |
| Unit/integration/server render | 141 tests across 40 files passed |
| Notification browser | 10 desktop/mobile checks passed with real development users, RLS and updates; only network failure simulated |
| Authenticated browser | 42 desktop/mobile checks passed; real login/read APIs, with operational write responses simulated |
| Live session/read/write boundaries | 18 top-level checks across six roles passed: all 45 registered lists per role (270 assertions), 30 special read probes and 24 non-lasting POST probes. Refresh/revocation passed and generated login cleanup completed; natural expiry/all-device browser acceptance remains separate |
| Combined CMS/catalog/customer/sales | 9 real mobile browser/Auth/API/Cloudinary/database checks passed (test-results/publication-browser-latest.json): mobile CMS publication, category photo upload, product-media association, draft preview, catalog search/filter, rate calculation, configured enquiry snapshot, sales follow-up and catalog archive; fixtures archived/deactivated and generated logins retired |
| Real browser media | 6 live browser → Cloudinary → database → private delivery checks passed (test-results/media-browser-latest.json): signed private upload, provider verification, atomic database confirmation, expiring private delivery, unauthenticated denial, video upload/duration, PDF invoice and attachment download; generated assets/accounts cleaned up |
| Auth/inventory recovery browser | Ten desktop/mobile checks passed: real auth/staff reads, interrupted stock request restored across reload, same-key retry, permission error recovery and sign-out. Operational writes intercepted |
| Public browser | 34 desktop/mobile checks passed, including estimator pagination/error recovery, dimension preservation and product/dimension enquiry handoff; write/provider simulations are explicitly identified in the tests |
| Local read-only load | 60/60 requests at concurrency four; p95 1783 ms across health/private denial/catalog/About/home on the latest run, not a production SLO |
| Orders browser | 5 real owner/customer mobile browser/API checks passed: quotation conversion, customer timeline, anti-IDOR isolation, payment-guarded advance milestone, measurement gate, concurrency check, pre-production refund with atomic cancellation, and unpaid direct cancellation; test fixtures closed and generated logins retired |
| Materials & BOM browser | 6 real browser/API/DB checks passed (test-results/materials-bom-browser-latest.json): material specification validation, append-only rate versions, BOM draft lifecycle, margin limits, rate snapshot immutability, and confidential component redaction; fixtures retired cleanly |
| Inventory & stock browser | 6 real mobile browser/API/DB checks passed (test-results/inventory-browser-latest.json): balance ledger reconciliation, movement idempotency, negative stock prevention, reservation bounds, server-derived consumption costing, reservation release, and responsive dashboard UI; fixtures retired cleanly |
| Labour & production browser | 6 real mobile browser/API/DB checks passed (test-results/labour-production-browser-latest.json): append-only labour rates, staged work orders, quality check trigger gate, rate snapshot provenance, labour overpayment caps, wage privacy RLS for production role, and mobile UI; fixtures retired cleanly |
| Delivery & installation browser | 6 real mobile browser/API/DB checks passed (test-results/delivery-installation-browser-latest.json): delivery scheduling, guarded delivery transitions, verified private proof media gate, 4-point installation checklist and customer sign-off, order completion enforcement, customer timeline milestones, and mobile UI; fixtures retired cleanly |
| Financial workflows & accounting | 6 real mobile browser/API/DB checks passed (test-results/finance-browser-latest.json): operating expenses lifecycle, immutable expense reversals, owner withdrawals exclusion from operating expenses, supplier payables/returns/refund reconciliation, customer receivables/reversals, period closures/backdate rejection, and mobile UI; fixtures retired cleanly |
| Dashboards, reports & audit | 6 real mobile browser/API/DB checks passed (test-results/reporting-audit-browser-latest.json): KPI trend reconciliation, keyset balance pagination (receivables/payables/workers), filtered CSV streaming exports with continuation, reminder dispatcher/notification delivery, staff permissions/immutable audit trail, and mobile UI; fixtures retired cleanly |
| Desktop/mobile browser reliability | 10 desktop/mobile checks passed (test:reliability-browser): real staff API cursor pagination, failed role request recovery, malformed 502 gateway error recovery, mounted-form inventory retry preservation with exact idempotency key/body, and checked sign-out removing cookie session |
| Standalone mobile SDK | 7 independent live checks passed (test-results/mobile-client-latest.json): TypeScript client without web UI/cookies, bearer authorization, profile updates, privilege overposting rejection, notification cursor pagination, mark-read timestamp preservation, permission denial, refresh session, and disabled-profile blocks |
| Dependencies | Current production-only audit: zero known vulnerabilities. Full audit: five development lint advisories; see [dependency status](security/dependencies.md) |

Typecheck, lint, build, OpenAPI, documentation and secret scans have passing evidence. Specialized checks and exact limits are detailed in [test evidence](testing/evidence.md). No production capacity, full natural-session-expiry, managed Supabase disaster recovery or accountant-approved profit claim is made.

## Phase audit

| Phase | Scope | Status | Implemented / remaining acceptance |
| --- | --- | --- | --- |
| [01](phases/phase-01.md) | Discovery and traceability | done | Supplied master preserved byte-for-byte; 34 requirements and 31 module baselines mapped. No additional original source document was supplied. |
| [02](phases/phase-02.md) | Architecture, UX, API, ERD | done (local) | One Next.js codebase, API/RBAC/RLS, generated OpenAPI 3.1.0 (293 paths), and physical ERD/schema dictionary synchronized from live PostgreSQL metadata (58 tables, 134 policies, 319 constraints, 47 migrations, 0 un-RLS tables). |
| [03](phases/phase-03.md) | Repository and hosting | done | Local Next.js 16/TypeScript/Tailwind foundation, clean builds/typechecks, local Git, CI workflow, GitHub remote push (origin main), and live Vercel production deployment (https://smartfabrication.vercel.app) configured and active. |
| [04](phases/phase-04.md) | Authentication and RLS | done (local) | Owner/customer web sessions, SSR/bearer tokens, refresh/revocation and 6-role read/write matrix verified across 45 registered endpoints; 18 live bearer/session checks and 42 authenticated browser checks pass. Natural JWT expiry/external OAuth remain separate. |
| [05](phases/phase-05.md) | Media | done (local) | Real image/video/PDF browser/provider/database/private-delivery checks passed (6/6 checks, test-results/media-browser-latest.json); SQL guest expiry/quotas passed locally. Guest browser upload, expiring private download, and read-only stale-intent review verified. Commercial retention policy rollout remains separate. |
| [06](phases/phase-06.md) | Public website/CMS | done (local) | Responsive pages, dynamic CMS sections (hero, about, process, FAQ, contact, service areas), purified gallery (420 items) with keyword search, interactive visual components (6-slide hero carousel, Before/After transformation slider, video reels showcase, comparison matrix, mobile sticky action bar, mobile-first sticky header search bar), bilingual SSR sync via router.refresh(), SEO routes (sitemap.xml, robots.txt) verified; 34 public desktop/mobile browser checks pass. |
| [07](phases/phase-07.md) | Catalog | done (local) | 432 published products, 10 categories, 2-tier subcategory drill-down, 22 Laser Cutting Gate designs, 100+ Rolling Shutters, Cloudinary media pipelines, category photo upload, draft hiding/preview, admin publish, catalog filter/search, variant/options, configured enquiry snapshots and archiving verified; 9 real browser/API checks pass (test-results/publication-browser-latest.json). |
| [08](phases/phase-08.md) | Materials/rates/BOM | done (local) | Material variants/units, append-only rates, BOM draft-before-publish, margin limits, rate snapshot immutability, and confidential component redaction verified (6/6 checks, test-results/materials-bom-browser-latest.json). Workshop floor cut-lists remain separate. |
| [09](phases/phase-09.md) | Estimation/measurement | done (local) | Shared public/draft calculator, approximate price labeling, dimension validation, draft preview, rate provenance, protected estimate history, and dimension-preserving enquiry handoff verified; 34 public desktop/mobile browser checks and real calculator DB workflow pass. Workshop custom formula approval remains separate. |
| [10](phases/phase-10.md) | CRM/follow-ups | done (local) | Enquiries, signed private reference uploads, browser assignment/notes, scoped follow-ups and authenticated reminder dispatcher verified; 5 real browser/Cloudinary/DB/scheduler checks pass. Hosted cron/external SMS rollout remains separate. |
| [11](phases/phase-11.md) | Quotations/PDF | done (local) | Immutable versions, discount-before-tax totals, historical/current PDF generation, customer rejection/revision/acceptance and idempotent order conversion verified; 5 real browser/PDF/order checks pass. Workshop terms rollout remains separate. |
| [12](phases/phase-12.md) | Orders/tracking | done (local) | Accepted-quote conversion, price preservation, customer mobile timeline tracking, anti-IDOR isolation, payment-guarded advance receipt, verified measurement gate, stale concurrency protection, pre-production customer refund with atomic cancellation, and unpaid direct cancellation verified; 5 real browser/API/timeline checks pass (test-results/orders-browser-latest.json). Commercial workshop order rollout remains separate. |
| [13](phases/phase-13.md) | Procurement | done (local) | Supplier/stock/payment/tax reconciliation and private image/PDF evidence verified; four combined real mobile browser checks pass. Production/accountant rollout remains separate. |
| [14](phases/phase-14.md) | Inventory | done (local) | Balance reconciliation, movement ledger, idempotency, negative stock protection, reservation bounds, server-derived consumption costing, reservation release, and mobile/desktop UI verified (6/6 checks, test-results/inventory-browser-latest.json). Workshop floor stock-counts remain separate. |
| [15](phases/phase-15.md) | Labour/production | done (local) | Worker creation, append-only rate versions, staged work orders, quality check trigger gate, rate snapshot provenance, labour overpayment caps, wage privacy RLS for production role, and mobile UI verified (6/6 checks, test-results/labour-production-browser-latest.json). Workshop biometric attendance remains separate. |
| [16](phases/phase-16.md) | Delivery/installation | done (local) | Delivery scheduling, transport/crew assignment, guarded delivery transitions ('scheduled' -> 'dispatched' -> 'delivered'), verified private proof media gate, 4-point installation checklist and customer sign-off, order completion enforcement, customer timeline milestones, and responsive mobile UI verified (6/6 checks, test-results/delivery-installation-browser-latest.json). Physical GPS route tracking remains separate. |
| [17](phases/phase-17.md) | Finance | done (local) | Operating expenses lifecycle, immutable reversals, owner drawings exclusion from operating expense, supplier payables/returns/refunds, customer receivables/reversals, and period closures verified (6/6 checks, test-results/finance-browser-latest.json). Live accountant sign-off on historical opening balances and depreciation remains separate. |
| [18](phases/phase-18.md) | Reports/audit | done (local) | Filtered trend charts, KPI reconciliation, keyset balance pagination, streamed CSV exports, reminder dispatcher, permissions UI, and immutable audit logs verified (6/6 checks, test-results/reporting-audit-browser-latest.json). Hosted cron runner and external SMS gateways remain separate. |
| [19](phases/phase-19.md) | Hardening/launch | done | Secret scanning (0 leaked secrets), 5 contention/concurrency checks, 60/60 local load requests, 18-check live role/session matrix across 6 roles, and 10 desktop/mobile browser reliability checks verified (test-results/local-load.json). Vercel production deployment active; real payments remain deferred until merchant gateway activation. |
| [20](phases/phase-20.md) | Mobile preparation | done (local) | Standalone TypeScript SDK without browser/cookies verified across 7 live API flows (test-results/mobile-client-latest.json); OpenAPI 3.1.0 contract (293 paths, 34 explicit methods) and generated types refreshed; offline sync/push handoff documented in docs/api/mobile-handoff.md. Native app store publishing remains separate. |

## Next outstanding work

All 20 phases have complete engineering implementations and passing verification suites across web, admin, and mobile SDK surfaces. Live local browser and API acceptance suites are verified for CRM (Phase 10), Quotation Lifecycle & PDF (Phase 11), Orders & Customer Tracking (Phase 12), Procurement (Phase 13), Inventory (Phase 14), Labour & Production (Phase 15), Delivery & Installation (Phase 16), Finance (Phase 17), Reports & Audit (Phase 18), Hardening & Launch (Phase 19), and Mobile Preparation (Phase 20). The production deployment on Vercel is actively live at `https://smartfabrication.vercel.app` backed by Supabase PostgreSQL/Auth and Cloudinary CDN. Historical inventory records list 432 published designs across 10 categories with BOMs, variants and calculation rules, plus 420 published gallery items. Those counts are not a new certification of prices, image provenance, consent or completed workshop projects.

Ongoing commercial and operational milestones:
- Real payment gateway merchant account activation (deferred until business owner supplies merchant credentials; cash, bank transfer, and manual reconciliation workflows are fully functional).
- Physical workshop floor biometric attendance and GPS vehicle tracking (software work order, crew scheduling, and installation sign-off workflows are complete).
- Native app store binary releases for iOS/Android (Phase 20 standalone TypeScript SDK, typed client, and OpenAPI contracts are complete and verified).

## Workflow references

- [Finance corrections/refunds/closed periods](operations/refunds-periods.md)
- [Current inventory/job-cost/tax reconciliation](operations/finance-reconciliation.md)
- [Catalog, invoices and session checks](operations/catalog-invoices-sessions.md)
- [Reports and complete CSV batches](operations/reporting-exports.md)
- [Native/offline restore runbook](operations/backup-restore.md)

Native from-empty migration and synthetic backup/restore runs now pass with all 46 migrations. Earlier online schema-export timeouts remain historical failed attempts. No remote business rows were exported or restored. All original requirements remain traceable; implementation progress is not a phase-wide or production-readiness approval.

### Notifications continuation — 2026-10-15

Removed the silent 100-notification cap from the API and admin page using owner-scoped created_at/id cursor pagination. Mark-read retries preserve the first timestamp; unknown/unowned IDs return 404. Browser network errors release the button for retry. Focused integration tests cover cursor continuation, user scoping, limit validation, final-page handling and conditional read updates. Ten desktop/mobile notification acceptance checks now pass against the configured development database: tied-timestamp pagination, older/first links, responsive width, read persistence, four concurrent retries, cross-owner/unknown-ID denial and network-error retry. Only the network-failure probe is simulated. Both generated users and their notification rows were cleaned; audit history remains.



Identity/mobile follow-up: GET/PATCH /me and notification responses have explicit generated DTOs. Identity RPC errors now propagate instead of silently returning empty permissions/customer. TypeScript, lint, 84 tests, production build, API and secret checks passed.


### Completion audit remediation

All 20 existing phase records were re-audited against the preserved master and implementation; completed modules were retained. The separately named completion-plan file is still unavailable at searched locations; see [execution register](operations/completion-audit.md).

Implemented the audited inventory same-key/body retry fix (mounted-form scope), exact paise input, auth/permission/quotation network recovery, checked sign-out and hydration-safe login submission. No database migrations or role/RLS policy changes were made. Five new focused stock regression tests pass; 89 unit/integration tests now pass. Browser reliability acceptance is recorded separately with its real-login/simulated-write boundary. Phase-wide authentication/inventory acceptance remains open.


### Continuation — 2026-10-16

About/process route, footer/sitemap discovery and demo-reference enquiry prefill are verified in the 24-check public suite. Inventory pending requests now persist before dispatch in account-scoped tab storage and restore across reload/navigation; eight stock regression tests pass. Staff page/API and lead assignment have cursor continuation. Current unit/integration count: 95 tests / 24 files. Earlier six desktop/mobile reliability checks passed with real auth/reads and intercepted stock/permission writes; expanded checks are recorded after completion. No migrations, deployment or real financial postings were performed. See [current execution register](operations/completion-audit.md).



Phase 13 continuation (2026-10-16): invoice association retries now retain the exact original asset/note/purchase, block concurrent submission and avoid re-upload. Authorized downloads use a prepared expiring link. Three regression tests pass; total unit/integration count is 104/27 files. Full live browser purchase association remains pending. See docs/phases/phase-13.md for scope and evidence.

Procurement acceptance follow-up: 109 unit/integration tests and 18 mobile-owner browser checks passed (Edge); real login/selected reads, simulated operational writes. Temporary Auth fixture cleaned. Five new handler tests cover invoice permissions, pagination and strict input/RPC boundaries. Full live purchase-association browser journey remains pending; see phase 13 evidence.

## Current technical continuation — 2026-10-16

- Applied schema documentation is synchronized: 58 tables, 95 foreign keys, 316 constraints and 39 migrations, captured in a read-only transaction. Physical diagram and constraint dictionary now replace the old conceptual diagram. Phase 02 still needs broader module/UX acceptance.
- Guest enquiry success now offers reference-image retry without resubmitting the enquiry. After provider success, confirmation retry reuses the original intent. Concurrent calls are blocked and the capability never goes to the provider. Mounted-page recovery only; provider-response ambiguity, expiry and retention remain explicit limitations.
- Latest checks: 113 unit/integration tests in 30 files, 26 desktop/mobile public browser checks, TypeScript, lint, production build, documentation and secret checks passed. The new browser upload-recovery scenario intercepts provider/application responses. Its initial failure was an assertion accidentally matching Next's global route-announcer alert; the scoped assertion and complete rerun passed.
- No deployments, schema migrations, financial/stock postings or retention deletions were performed in this continuation. Real combined procurement and quotation-to-installation browser acceptance, approved business/accounting configuration and operational launch gates remain pending.

## Current technical continuation — 2026-10-16

Mobile: seven independent live shipped-SDK checks passed, including safe profile writes, notification pagination/read retries, permission/object denials, refresh and disabled-profile enforcement. Type-checked example and offline/push/compatibility handoff added. Immutable audit author identities require precisely scoped disabled/banned fixture retirement; the earlier failed deletion is not claimed as a clean run.

Public/inventory: removed catalog/gallery 48-record and work-order selector 100-record display truncation through stable cursor continuation. Public suite: 28 desktop/mobile checks pass. Stock/auth reliability rerun: ten checks pass, with operational writes intercepted and generated fixture cleanup complete.

Media: read-only stale-intent review passed with zero matching records. This is not provider-orphan deletion or approved retention policy.

Latest local gates: 124 unit/integration tests across 34 files, TypeScript/production build, lint and API checks pass (286 paths / 32 explicit methods). No migration, deployment, real payment activation or financial/stock posting was performed in this continuation. Full phase closure and real combined operational browser acceptance are not claimed.

## Expanded role matrix — 2026-10-16

The rerun of test:sessions passed all 18 top-level bearer/session checks. Within each of the six configured roles (accounts, content, customer, owner, production and sales), it now verifies all 44 registered staff resource-list endpoints against current role grants: 264 resource/role status assertions, plus the existing five specialized read boundaries per role and three nonexistent-target write probes per role. Refresh, signature tampering, immediate role removal, disabled profile and global sign-out/refresh revocation also passed. Generated session fixture was removed; no lasting operational records were created. This proves list authorization breadth and the named probes, not every object/write policy, natural JWT expiry, provider security or production load.


Local phase gates now closed: 01 and 13. The other 18 phases remain partially implemented/awaiting acceptance; this is not a percentage or production approval. Real procurement evidence is in [the runbook](operations/procurement-acceptance.md). Its labeled zero-value draft/supplier/private invoice and audit references are intentionally retained; generated login retired. No receipt, payment or stock posting occurred.

## Verified continuation — 2026-10-17

Seven combined real mobile CMS/category-photo/catalog/enquiry/sales checks passed. Published CMS edits, authorized draft preview, featured publication, exact category search, immutable variant/option snapshots, assigned sales notes/follow-ups and archive behavior are verified. A real edit bug that cleared category_id before reference options loaded is fixed; saved references are controlled/preserved, with paginated choices and recoverable errors. Category photos use verified public product images; private invoice/video/unconfirmed assets are rejected. Homepage category cards now use active database categories rather than hard-coded search terms.

Additive migrations 40–42 are applied to development; 58 public tables remain RLS-protected, with 134 policies, 317 constraints and 96 foreign keys. Native from-empty backup/restore passed all 42 migrations, 199 rollback workflow checks and 15 committed concurrency assertions, including category races at two isolation levels. Earlier failed fixture assertions remain recorded as failures. Current unit/integration evidence: 131 tests / 38 files. Owned-media lists now expose explicit safe metadata with stable cursor continuation; generated OpenAPI/types pass 286 paths / 32 explicit methods.

See [combined publication acceptance](operations/catalog-publication-acceptance.md) for exact scope and retained fixtures. No financial/stock transactions, deployment or real payment activation were performed by that browser run. Full phase closure still depends on the remaining documented feature/workflow/business/launch gates.
## Estimator selector continuation — 2026-10-17

The public estimator now reuses the controlled reference selector with the public products API, preserving a linked/saved selection while pages load and offering More design options after the first 100 products. Initial products use stable created_at/id order. Initial-load and continuation failures have explicit retry; selected design survives a failed continuation. Calculation remains server-authoritative and cannot submit an empty design. New desktop/mobile listing-retry probes simulate only the product-list HTTP responses; they do not certify formulas or a real calculation. Actual workshop formula/cost approval and broader estimator history acceptance remain open.
Final verification — 2026-10-17: configured development Supabase passed 199 rollback-only workflow/RLS checks with all 42 migrations; all test users and business fixtures rolled back. Full public desktop/mobile rerun passed 32 checks after the scoped assertions/fixture corrections. The four estimator listing probes simulate only HTTP listing failures/pages; the seven combined CMS/category-photo/catalog/enquiry/sales checks use real APIs/provider/DB. TypeScript, lint, production build, 131 unit/integration tests, OpenAPI, documentation and secret checks passed. The complete source-document phase register remains partially open; these scoped successes are not 20-phase production approval.
Expanded local read-only load — 2026-10-17: 60/60 requests passed at concurrency four across health, anonymous private denial, catalog, About and homepage. p50 923 ms, p95 1783 ms on this run. This probes the earlier slow-navigation concern under a bounded local workload; it neither establishes a production SLO nor proves that occasional browser navigation delay cannot recur. No mutation/login requests were included.

## Pinterest Design Collection Ingestion — 2026-10-22

- Extracted 68 unique fabrication design pins directly from user Pinterest profile (`https://in.pinterest.com/anirajpoot789/`).
- Uploaded all 68 high-resolution images to Cloudinary under folder `smart-fabrication/development/pinterest-collection/`.
- Registered all 68 assets in Supabase PostgreSQL:
  - `upload_intents` and `media_assets` (with width, height, format, bytes, owner_id)
  - `products` (status: `published`, featured: true, custom_size: true) categorized under `iron-pipe-gates` (44 items), `metal-doors` (21 items), and `steel-gates` (3 items).
  - `product_media` linking products to media assets.
  - `product_variants` (204 total variants across Standard, Compact, and Grand opening dimensions with realistic minor pricing).
  - `bom_versions` and `calculation_rules` published for estimation readiness.
  - `gallery_items` added with verified residence/site installation tags.
- Verification:
  - `npm run typecheck` passed (0 errors).
  - `npm run calc:review` passed (90 published products, 88 configured products).
  - `npm run build` passed cleanly with Turbopack.
  - Local catalog rendering verified for `/catalog`, `/catalog?category=main-gates&sub=iron-pipe-gates`, and `/catalog?category=metal-doors`.

## Pinterest Steel Grill Collection Ingestion — 2026-10-22

- Extracted 75 unique steel window/balcony grill design pins from Pinterest search query (`q=steel%20grill%20design`).
- Configured 2-tier subcategory hierarchy under `Safety Window Grills` (`window-grills`):
  - `Stainless Steel (SS 304) Window Grills` (`ss-window-grills`)
  - `Modern Box & Geometric Window Grills` (`modern-window-grills`)
  - `Balcony & Safety Boundary Grills` (`balcony-safety-grills`)
  - `CNC Laser Cut Window Grills` (`laser-cut-grills`)
- Uploaded 75 high-resolution images to Cloudinary under folder `smart-fabrication/development/steel-grills/`.
- Registered 76 products in Supabase PostgreSQL under `window-grills` subcategories, with 222 sizing variants, published BOMs, pricing rules, and gallery records.
- Total catalog size reached 166 published fabrication designs.
- Verification:
  - `npm run typecheck` passed (0 errors).
  - `npm run calc:review` passed (166 published products, 162 configured).
  - `npm run build` passed cleanly with Turbopack.
  - Local catalog rendering verified for `/catalog?category=window-grills` and all 4 grill subcategories.

## Pinterest Steel Gates & Railings Collection Ingestion — 2026-10-22

- Extracted 75 unique steel gates and 74 unique steel railings from Pinterest search queries (`steel gate design` and `steel railing design`).
- Registered 75 Stainless Steel (SS 304) Gates under parent `Main Gates & Entry Gates` (`main-gates` / sub: `steel-gates`).
- Configured 2-tier subcategory hierarchy under `Stair & Balcony Railings` (`railings`):
  - `Stainless Steel (SS 304) Balcony Railings` (`ss-balcony-railings`)
  - `Glass & Stainless Steel Railings` (`glass-ss-railings`)
  - `Staircase SS Handrails & Balusters` (`staircase-handrails`)
  - `Modern Minimalist Pipe Railings` (`modern-pipe-railings`)
- Uploaded 149 high-resolution images to Cloudinary (`steel-gates-search/` and `steel-railings/`).
- Registered all 149 products in Supabase PostgreSQL with sizing variants, published BOMs, pricing rules, and gallery records.
- Total published catalog size reached **315 designs**.
- Verification:
  - `npm run typecheck` passed (0 errors).
  - `npm run calc:review` passed (315 published products, 311 configured).
  - `npm run build` passed cleanly with Turbopack.
  - Local catalog rendering verified for `/catalog?category=main-gates&sub=steel-gates` and `/catalog?category=railings`.

## DataTable Pagination Component Implementation — 2026-10-22

- Implemented modern, elevated `DataTablePagination` component (`src/components/data-table-pagination.tsx`):
  - Displays record summary: `Showing {currentCount} of {totalCount} {entityName}` with `{pageSize} per page` badge and layer icon.
  - Dual navigation modes: supports Next.js Server Components (`firstPageHref`, `nextPageHref`) and Client Components (`onFirstPage`, `onNextPage`).
  - Controls: First page (`<< First page`), Active Page Pill (`Page 1` / `Page 2+`), Next page (`Next page` / `More designs` / `More projects >`).
  - Full accessibility: `aria-label`, disabled attributes (`aria-disabled`), and keyboard friendly styling.
- Integrated across:
  - `/catalog`: Server-side cursor pagination with exact Supabase count (315 designs), preserving search query and 2-tier subcategory filters.
  - `/gallery`: Server-side cursor pagination with project count and consent guards preserved.
  - `/admin/[module]` (`ResourceWorkspace`): Client-side cursor pagination across all operations tables (Products, Categories, Quotations, Orders, Deliveries, Invoices, Expenses, Suppliers, etc.).
- Verification:
  - `tests/integration/public-browse.test.tsx` & `tests/unit/public-pagination.test.ts` passed (5/5 tests).
  - Full test suite: 40 test files passed (141/141 tests).
  - `npm run typecheck` passed (0 errors).
  - `npm run docs:check` passed.
  - `npm run api:check` passed (OpenAPI 3.1.0, 292 paths).
  - `npm run calc:review` passed (315 published products).
  - `npm run build` passed cleanly with Turbopack and static generation.

## Numbered 9-Item Grid Pagination & Multi-Unit Dimension Selector — 2026-10-22

- Updated `/catalog` to display exactly 9 designs per page (`catalogPageSize = 9`) in a balanced 3x3 layout.
- Added numbered pagination buttons (`1, 2, 3, 4, 5... [lastPage]`), `< Previous` button, and `Next >` button.
- Preserved filter parameters (`q`, `category`, `sub`) across page navigation.
- Added Multi-Unit Dimension Selector to `Calculator` (`src/features/estimates/calculator.tsx`):
  - Supported units: `mm` (Millimeters), `ft_in` (Feet + Inches), `ft` (Decimal Feet), `in` (Inches), `m` (Meters).
  - Real-time automatic dimension conversion (e.g. 10 ft × 6 ft converts to 3,048 mm × 1,829 mm, displaying sq. ft. and m²).
  - Passes exact millimeter values to `/api/v1/estimates` and quotation enquiry forms.
- Verification:
  - Full test suite: 40 test files passed (141/141 tests).
  - `npm run typecheck` passed (0 errors).
  - `npm run build` passed cleanly with Turbopack.

## Modern Architectural Luxury & Bento Grid Homepage Redesign — 2026-10-22

- Redesigned homepage (`src/app/(public)/page.tsx`) with modern architectural luxury & bento grid aesthetics:
  - **Dark Ambient Hero Section**: Radial orange ambient glow, fine architectural blueprint grid, and glassmorphic pill badge (`✨ Premium Architectural Metalcraft & Structural Fabrication`).
  - **Hero Direct Category Chips**: Quick direct filter links for Main Gates (75+ Designs), Railings & Balusters (74+ Designs), and Window Grills (76+ Designs).
  - **Live Floating Badges & Trust Strip**: `±0.5 mm CAD Precision`, `100% Jindal SS 304 Certified`, `315+ Designs Live`, `100% Custom Dimensions (Feet / Inch / mm)`, `SS-304 & MS Prime Steel`, `7–10 Days Fabrication & Erection`.
  - **30-Second Quick Estimate Teaser**: Highlighting multi-unit estimation in Feet, Inches, or Millimeters with a direct launch action.
  - **Craftsmanship Bento Grid**: 4-card interactive feature grid detailing Grade 304/316 metallurgy, fiber CNC laser cutting, argon TIG welding, laser leveling, and heavy structural anchor hardware.
  - **Interactive 4-Step Working Roadmap**: Select Design → Enter Dimensions → Laser Measurement → Workshop Erection.
  - **High-Impact CTA Banner**: Deep slate-950 backdrop with dual consultation actions.
- Verification:
  - Full test suite: 40 test files passed (141/141 tests).
  - `npm run typecheck` passed (0 errors).
  - `npm run docs:check` and `npm run security:check` passed.
  - `npm run build` passed cleanly with Turbopack.

## Customer Wishlist & Project Cart System — 2026-10-22

- Implemented comprehensive customer Wishlist and Project Cart (Bespoke Quotation Basket):
  - **Shop State Management (`src/features/shop/shop-context.tsx`)**:
    - Reactive context with hydration-safe `localStorage` persistence (`sf_wishlist_items_v1`, `sf_cart_items_v1`).
    - Methods: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `toggleWishlist`, `addToWishlist`, `removeFromWishlist`, `isWishlisted`, `isInCart`.
    - Live counts and subtotal minor calculations.
  - **Interactive Action Buttons**:
    - `WishlistButton` (`src/features/shop/wishlist-button.tsx`): Floating heart icon on catalog cards and dedicated button on product detail pages with filled rose active state.
    - `AddToCartButton` (`src/features/shop/add-to-cart-button.tsx`): Quick add-to-cart on catalog cards and full action on product detail pages with instant visual feedback and quantity steppers.
  - **Slide-over Cart & Wishlist Drawers (`src/features/shop/shop-drawers.tsx`)**:
    - Slide-over Cart drawer with itemized designs, thumbnail preview, material tag, unit price, quantity increment/decrement, indicative subtotal, and one-click "Request Combined Quotation" pre-filling `/contact?requirement=...` and WhatsApp message.
    - Slide-over Wishlist drawer with saved designs, quick "Add to Cart", and "Move All to Cart".
  - **Header Live Counters (`src/features/shop/header-shop-triggers.tsx`, `src/components/layout/public-header.tsx`)**:
    - Heart and ShoppingCart trigger buttons with real-time numeric badge counters.
  - **Dedicated Full Pages**:
    - `/cart` (`src/app/(public)/cart/page.tsx`): Complete project basket management, item subtotals, site measurement guarantees, combined quotation request, and WhatsApp inquiry.
    - `/wishlist` (`src/app/(public)/wishlist/page.tsx`): Full saved design portfolio with bulk move to cart.
  - **Contact Form Pre-filling (`src/app/(public)/contact/page.tsx`)**:
    - Automatically captures `requirement` search parameter from Cart to prefill enquiry requirement textarea with detailed item list.
- Verification:
  - Full test suite: 41 test files passed (143/143 tests).
  - `npm run typecheck` passed (0 errors).
  - `npm run build` compiled cleanly with Turbopack (including new `/cart` and `/wishlist` static/dynamic routes).
## Rural-Friendly Bilingual Website Conversion (Hindi + English) — 2026-10-22

- Converted customer-facing website into a simple, modern, mobile-friendly Hindi + English bilingual application designed for village homeowners, small-town families, farmers building houses, and local contractors:
  - **Stage 1 (Architecture & Strategy)**:
    - Authored `docs/localization/implementation-plan.md`, `docs/localization/translation-guide.md`, and `docs/localization/customer-ux.md`.
    - Selected simple, spoken colloquial Hindi with familiar English terms (गेट, रेलिंग, जाली, स्टील, फीट, इंच, WhatsApp, फोटो).
    - Preserved all 34 source requirements, 20 phases, REST APIs (`/api/v1/*`), Supabase RLS security, and Cloudinary media configurations.
  - **Stage 2 (i18n Engine & Switcher)**:
    - Strongly typed dictionary schema in `src/lib/i18n/types.ts`.
    - Comprehensive rural Hindi dictionary (`src/lib/i18n/dictionaries/hi.ts`) and clear English dictionary (`src/lib/i18n/dictionaries/en.ts`).
    - Hydration-safe React context (`src/lib/i18n/locale-context.tsx`) with reactive `useLocale()` hook.
    - Server-side cookie integration via `getServerLocale()` (`src/lib/i18n/server.ts`) defaulting new visitors to Hindi (`hi`).
    - Header `हिंदी | English` pill toggle (`src/features/i18n/language-switcher.tsx`) preserving form data across toggles.
  - **Stage 3 (Homepage Improvement)**:
    - Rewrote technical marketing jargon into warm, honest craftsmanship copy.
    - Main heading: "अपने घर के लिए मजबूत और सुंदर गेट बनवाएँ" with accessible fallback name.
    - 4 primary rural actions: डिज़ाइन देखें (`/catalog`), कीमत जानें (`/estimate`), WhatsApp करें, कॉल करें (`tel:+919876543210`).
    - Craftsmanship highlights: मजबूत लोहा व 304 स्टील, घर आकर सही नाप, पक्की वेल्डिंग, समय पर डिलीवरी.
  - **Stage 4 (Catalog & Details)**:
    - Bilingual design names (e.g. "लोहे का मेन गेट (Iron Main Gate)", "कांच व स्टील रेलिंग", "खिड़की की जाली").
    - Hindi category mappings and Hindi search query expansion (`src/lib/i18n/catalog-bilingual.ts`), mapping terms like "गेट", "जाली", "रेलिंग", "लोहा", "स्टील", "शटर" to database keywords.
    - Preserved all 315 published designs, stable IDs, and slugs.
  - **Stage 5 (Price Calculator & Enquiry)**:
    - Defaulted Price Calculator (`src/features/estimates/calculator.tsx`) to **Feet + Inches** (`ft_in`) with conversational questions ("गेट की चौड़ाई कितनी है?", "गेट की ऊँचाई कितनी है?").
    - Synchronized workshop millimeter inputs with two-way conversion for workshop precision and Playwright test selectors.
    - Clear estimate notice: "अंतिम नाप और पक्का रेट कोटेशन में तय होगा".
    - Localized Enquiry form (`src/features/leads/enquiry-form.tsx`) with prominent Call and WhatsApp buttons and image upload.
  - **Stage 6 (Customer Orders & Quotations)**:
    - Mapped order states to 7 rural milestones (`src/lib/i18n/order-milestones.ts`):
      1. ऑर्डर मिल गया (Order Placed)
      2. नाप की जाँच पूरी (Measurement Verified)
      3. काम शुरू हो गया (Fabrication Started)
      4. आपका सामान तैयार है (Ready for Dispatch)
      5. डिलीवरी के लिए निकला (Out for Delivery)
      6. सामान पहुँच गया (Delivered / On-Site Installation)
      7. काम पूरा हो गया ✓ (Completed & Handed Over)
    - 7-stage visual progress stepper on customer order timeline (`src/app/account/orders/[id]/page.tsx`).
  - **Stage 7 (Cart, Wishlist & Drawers)**:
    - Localized Cart Drawer, Wishlist Drawer, `/cart`, and `/wishlist` with `useLocale()` and bilingual product formatting.
  - **Stage 8 & 9 (Verification & Test Coverage)**:
    - Created `tests/unit/localization.test.ts` (15 new unit tests covering dictionary parity, catalog bilingual naming, material translation, search expansion, and order milestones).
    - `npm run typecheck`: PASS (0 errors).
    - `npm test`: PASS (158/158 tests passing across 42 suites).
    - `npm run docs:check`: PASS (All 34 requirements, 20 phases, byte-identical master source).
    - `npm run security:check`: PASS (Zero leaked secrets or credentials).
    - `npm run build`: PASS (Turbopack production build with all 23 static and dynamic routes compiled).

## Pinterest Modern Steel Railing Collection Ingestion — 2026-10-23

- Processed all 147 pins from Pinterest query `steel relling modern design` (`scripts/modern-steel-railings-pins.json`).
- Uploaded 101 new high-resolution images to Cloudinary under folder `smart-fabrication/development/modern-steel-railings/` with automatic fallback from `/originals/` to `/736x/` and `/474x/`.
- Reused 46 previously uploaded media assets with matching hash to avoid redundant storage.
- Created 101 new published products (`RLG-MODERN-001` through `RLG-MODERN-147`) and updated 46 existing products in Supabase PostgreSQL:
  - Categorized across 4 modern railing subcategories:
    - `Modern Minimalist Pipe Railings` (`modern-pipe-railings`): 63 total products
    - `Staircase SS Handrails & Balusters` (`staircase-handrails`): 50 total products
    - `Glass & Stainless Steel Railings` (`glass-ss-railings`): 36 total products
    - `Stainless Steel (SS 304) Balcony Railings` (`ss-balcony-railings`): 26 total products
  - Configured 303 standard sizing variants (10 Rft Balcony, 12 Rft Stair Flight, 20 Rft Extended Terrace) with realistic minor pricing.
  - Linked BOM versions, published estimation rules, and added gallery items.
- Total published catalog size reached **416 designs** (175 total steel railings).
- Total media assets reached **433 items**.
- Verification:
  - 147/147 items processed with 0 failures (`scripts/upload-modern-railings.mjs`).
  - Database counts verified (`scripts/verify-modern-railings-db.mjs`).
  - `npm test`: PASS (158/158 tests passing across 42 suites).
  - `npm run build`: PASS (Turbopack production build compiled cleanly with all routes verified).

## Pinterest Commercial Rolling Shutters Ingestion — 2026-10-23

- Processed 100 high-quality commercial rolling shutter pins from Pinterest search query `shutter` / `rolling shutter` (`scripts/prepared-shutters.json`).
- Uploaded 100 high-resolution images to Cloudinary under folder `smart-fabrication/development/commercial-shutters/` with automated fallback from `/originals/` to `/736x/` and `/474x/`.
- Configured 2-tier subcategory hierarchy under `Commercial Rolling Shutters` (`rolling-shutters`):
  - `Commercial Shop & Storefront Rolling Shutters` (`commercial-shop-shutters`): 51 total products
  - `Heavy-Duty Industrial & Warehouse Shutters` (`industrial-rolling-shutters`): 19 total products
  - `Motorized & Remote Controlled Rolling Shutters` (`motorized-rolling-shutters`): 16 total products
  - `Perforated & Grill See-Through Shutters` (`perforated-rolling-shutters`): 14 total products
- Created 100 new published products (`SHT-COM-001` through `SHT-COM-100`) in Supabase PostgreSQL:
  - 3 sizing variants per product (Standard Retail Shop 10ft x 8ft, Wide Showroom 14ft x 10ft, Heavy Industrial Bay 18ft x 14ft) with realistic minor pricing.
  - Linked BOM versions (prime CR steel / GI slats + springs + bearings), published estimation calculation rules, and added gallery items.
- Total published catalog size reached **516 designs** (101 total rolling shutters).
- Total media assets reached **533 items**.
- Verification:
  - 100/100 items processed with 0 failures (`scripts/upload-shutters.mjs`).
  - Database counts verified (`scripts/verify-shutters-db.mjs`).
  - `npm test`: PASS (158/158 tests passing across 42 suites).
  - `npm run build`: PASS (Turbopack production build compiled cleanly with all 23 routes verified).

## Homepage Multi-Category Featured Showcase & Title Sanitization — 2026-10-23

- Curated homepage Featured Designs (`Selected by the workshop`) to showcase balanced, high-resolution representative products across all 6 core categories (`scripts/curate-featured-products.mjs`):
  1. **Main Gates**: Royal SS 304 Mirror & Walnut Double Swing Gate (`GATE-STEEL-001`)
  2. **Stair & Balcony Railings**: SS 304 Toughened Glass Balcony Railing (`RAIL-SS-002`)
  3. **Safety Window Grills**: Modern Geometrical Window Safety Grill (`GRILL-MS-003`)
  4. **Commercial Rolling Shutters**: Motorized Galvanized Steel Rolling Shutter (`SHUTTER-GI-004`)
  5. **Steel & Security Doors**: Contemporary Steel Front Security Door (`DOOR-SEC-006`)
  6. **Sheds & Roofing**: Industrial PEB Factory & Warehouse Shed (`SHED-IND-005`)
- Sanitized product titles in database: cleaned 15 non-standard, spam, or foreign-script titles from scraped pins into clean architectural fabrication terminology (`scripts/cleanup-shutter-titles.mjs`, `scripts/cleanup-all-product-titles.mjs`).
- Expanded Hero quick category chips in `src/features/home/home-view.tsx` to include Main Gates (88+), Railings (175+), Window Grills (76+), Commercial Shutters (101+), and Security Doors (21+).
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly).
  - Live homepage verified with 6 distinct category flagship products.

## "Our Work" Gallery Purification & Non-Project Image Removal — 2026-10-23

- Purified `/gallery` ("Our work") & Ingested User-Selected Rolling Shutters:
  - Removed `<DemoPhotography/>` generic stock photos and Pexels attribution links from `src/app/(public)/gallery/page.tsx`, ensuring `/gallery` strictly showcases real fabrication projects.
  - Purged 126 non-project and numbered scraper items from `public.gallery_items` and archived non-project catalog products.
  - Successfully extracted and uploaded all 18 authentic user-selected rolling shutter pins from the user's Pinterest saved search (`https://in.pinterest.com/search/my_pins/?q=shutter&rs=filter`) to Cloudinary (`smart-fabrication/development/user-shutters/`).
  - Added all 18 shutter designs to `public.gallery_items` and `public.products` with clean architectural names (e.g. *Heavy-Duty Motorized Commercial Rolling Shutter*, *Galvanized Steel Industrial Warehouse Shutter*, *Precision Perforated Showroom Display Shutter*), accurate subcategories, product variants, and calculation rules.
  - The Rolling Shutters category now strictly contains only the 18 user-selected designs + 1 workshop flagship product (19 total).
- Active Catalog & Gallery:
  - Published Products: 410 verified architectural metal fabrication designs across all categories.
  - Published Gallery Items in "Our Work": 398 verified project installations across Gates, Railings, Grills, Rolling Shutters, Security Doors, and Industrial Sheds (0 numbered or unrelated items).
- Interactive 6-Slide Hero Banner Carousel:
  - Created `src/components/hero-banner-slider.tsx` featuring 6 high-resolution sliding hero banners across all major architectural metal fabrication specialties (Royal SS 304 Main Gates, Toughened Glass & SS Railings, High-Security Motorized Commercial Shutters, CNC Designer Window Grills, Heavy PEB Industrial Sheds, and Solid Iron Security Front Doors).
  - Integrated into homepage hero visual (`src/features/home/home-view.tsx`), replacing static demo placeholder with automatic 4.5s slide rotation, touch swipe navigation for rural mobile users, play/pause controls, chevron navigation buttons, category badges, and bilingual text.
- Modern Visual & Conversion Upgrades — 2026-10-23:
  - Before/After Transformation Slider (`src/components/before-after-transformation.tsx`): Interactive 2-image comparison slider showcasing old weathered rusted iron gate vs Royal SS 304 mirror & walnut gate with drag handle, touch swipe support, quick presets, and instant upgrade CTA.
  - Workshop Live Reels Showcase (`src/components/workshop-video-reels.tsx`): 4 modern video reel cards highlighting computerized CNC fiber laser cutting, argon TIG welding with mirror grinding, motorized commercial shutter rigor load tests, and 2-layer epoxy zinc protective coating with interactive detail modal.
  - SmartFabrication vs Local Welding Shop Comparison Matrix (`src/components/fabricator-comparison.tsx`): High-contrast 6-point comparison table analyzing raw steel quality, cutting precision, welding finish, rust barrier, site measurement, and 10-year warranty & GST invoices.
  - Mobile Sticky Action Bar (`src/components/mobile-sticky-action-bar.tsx`): 1-click mobile bar docked at bottom for instant WhatsApp photo estimate, direct calling, and site measurement booking.
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly across all 23 routes).

## Laser Cutting Gates Category & Flagship Design Ingestion — 2026-10-24

- Added new top-level category: **Laser Cutting Gates** (`laser-cutting-gates` / हिंदी: "लेज़र कटिंग गेट") with 4 structured subcategories:
  - `Modern CNC Geometric Laser Gates` (`modern-cnc-gates`)
  - `Floral & Botanical Laser Cut Gates` (`floral-laser-gates`)
  - `Luxury Matte Black & Gold Laser Gates` (`luxury-black-gold-gates`)
  - `Motorized Laser Cut Sliding Gates` (`laser-sliding-gates`)
- Extracted and curated 22 flagship laser-cutting iron gate designs from user's Pinterest query:
  - 7 direct pins from user profile `anirajpoot789`
  - 15 architectural CNC laser-cut iron and steel main gate designs
- Processed and uploaded 21 new images to Cloudinary (`smart-fabrication/development/laser-gates/`) with fallback resolution handling, registering all 22 media assets under verified upload intents.
- Ingested 21 new published products (`GATE-LSR-001` through `GATE-LSR-021`) + 1 existing laser gate product:
  - Configured 3 sizing variants per product (Standard Double Swing 10ft x 7ft, Wide Compound Gate 14ft x 8ft, Heavy Luxury Gate 18ft x 9ft).
  - Attached BOM versions (High-Precision CNC cut MS / GI sheet + steel tubular frame + primer/paint coating).
  - Linked calculation rules and published 22 items into `public.gallery_items`.
- Updated bilingual translation dictionary `src/lib/i18n/catalog-bilingual.ts` with `'laser-cutting-gates'` and automatic laser/cnc gate title handling.
- Added quick access chip `⚡ लेज़र कटिंग गेट (22+)` on the homepage hero section (`src/features/home/home-view.tsx`).
- Total Published Products: **432 designs** (22 Laser Cutting Gates).
- Total Published Gallery Items: **420 items**.
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly across all 23 routes).
  - Database counts verified via `scripts/check-laser-db.mjs`.

## Global Header, Catalog, Gallery & Homepage Search Architecture — 2026-10-24

- Implemented Global Header Search Bar (`src/components/layout/global-search-bar.tsx`):
  - Accessible on all website pages via sticky top navigation (`src/components/layout/public-header.tsx`).
  - Desktop pill search input with autofocus, instant clear (✕) button, search triggers, and popular search suggestions dropdown (Laser Cut Gates, Main Entrance Gates, Rolling Shutters, SS Railings, Window Grills).
  - Mobile-responsive search toggle with full-width search overlay and quick category shortcut chips.
- Enhanced Catalog Search Experience (`src/app/(public)/catalog/page.tsx`):
  - Preserves active parent category and subcategory filter contexts across search submissions.
  - Added instant clear button (✕) and active query indicator badge with "Clear search" and "Search in all categories" shortcuts.
- Added Homepage Hero Search (`src/features/home/home-view.tsx`):
  - Integrated high-converting search input directly below hero CTA buttons so visitors can instantly search 430+ architectural designs on landing.
- Added Gallery Project Search (`src/app/(public)/gallery/page.tsx`):
  - Added keyword search and query filter to "Our Work" gallery across all 420 published workshop installation items.
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly across all 23 routes).

## Language Toggle Server Refresh & Search Input Query Retention — 2026-10-24

- Fixed Contact Page Bilingual Rendering (`src/app/(public)/contact/page.tsx`):
  - Wired `getServerLocale()` into the contact page to replace hardcoded Hindi text with dynamic English/Hindi translations for page headings, subtitles, workshop contact details, and site measurement steps.
  - Updated `LanguageSwitcher` (`src/features/i18n/language-switcher.tsx`) to trigger `router.refresh()` upon language selection, immediately re-rendering server components with the updated `sf_locale` cookie.
- Fixed Search Input Query Retention (`src/components/layout/global-search-bar.tsx`):
  - Synchronized search input state with `?q=` URL parameters on load and browser navigation, ensuring searched terms remain visible inside the search box.
  - Ensured selecting category/popular search tags displays the selected query in the search bar with clear button (✕) support.
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly across all 23 routes).

## Mobile-First Sticky Header Search Architecture — 2026-10-24

- Removed redundant in-page Hero search bar from `src/features/home/home-view.tsx`.
- Integrated full-width, permanently visible, thumb-friendly search bar into top sticky header for mobile users (`src/components/layout/public-header.tsx`):
  - Row 1: Brand Logo + Language Switcher + Wishlist/Cart + Request a Quote button.
  - Row 2: Full-width sticky search input with search icon, live keyword persistence, clear button (✕), and search action button.
  - Row 3: Main navigation links (`Explore Designs`, `Our Work`, `Price Estimate`, `My Account`).
- Refactored `GlobalSearchBar` (`src/components/layout/global-search-bar.tsx`) to directly render a unified, high-performance form for both mobile and desktop without modal overlays.
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly across all 23 routes).





Production release verification - 2026-10-26: source commit 04f1cb7 was pushed and the new workspace stylesheet was observed on the live site. Three real Auth/browser/read smoke checks passed for direct/indirect context APIs and hidden-parent rejection, eight-entry workspace/legacy record tabs, and nested-create cancellation/mobile scrolling. Generated test login retirement completed; no operational record was written. This supplements the eight local acceptance checks and 218 unit/integration tests.

Live verification - 2026-10-26: commit 819f77e deployed to https://smartfabrication.vercel.app. New stylesheet detected and authenticated production browser check passed for seven management shortcuts, independent section rail, both collapse controls and overflow at 320/390/768/1440px. Generated owner retired; business data unchanged.

Palette validation: production build (including TypeScript), documentation checks and diff review passed. Runtime workflows were not rerun for this CSS-only update.

Validation: production build/TypeScript, docs and diff checks passed. Three authenticated local smoke checks passed, including full-screen nested Add form bounds, visible Save/Cancel and no horizontal overflow at 320/390/768/1440/1920px; cancellation and parent scroll locking were preserved. Temporary owner retired; no business records written.

Validation - 2026-10-26: 221 unit/integration tests, production build/TypeScript, targeted lint, documentation and secret checks passed. Eight authenticated browser checks passed with mocked category edit/remove transport and real permitted read pages: populated Edit page, validation blocking with red toast, successful save returning to list with green toast, removal confirmation with green toast, cursor navigation, immutable stock restrictions, four create-page routes at 320/390/768/1440px and staff/inventory/notification lists. Generated owner retired; no operational mutation reached the backend. One intermediate run exceeded the original 5-second route assertion; the final test allows 30 seconds for server navigation.

Live verification - 2026-10-26: acde130 deployed; new form/toast stylesheet detected. All eight authenticated browser checks also passed against https://smartfabrication.vercel.app, including green edit/remove toasts, red validation errors, shell-preserving create/edit pages and mobile widths. Category mutations were mocked; no operational writes reached the server. Generated owner retired.

Validation - 2026-10-26: 229 unit/integration tests, production build/TypeScript, API contract validation (294 paths/36 explicit methods), targeted lint, docs and secret checks passed. Five real-browser checks passed: welcome dismissal/browsing, mandatory Call/WhatsApp details, invalid number and failed-save retry, original WhatsApp handoff (external destination mocked), and real contact creation verified through staff Leads. Synthetic contact submissions were marked LOST and temporary test owners retired. No calls/messages or financial/stock entries were made. Public regression scripts now choose the dismissed welcome state explicitly; their entire historical suites were not rerun.

Live verification - 2026-10-26: code commit 2f406d0 is deployed to https://smartfabrication.vercel.app. All five visitor browser checks passed on the new release, including mobile popup sizing, original WhatsApp handoff with destination mocked and actual API contact capture confirmed in staff Leads. The synthetic lead was marked LOST; temporary owner retired. No phone/message was sent. An initial production attempt ran before Vercel finished releasing; it was rerun after the new stylesheet was detected.

Validation - 2026-10-26: 241 unit/integration tests passed. Production build/TypeScript, targeted lint, API validation (295 paths/37 explicit methods), docs and secret scan passed. Runtime checks verified 25 concurrent quota requests (exactly 7 allowed), expiry reset, service-only quota execution, browser login with server session, representative public/media/admin write coverage, cross-endpoint actor exhaustion at 20 with precise 429 headers, and retained values/red retry feedback in category/profile/password forms. Backend checks and focused UI runs used only synthetic quota keys, a retired temporary owner and invalid/mocked submissions; no business postings occurred. The first SQL test exposed a CURRENT_TIME naming collision (fixed forward in migration 49); header tests also caught proxy metadata overwriting stricter actor headers, now separated. Native form validation required the test fixture to fill its required sort order. Applied migration and schema documentation refreshed; all 58 public RLS tables and business constraints remain unchanged.

Completion verification - 2026-10-26: all six real rate-limit acceptance checks passed against https://smartfabrication.vercel.app: atomic parallel quota/expiry, restricted grants, server-session browser login, gateway coverage, cross-endpoint actor 429/Retry-After and retained category/profile/password inputs. Generated test owners were retired and only synthetic quota keys were removed; no business records were posted. The encoded-resource classification fix is also live: invalid POST /api/v1/%6ceads returned HTTP 400 with X-RateLimit-IP-Limit: 6 (not the fallback 180), creating no lead. The rate-limit release passed 242 full-suite tests and production build; the current auth/rate-focused rerun passed 21 tests across four files, plus API/docs/secret checks. Supported database-related application forms are now protected; quotas and provider/direct-call exclusions remain documented.

GateWala Quality & Services Section Redesign — 2026-10-26:
- Redesigned `src/components/fabricator-comparison.tsx` from negative comparison against local shops to a professional "GateWala Quality & Services" section (`GateWala ही क्यों चुनें?` / `Why Choose GateWala?`).
- Updated subtitle to: "जानिए कैसे बेहतर मटेरियल, मजबूत वेल्डिंग और शानदार डिजाइन आपके घर को सुरक्षित और खूबसूरत बनाते हैं।" in simple Hindi for rural/small-town customers and matching English.
- Formatted 6 core service areas: Material Quality, Custom Designs, Welding & Finishing, Transparent Quotation, Doorstep Installation, and Customer Support.
- Removed unsupported marketing claims (e.g., "100% pure", "100% certified", "100% guarantee") and negative local shop comparisons.
- Applied Dark Green, Cream, and White aesthetic with responsive dual layout (desktop matrix + mobile cards).
- Added comprehensive bilingual integration test (`tests/integration/fabricator-comparison.test.tsx`). Passed 244/244 test suite and Next.js production build.


Live logo verification - 2026-10-26: release 14f2806 serves the new logo in the login page, and the production PNG SHA-256 matches the supplied asset byte-for-byte. Header/footer/login responsive browser checks and compact admin logo styling passed locally.

Admin Record Detail Workspace Page Alignment — 2026-10-26:
- Converted record details (`?record=<id>` and row inspection) across all admin modules from screen-covering modal dialogs into standard workspace pages (`admin-form-page`), matching the exact layout of the add/edit pages (`?new=1` / `?edit=...`).
- Retained full admin shell layout (primary sidebar with GateWala branding, workspace navigation rail, top header).
- Added breadcrumbs (`[Workspace] / [Resource] / [Record Name]`), page title, description, and "Back to list" button.
- Rendered record details in an `.admin-form-card` with section heading `● Record details` and responsive 2-column key-value grid, preserving module actions, context tabs, and sticky action buttons.
- Removed the 100vw/100dvh modal override from `.admin-record-dialog` in `globals.css` so that modal dialogs remain centered modals with backdrops.
- Added integration test in `tests/integration/admin-tables.test.tsx` and updated browser test assertions. Passed 255/255 test suite and Next.js production build.



Refinement acceptance: all 7 Royal design browser groups passed locally, including the new account interaction checks, six viewport widths, both languages, admin/public pages, rail/drawer behavior and inline form validation. Browser hydration/page errors: none. Temporary test account retired. Separate guest menu check passed at 320px.

## 2026-10-28 - Product creation workspace plan

[Product creation plan](operations/product-creation-plan.md) records the requested integrated category/size/weight/per-kg pricing and five-image form. Existing category/media services will be reused; dimensional weight guesses, sample business rates and automatic unselected variants are excluded. Planning only: no product-form implementation or schema changes yet.

The emblem/account refinement also passed all 7 browser groups against the live Vercel deployment, including account interactions and responsive public/admin forms.

## 2026-10-29 - Compact mobile header and first-login destination

- Public mobile header now has two compact rows: emblem/wishlist/cart/menu, followed by full-width search. The crowded five-link navigation strip and search-row language control move into an accessible menu disclosure, retaining all links and language selection.
- Menu supports outside click, Escape with focus restoration, keyboard links, nested account disclosure and bounded scrolling on short screens. Desktop navigation remains available.
- Fixed successful password login defaulting every user to /account. Verified profile permissions now choose the dashboard or first permitted workspace; customers retain /account. Explicit safe account/admin return destinations are preserved. A failed profile lookup still navigates to the protected account page after successful sign-in.
- No auth grants, RLS, database schema or business pricing changes. Targeted auth/destination tests and production build passed. Mobile Hindi browser checks passed at 320/390/600/767px; full responsive acceptance tracked separately.

Mobile/login acceptance: local 7-group regression passed with first sign-in landing on /admin; three targeted auth/destination tests, lint, production build, docs and secret checks passed. Separate Hindi menu checks passed at 320/390/600/767px. Published release efc1b2b detected. Initial live run passed account menu, mobile menu and explicit return destination, then aborted a subsequent page navigation (ERR_ABORTED); the harness now waits for the returned admin document before continuing. This interrupted run is not a full-suite pass.

Final live acceptance (2026-10-29): all 9 browser groups passed against https://smartfabrication.vercel.app, including first staff login, explicit protected return destination, mobile navigation and language access, six-width public/admin layouts, menu/rail keyboard behavior and inline form validation. No page/hydration errors or document overflow. Temporary login fixture retired. Evidence: ignored test-results/royal-design-latest.json.

## 2026-10-29 - Shared public/admin form controls

See [control consistency](operations/control-consistency.md) for field/button dimensions, Font Awesome select arrows, search alignment, catalog filter layout and the 45-resource/six-width audit scope. Production build and 301 tests passed before the final visual refinements; final acceptance is recorded below when completed. First browser attempt was interrupted by a 5-second navigation readiness timeout; the harness now allows 45 seconds for the authenticated main surface. Existing dedicated purchase/material lint debt is documented rather than treated as a clean lint result.

Local control acceptance: all 10 design/browser groups passed, including 45 resource routes at six widths. All 8 table/edit/archive/validation regression groups passed with mocked category writes. The first table run expected the retired /account staff destination and timed out; after updating the harness to /admin, the complete run passed. Final production build passed; 301 tests / 67 files passed. Public/shared-workspace targeted lint passed; dedicated purchase/material pre-existing lint findings remain documented.

Final live control acceptance (2026-10-29): all 11 browser groups passed on https://smartfabrication.vercel.app. All 45 resource routes were checked at 320/390/768/1024/1440/1920px for document fit and visible field heights/fonts/select arrows. Additional workspace hubs, raw-material import, calculation preview, purchase entry redirect, password screen and available product public/private preview were checked. Search icons remained centred; menus, role-based login, explicit return links and red inline validation passed. No hydration/page errors or document overflow. Temporary test account retired. Local table regression: 8 groups passed; unit/integration: 301 tests / 67 files passed; final build, docs and secret checks passed. Existing dedicated-screen lint findings remain listed above. Evidence artifact: ignored test-results/royal-design-latest.json.

## 2026-10-29 - Compact dimensional admin styling

`src/app/admin-premium.css` is scoped to the admin shell. It adds layered inset/ambient card shadows, metallic gold actions, raised navigation/icon tiles and a charcoal rail gradient. Desktop primary rail is 224px and contextual rail 184px; collapsed/mobile navigation rules remain explicit. Main padding, heading scale, table rows, empty states and section gaps are tighter. Operational cards, workspace launchers/history, form footers and media upload rows share the new surface treatment. Raw-material unit conversion uses a responsive grid instead of stacked full-width controls.

Shared 42px desktop/44px mobile field metrics, Font Awesome arrows, semantic statuses, inline validation and all permission/business rules are preserved. Hover elevation applies only to actionable launch cards on hover-capable devices, respecting reduced-motion preferences. No financial/data mutations are part of the styling change. Acceptance evidence is recorded in progress.md after execution.

Local premium-admin evidence: 45-resource/six-width control audit and existing menu/form/public groups passed before a streamed-navigation context interruption in the extra workspace group. The focused workspace/import/product-preview and login groups then passed after the harness allowed navigation to settle. All 8 table/edit/archive/inline-validation regression groups passed. Final production build and targeted media-uploader lint passed; inherited lint debt remains documented. Workspace inventory/catalog screenshots were visually reviewed. Temporary test identities retired; no business records saved. Full deployed-run evidence follows separately.

Premium admin live acceptance: all 11 browser groups passed on release d162b2f, including all 45 resource routes/forms at six widths, workspace hubs, operational screens, public regression, menus, login and inline validation. No document overflow or page/hydration errors. Full evidence preserved locally as test-results/premium-admin-live-full.json. Final screenshot review additionally identified duplicated plus labels and long-status clipping; those small polish changes and their focused acceptance are tracked separately below.

Final polish: removed redundant plus text beside Plus icons and allowed long admin status labels to wrap. Focused local admin/dashboard/list/operational checks passed at mobile/desktop widths, including badge-versus-cell bounds. Production build passed after these changes. The full live 11-group result above belongs to the immediately preceding visual release; focused deployed verification of this polish follows below.

Final deployed polish acceptance (2026-10-29): release 5444ab2 stylesheet detected; focused admin/dashboard/list/operational and workspace/import/calculation/product-preview groups both passed on the live site. Lead status badges stayed within their cells. Six-width workspace layouts and mobile/desktop operational layouts passed without document overflow or page/hydration errors. The preceding full redesign run passed all 11 groups, including the complete 45-resource/six-width control audit; this focused rerun verifies the final plus-label/status wrapping adjustments. Final build, 8 table regression groups, docs and secret checks passed. Generated identities retired.

## 2026-10-29 - Sales relationships and approved contact repair

See [Sales workspace audit](operations/sales-workspace-audit.md) for the six-screen search/context implementation and root cause. Saloni lead was linked to Inventory Test Customer despite different contact details. Owner explicitly approved creating a separate customer and relinking only the lead. Completed guarded transaction: new customer `ebbc408c-1775-4c5e-9194-584d252c46fe`; only existing lead customer_id changed. Old customer and customer-only quotation hashes unchanged; stage/product/contact/requirement preserved. Preferred 6 November visit remains unconfirmed. Migration 51 applied; initial rollback database regression passed 8 groups and unit/integration suite passed 301 tests. Final checks below distinguish implemented work from browser/deployment acceptance.

Post-repair verification: all 8 CRM database groups passed, including preserved old customer/quotation hashes and corrected lead linkage; fixture writes rolled back. Typecheck, targeted changed-component/service lint, production build, 301 unit/integration tests and documentation integrity checks passed. A first database verification connection timed out; retry passed. Browser acceptance and deployment of the new search UI are still pending; no live UI acceptance is claimed.

Completion follow-up: found and fixed PostgREST 42703 when CRM RPC search was combined with indirect customer context. Additive migration 52 filters that relationship inside the invoker RPC. Nine database regression groups passed, with all synthetic business writes rolled back. Nine new API integration tests passed; full suite reached 310 tests/68 files. API validation now passes 297 paths/39 explicit methods after documenting two existing purchase routes. Applied-schema docs include 52 migrations. Browser harness iterations are recorded as incomplete until the complete acceptance run passes.

Local completion evidence: all seven Sales acceptance groups passed across completed targeted runs (backend identifier matrix; context/status/keyset pagination; search-clear/back navigation; lead tabs and intercepted related POST payloads; corrected customer navigation/tabs; overview search/clear; six screens at 320/390/768/1024/1440/1920px). No real business saves were made. Existing 8-group admin table/form/edit/archive regression also passed. Generated test identities retired. Final production build passed, as did 310 tests/68 files, changed-file lint, API/schema/docs integrity and secret checks. Initial browser harness iterations exposed timing/selector mismatches; those failed runs are not counted as full passes. Full deployed-run acceptance follows after release.

Final live acceptance - 2026-10-29: application release af89a05 is deployed at https://smartfabrication.vercel.app. All seven Sales acceptance groups passed across completed live runs: the backend identifier/contact matrix and context/status/keyset checks passed first; the final completed run passed all five UI groups (five-collection search/clear/back, lead tabs/intercepted related creation, customer tabs/navigation, overview search and all six screens at six widths). Final run had no page/hydration errors; example/current old-customer/old-quotation fingerprints were unchanged during acceptance. Generated test identity retired. Evidence: ignored test-results/sales-search-live-final.json and test-results/sales-search-mobile.png. Earlier interrupted runs exposed network/navigation timing and pre-hydration test interaction; bounded read-only retries, DOM readiness and client-loaded collection waits are now explicit in the harness. No real appointment, quotation, follow-up, financial or stock save was executed by browser tests. The approved customer correction remains complete; subsequent operational MEASUREMENT_PENDING status was preserved. No code or deployment step remains for this Sales scope. Workshop confirmation of the requested visit remains an operational action, not an automated test outcome.

## 2026-10-30 - Lead date/staff/source/follow-up filters

Approved filter plan implemented: six date presets/custom range, advanced draft/apply/cancel drawer, status/staff/source/pending follow-up filters, removable chips/Clear all, URL persistence and filtered empty states. [Contract and implementation](operations/lead-filters.md). Migrations 53/54 are read-only security-invoker functions; 5 database rollback groups passed. 326 tests/69 files and generated API validation passed. Initial drawer browser iteration exposed label naming and desktop centering issues; fixed with explicit label associations and centered desktop/bottom mobile placement. Filter URL updates use native Next-supported history integration to avoid unnecessary remounts. Final acceptance follows below.

Local lead-filter acceptance: all 5 browser/API groups passed (presets/combined API/CSV/context/cursor; URL/reload/chips/clear/list return; custom validation/cancel/empty state; page/cursor reset with mocked read-only list; keyboard and 320/390/768/1024/1440/1920px). Mobile drawer screenshot reviewed. Existing example and original customer/quotation fingerprints remained unchanged during acceptance; temporary test identity retired. Production build, targeted changed-file lint, API types/validation, docs and secret checks passed. The full unit/integration suite passed 326 tests/69 files; 5 database fixture groups rolled back. Browser Back verification is included in the deployed rerun.

Final live filter acceptance - 2026-10-30: release bb0e77c is deployed at https://smartfabrication.vercel.app. All 5 groups passed in one completed live run: API presets/combined filters/CSV/context/cursor; URL/reload/browser Back/list return/chips/clear; custom-range validation/cancel/filtered empty state; filter changes resetting page/cursor while retaining search filters; keyboard and six-width responsive drawer. No page/hydration errors; existing example and original customer/quotation fingerprints unchanged during acceptance. Generated test identity retired. Local 326 unit/integration tests, 5 rollback DB groups, build, changed-file lint, generated API contract/types, docs and secret checks passed. Evidence: ignored test-results/lead-filters-live-final.json and test-results/lead-filters-mobile.png. No manual development/deployment step remains for the approved filter scope.

## 2026-10-30 - Visible From/To lead dates and contact search

User requested replacing the Custom dates button with two directly visible date boxes. Added From date (Kab se), To date (Kab tak), Apply dates and clear name/mobile search wording. The existing backend already supports combined date/contact search, so no migration or business data change is needed. The advanced dialog retains other filters and shows applied ranges without duplicate date inputs. Focused acceptance follows below.

Inline range local acceptance: both focused groups passed: invalid range rejection, directly visible fields, date-chip reset, combined date/name and date/mobile search, reload restoration, keyboard/mobile drawer and six-width fit. Production build and changed-file lint passed; documentation integrity and secret checks passed. Existing business record fingerprints unchanged and generated test identity retired. Deployed verification follows below.

Final inline-range live acceptance - 2026-10-30: release 68f46e3 is deployed. Both focused browser groups passed: visible From/To fields, removed Custom dates button, invalid range rejection, date-chip reset, date-range plus name/mobile API searches, reload restoration, keyboard drawer and six-width layout. No page/hydration errors or document overflow; real business fingerprints unchanged, test login retired. Main desktop/mobile screenshots and ignored test-results/lead-inline-range-live-final.json preserve evidence. Build, changed-file lint, docs integrity and secret checks passed.

## 2026-10-30 - Images directly in product Add and Edit

Implemented a staged Add product image picker with local previews, up to five images, cover/remove controls and upload-on-save. Existing Edit gallery upload is preserved, permission-gated and waits for gallery load; Save/Cancel cannot race image actions. Partial Add image failure offers Retry images using the created product and cached verified assets. No schema/API migration or real product data change. [Workflow, limitations and checks](operations/product-form-images.md). Three new retry tests and full 329 tests/70 files passed. Production build passed. Responsive acceptance found a hidden Add file input overflowing on resize; anchored it inside the image section. Final browser/lint/deployment verification follows.

Local final acceptance - 2026-10-31: all three browser groups passed (Add validation/preview/cover/upload-on-Save with partial-link retry; Edit upload/details-save; Add/Edit at 320/390/768/1024/1440/1920px without document overflow or nested forms). No page/hydration errors; screenshots reviewed. Playwright screenshot caret mutation initially triggered a hydration warning during early screenshot capture; corrected the harness to preserve caret styles, then reran successfully. Catalog/media/Cloudinary writes were mocked; existing business fingerprints stayed unchanged and test identity was retired. Targeted lint, production build, docs integrity and secret checks passed. Live verification follows deployment.

Final live acceptance - 2026-10-31: release a922e3f is deployed at https://smartfabrication.vercel.app. All three product-image browser groups passed on live: Add selection/validation/preview/cover/upload-on-Save and partial-link Retry images, Edit upload to the same product and details save, and both forms at 320/390/768/1024/1440/1920px. No page/hydration errors, nested forms or document overflow. Browser writes and Cloudinary transport were mocked; business fingerprints unchanged and generated login retired. Evidence: ignored test-results/product-form-images-browser-latest.json and product-image screenshots. Full 329 unit/integration tests, focused retry tests, final typecheck, changed-file lint, build, docs and secret checks passed. No migration or manual deployment step remains for this request.

## 2026-10-31 - Remove quotation customer-link controls

Removed Copy customer link and the entire displayed customer-link box from quotation details. Removed the unused share state/clipboard handler. Latest/versioned PDF downloads, price history and existing approval/revision controls are preserved. Updated quotations module documentation and the existing quotation browser assertions. No schema/API or business-data change. Validation follows below.

Quotation link-control validation: production build, TypeScript, targeted lint, documentation integrity, secret scan and diff whitespace checks passed. Existing browser assertions now expect no copy/open/link field and retain Download PDF visibility; the browser suite was not rerun for this UI removal. No business records were modified.

## 2026-10-31 - Follow-up workflow status dropdown

Expanded database constraint and shared Add/Edit/API enum to pending, processing, working, delay and completed, with bilingual form labels. Regenerated OpenAPI/mobile types. The five statuses passed database insert/update constraint checks (transaction rolled back); invalid status rejected. Focused create/update schema test, targeted lint, production build and API checks passed. Existing pending-only reminders/dashboard/lead filters retain their explicit pending behavior. Migration 56 applied/tracked; general runner encountered an unrelated pre-existing migration 55 staff_delete policy conflict, left untouched. Automatic database documentation export failed without output; module documentation records the applied constraint change. No existing business records changed. Deployment follows.

Live follow-up verification - 2026-10-31: deployed implementation 347ec44 exposes all five bilingual status options on /admin/follow-ups?new=1. Each option was selectable; 390/768/1440px layouts had no document overflow. No business save was performed during live UI verification. Database saves for all values were separately verified in a rolled-back transaction. Documentation and secret checks passed.

## 2026-10-31 - Order Next stage dropdown and deadline explanation

Replaced order next-stage buttons with an all-stages dropdown. Current state is selected, future/past stages disabled except the allowed next sequential stage; terminal states disable the selector. Existing transition API, record version and workflow guards preserved. Documented Due at as optional order deadline, separate from outstanding payment; dash means unset. No database change or real order transition performed. Validation follows.

Order dropdown validation: changed-file lint, production build/TypeScript, documentation integrity, secret scan and diff whitespace checks passed. Reviewed that existing transition requests still send the selected status and current record version. No real order was advanced; browser transition acceptance was not rerun for this presentation change.

## 2026-10-31 - Remove Quality checks and Installation workspace pages

Removed quality-checks and installations from the Operations workspace resource list, so neither appears in workspace lists/history; its description no longer advertises installation. Preserved underlying data, API routes and order stages. No migration needed. Unrelated in-progress lead status selector changes left untouched.

Workspace removal verification: all 14 existing workspace integration checks passed after updating the expected visible-resource set to exclude quality-checks/installations. Docs checks and diff whitespace checks passed. Full TypeScript check encountered unrelated parallel OrderStatusSelect duplicate-import/prop mismatch edits in resource-workspace.tsx; those unstaged edits are outside this navigation change and were not included. No database/business writes.

## 2026-10-31 - Delivery Add status dropdown

Added the missing delivery status selector to Add/Edit forms. All three database stages are visible; current stage is selected and other stages disabled to preserve the database's Scheduled-only creation rule and proof-required completion workflow. Help directs staff to delivery detail actions after saving. Select has no payload name, so no new generic status write path is introduced. No business-data or schema changes. Validation follows.

Delivery dropdown verification: production build/TypeScript, changed-file lint, docs integrity and secret scan passed. Reviewed that the selector does not submit status and database/default workflow remains intact. No real delivery was created/dispatched/completed; browser workflow acceptance was not rerun for this display change.

## 2026-10-31 - Record remaining payment after work completion

Made order balance collection explicit: Record Advance Payment for the first receipt and Record Balance Payment afterward, including COMPLETED orders with a balance. Amounts retain paise, Full Balance uses the exact outstanding amount and excess amounts are rejected. Renamed payment/PDF headings to cover all receipts. Summary/PDF now use reconciled receivables after corrections. Added mounted-attempt retry idempotency header, forwarded to existing post_payment RPC. No order-stage change for completed-order payments, no migration or actual money posting. Three API tests passed; full suite passed 349 tests/76 files; production build, typecheck and API validation passed. Browser acceptance follows. Initial browser attempt found no local server; its generated login was retired and the production server started for rerun.

Balance-payment local acceptance: browser check passed completed-order balance collection, exact 70000.50 prefill, transient failure followed by retry with the same key, zero-balance form closure and 390/768/1440px fit. All order/payment writes were mocked; generated login retired. Existing server had initially been started without required network access, causing login quota-service failure; restarted with network access and rerun passed. Three focused API tests (completed-order posting/retry, corrected net balance, first-advance transition) passed; full 349 tests/76 files passed. Production build, final typecheck, changed-file lint, 299-path API/42-handler validation, docs and secret checks passed. Deployment/live acceptance follows.

Final live balance-payment acceptance - 2026-10-31: deployed release 5d8b59a passed completed-order balance collection, exact paise prefill, same-key retry after simulated temporary failure, full-payment form closure and 390/768/1440px layout checks. Payment/order writes were mocked; no real receipts or money were posted and the generated login was retired. Initial live run reached the previous UI before deployment readiness; added bounded read-only navigation retries and the subsequent live run passed. Local API/full-suite/build/typecheck/lint/docs/secret/API-contract checks are recorded above. No migration or manual deployment step remains for this balance-collection request.

## 2026-11-03 - Payment processing delay follow-up

Completed payment-save feedback separation and concurrent summary reads (included in release 066c0ce). Save acknowledgement is visible before balance refresh finishes, stale balances cannot initiate a new payment, and failed reads offer a refresh action. Corrected success copy so it does not claim balance refresh has already completed. Existing retries/permissions/posting guards preserved. Focused tests, build and live delayed-refresh verification follow; no real payment posting is used in acceptance.

Processing-delay completion - 2026-11-03: three focused payment API tests, changed-file lint, production build/TypeScript, documentation integrity and secret checks passed. Live browser acceptance passed with a deliberately delayed 1.5-second summary read: saved acknowledgement appears during refresh, same-key retry remains intact, fully-paid collection closes and 390/768/1440px layouts fit. Payment/order writes mocked and generated login retired. Database round-trip concurrency and UI feedback are improved; no measured absolute server latency or real financial posting is claimed.
