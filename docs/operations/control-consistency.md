# Shared controls and responsive acceptance

Updated: 2026-10-29. Scope: public website and admin presentation; business rules and posting APIs unchanged.

## Control contract

`src/app/control-system.css` loads after the brand/layout stylesheet. Shared tokens define 42px desktop fields and actions, 44px mobile fields/actions, 9px corners, consistent borders, focus rings and label typography. Mobile field text is 16px to avoid iOS focus zoom. Textareas retain useful multiline height; checkbox/radio/range/colour/file widgets retain appropriate native interactions. Embedded search actions use a compact 32px button inside the standard field container. Icon-only and navigation controls remain separate from form submit actions.

Legacy important Tailwind font/padding utilities are reconciled in the base cascade layer so individual screens cannot silently change the field metrics. Red inline validation and disabled/read-only state semantics remain in place.

Native single-select controls retain keyboard, form and mobile picker behavior, but use `appearance:none` with the Font Awesome Free chevron-down SVG path in the control background. This removes the browser's duplicate arrow. Multi-select/listbox widgets are not converted to single-selects. Forced-colours mode restores the native arrow for accessibility. Font Awesome Free icon artwork is CC BY 4.0; the existing local Font Awesome package/license remains included.

## Search and layout corrections

- Header search: fixed icon cell, flexible input, separately sized clear/submit controls and icon-only mobile submit. Text no longer leaks out of the compact button.
- Admin header and table search: non-shrinking icons, bounded select widths and flexible text without competing input borders.
- Catalog/gallery/raw-material/purchase search: icons centred against the actual field height, with reserved text padding and vertically aligned clear actions.
- Catalog filters: full-width white bordered panel, aligned search action and responsive filter grid. Query/category preservation and filtering behavior remain unchanged.
- Primary buttons: restrained solid gold with consistent height/type/radius; neutral search actions and semantic destructive/error/success colours remain distinct.

## Verification and limits

The browser harness enumerates all 45 resource routes from the resource registry. It opens each create/list surface and checks six widths: 320, 390, 768, 1024, 1440 and 1920px. Read-only resources expose lists rather than editable forms. Visible form fields are checked for standard heights and custom select arrows; local horizontal table scrolling is permitted, document overflow is not. Public page/search checks verify centred leading icons. Existing checks cover inline validation, menus, role landing pages and independent rails.

These layout checks do not submit financial, inventory or customer business records. Unit/integration tests and the production build provide separate functional checks. Generated temporary browser identities are retired. Exact executed acceptance results are recorded in progress.md and ignored test-results artifacts; listing a check here is not a claim that an interrupted run passed.

Pre-existing lint debt in the dedicated raw-material and purchase-entry screens (explicit any, synchronous effect updates, unused imports, raw img and JSX quote rules) was identified while checking their one-class search alignment changes. It is not introduced by these visual changes. Targeted public/shared-workspace lint is checked separately. No lint rules have been disabled to hide those findings.

Final live control acceptance (2026-10-29): all 11 browser groups passed on https://smartfabrication.vercel.app. All 45 resource routes were checked at 320/390/768/1024/1440/1920px for document fit and visible field heights/fonts/select arrows. Additional workspace hubs, raw-material import, calculation preview, purchase entry redirect, password screen and available product public/private preview were checked. Search icons remained centred; menus, role-based login, explicit return links and red inline validation passed. No hydration/page errors or document overflow. Temporary test account retired. Local table regression: 8 groups passed; unit/integration: 301 tests / 67 files passed; final build, docs and secret checks passed. Existing dedicated-screen lint findings remain listed above. Evidence artifact: ignored test-results/royal-design-latest.json.

## 2026-10-29 - Compact dimensional admin styling

`src/app/admin-premium.css` is scoped to the admin shell. It adds layered inset/ambient card shadows, metallic gold actions, raised navigation/icon tiles and a charcoal rail gradient. Desktop primary rail is 224px and contextual rail 184px; collapsed/mobile navigation rules remain explicit. Main padding, heading scale, table rows, empty states and section gaps are tighter. Operational cards, workspace launchers/history, form footers and media upload rows share the new surface treatment. Raw-material unit conversion uses a responsive grid instead of stacked full-width controls.

Shared 42px desktop/44px mobile field metrics, Font Awesome arrows, semantic statuses, inline validation and all permission/business rules are preserved. Hover elevation applies only to actionable launch cards on hover-capable devices, respecting reduced-motion preferences. No financial/data mutations are part of the styling change. Acceptance evidence is recorded in progress.md after execution.
