> Version: 0.2 | Owner: project team | Updated: 2026-10-17 | Status: verified (local); workshop content pending

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
