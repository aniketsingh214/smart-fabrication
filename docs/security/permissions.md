> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: enforced baseline; full role acceptance pending

# Permission matrix and current enforcement

The role descriptions below preserve intended scope. Actual permission names and grants are defined by applied migrations and exposed to authorized owners through `/admin/users` and `/api/v1/admin/permissions`. Server request authorization and RLS both enforce access. The live schema has 134 policies across 58 RLS-enabled tables; see [schema dictionary](../database/schema-dictionary.md). Selected sales/customer/production denials passed real database checks. Real owner/customer desktop/mobile-browser login and permission checks also passed with temporary fixtures; complete all-role acceptance remains pending. Future partner access is not implemented.

## 3. Users, roles, permissions and security

| Role | Intended access |
|---|---|
| Anonymous visitor | public products, gallery, approved reviews, estimate, enquiry |
| Customer | own profile, enquiries, quotes, orders, attachments and tracking |
| Super Admin / Owner | full configuration, permissions, audit, finance |
| Sales Staff | leads, customers, follow-ups, quotations, limited order details |
| Production Staff | work orders, production status, allocated materials, installation tasks |
| Accounts Staff | suppliers, purchases, labour payments, expenses, receivables, payables, reports |
| Content Staff | products, categories, gallery, website sections, review moderation |
| Future Partner | explicitly assigned leads/jobs only; no cross-partner visibility |

**RBAC:** permission strings e.g. `products.read`, `products.write`, `quotations.approve`, `inventory.adjust`, `finance.read`, `finance.withdrawal.create`, `users.manage`. Define role-permission matrix in `docs/security/permissions.md`, enforce at each endpoint AND relevant database policies. Use least privilege, deny by default, audit sensitive actions, guard role escalation. A user may hold multiple roles.

**Auth:** Supabase Auth with email/password initially; phone OTP only after cost/abuse review. Web SSR cookie session; mobile bearer token. Validate JWT on server via trusted Supabase mechanisms, handle refresh/expiry, password reset, account disabling, sign-out and session revocation. Avoid requiring CSRF-unsafe cookie-only mutation endpoints; explicitly protect cookie-authenticated state-changing requests using origin/CSRF strategy, and do not rely solely on CORS.

**Data protection:** protect phone, address, uploaded customer designs, invoices and worker pay; collect only required data; retention/deletion policy; role-filtered exports; mask PII in logs; private signed delivery for sensitive Cloudinary assets; rate-limit enquiry/login/upload endpoints; input/output escaping; SQL injection protection via parameterized access; secure headers, content security policy where practical; admin MFA as launch hardening item.



| Capability | Anonymous | Customer | Owner | Sales | Production | Accounts | Content |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Published catalog/content read | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Own profile/quotes/orders | No | Own only | Authorized | Assigned sales scope | Job scope | Finance scope | No |
| Catalog/content write | No | No | Yes | No | No | No | Yes |
| Leads/follow-ups/quotes | Create enquiry | Own only | Yes | Assigned | No | No | No |
| Inventory/work orders | No | No | Yes | No | Assigned | Procurement scope | No |
| Finance/withdrawals | No | No | Yes | No | No | Approved scope | No |
| Users/roles/audit | No | No | Yes | No | No | No | No |

Exact permission strings, multi-role resolution and quote/purchase/stock approval authority require owner review in Phase 02/04. Unlisted permissions denied; this table does not grant runtime access.

Finance corrections and period closure require finance.approve. Customer cancellation refunds additionally require orders.approve; active jobs, work history and reservations block cancellation. Definer balance/report functions enforce relevant domain-read grants. See ../operations/refunds-periods.md for the immutable correction and locking policy.


Scheduler execute is explicitly revoked from PUBLIC, anon and authenticated; new functions opt into API-role execution. Invoice attachments require purchases and finance permissions.


Write authorization now also applies verified-user form quotas after existing identity/permission checks. See [rate-limit policies](rate-limits.md). The service-only quota RPC grants no access to business records; existing business RLS remains unchanged.

### CRM relationship search - 2026-10-29

Migration 51 uses security-invoker functions with authenticated-only execute grants and explicit relevant domain read checks. Every source table remains subject to its existing RLS. Staff search does not grant public/customer access or expose inaccessible sibling leads. Context filtering additionally checks parent read permission and parent visibility. New/relinked quotations enforce visible lead/customer consistency; existing approval and stage rules remain in force. The approved one-lead identity correction is documented separately in [Sales audit](../operations/sales-workspace-audit.md).

## Lead date and workflow filters - 2026-10-30

See [lead filter contract and behavior](../operations/lead-filters.md). Creation dates use India calendar boundaries; pending follow-up today/overdue, source, status and staff filters intersect search/context before pagination. Security-invoker RPCs preserve RLS; no business data or appointment is modified. URL and CSV filtering use the same contract.
