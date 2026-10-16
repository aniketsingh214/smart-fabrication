> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: planning draft; not implemented

# Owner decisions and missing inputs

## 17. Risks, decisions and open questions

### Locked decisions
- One Next.js TypeScript codebase; Vercel; Supabase PostgreSQL/Auth; Cloudinary.
- REST `/api/v1` is the mobile-ready integration boundary.
- All source docs are version-controlled and updated with every feature.
- Customer estimates are approximate; final measurement/price requires approval.
- Owner withdrawals are separate from business expenses.

### Risks and mitigations
- **Overlarge scope:** incremental releases and acceptance gates.
- **Serverless execution limits:** no long jobs in request path; plan scheduled/async mechanisms when needed.
- **Financial accuracy:** define accounting policy and get accountant validation.
- **RLS misconfiguration:** automated per-role access tests and no service-role use in browser.
- **Media abuse/cost:** signed restricted uploads, quotas, cleanup and monitoring.
- **Calculation inaccuracies:** explicit units, rule versioning, manual approval and field measurements.
- **Mobile breaking changes:** OpenAPI governance, contract tests, `/api/v1` compatibility.
- **Cost:** verify current Vercel commercial use, Supabase quotas, Cloudinary transformations/bandwidth, domain and notification costs before launch.
- **Sensitive workshop data:** backup/restore, privacy retention, audit and least privilege.

### Owner decisions needed before relevant phase
1. Workshop brand/name, logo, phone, service cities, languages (Hindi/English), currency INR.
2. Are ready-made products purchased online now, or quotation-only until later? **Default: quotation-first**.
3. Is public customer login required in MVP? **Default: optional; guest lead allowed**.
4. Material unit standards and fabrication calculation formulas; wastage, labour, margin and tax policies.
5. Who can approve quotes, stock adjustments, purchases and finance corrections?
6. GST applicability and accounting method; accountant review.
7. Delivery/installation service boundaries, deposit/refund policy.
8. Media retention and permissions for customer house/design photos.
9. Staff notification channels and reminder timing.
10. Domain, budget and production hosting plan.

No unanswered question should silently turn into a hard-coded business assumption; record decisions in ADRs.



## Project-specific pending inputs

- Original 34-section requirements file for independent verification.
- GitHub repository/organization and remote access (local Git may be initialized independently).
- Vercel project/team access and Supabase isolated development project.
- Cloudinary access for Phase 05; this provider is also mandatory in the plan.
- Phase 01 scope review, then Phase 02 design review.

Provisional defaults from the plan: quotation-first, optional customer login with guest enquiry, INR. These are proposed defaults, not approved business decisions. No account secrets should be sent in chat or stored in tracked files.
