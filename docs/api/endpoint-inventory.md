> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: target inventory with implemented contract reference

# Planned endpoint inventory

The table preserves the source plan's domain targets; it does not list exact runtime route names. For implemented methods and permission requirements use [OpenAPI](openapi.yaml). The local checker validates the generated resource registry and every explicit v1 handler method. Future payment-provider and partner APIs remain deferred.

## 8. API endpoint inventory (planned; implement per phase)

`P` = public, `C` = authenticated customer/owner, `S` = permitted staff, `A` = super admin. Exact request/response DTOs and scope in OpenAPI.

| Domain | Example routes | Access |
|---|---|---|
| Public catalog | `GET /categories`, `GET /products`, `GET /products/{id}`, `GET /gallery`, `GET /reviews` | P |
| Content | `GET /site`, `GET /site/sections`, `GET /service-areas` | P |
| Estimates | `POST /estimates` (server-authoritative) | P/rate-limited |
| Leads | `POST /leads`, `GET /leads`, `GET /leads/{id}`, `PATCH /leads/{id}`, `POST /leads/{id}/notes`, `POST /leads/{id}/assign` | P create / S rest |
| Follow-ups | `GET /follow-ups`, `POST /follow-ups`, `PATCH /follow-ups/{id}`, `POST /follow-ups/{id}/complete` | S |
| Customers | `GET /me`, `PATCH /me`, `GET /me/quotations`, `GET /me/orders`; staff `GET /customers` | C / S |
| Auth | Supabase Auth client SDK for sign-in/out/refresh; `GET /me` for profile | C |
| Admin catalog | `POST/PATCH /admin/products`, `POST /admin/products/{id}/publish`, `POST/PATCH /admin/categories` | S |
| Materials | `GET/POST /materials`, `PATCH /materials/{id}`, `GET/POST /materials/{id}/rates`, `GET/PUT /products/{id}/bom` | S |
| Quotations | `POST /quotations`, `GET /quotations/{id}`, `POST /quotations/{id}/versions`, `POST /quotations/{id}/approve`, `POST /quotations/{id}/accept`, `GET /quotations/{id}/pdf` | C/S by scope |
| Orders | `GET /orders`, `GET /orders/{id}`, `POST /orders/from-quotation`, `POST /orders/{id}/transitions`, `GET /orders/{id}/timeline` | C/S by scope |
| Suppliers | `GET/POST /suppliers`, `PATCH /suppliers/{id}`, `GET /suppliers/{id}/statement` | S |
| Procurement | `GET/POST /purchases`, `POST /purchases/{id}/receive`, `POST /purchases/{id}/payments`, `POST /purchases/{id}/returns` | S |
| Inventory | `GET /inventory/balances`, `GET /inventory/movements`, `POST /inventory/adjustments`, `POST /inventory/reservations` | S |
| Workers/labour | `GET/POST /workers`, `POST /work-entries`, `POST /labour-payments`, `GET /workers/{id}/statement` | S |
| Production | `GET/POST /work-orders`, `POST /work-orders/{id}/transitions`, `POST /work-orders/{id}/consumption`, `POST /work-orders/{id}/quality-checks` | S |
| Delivery | `GET/POST /deliveries`, `POST /deliveries/{id}/confirm`, `GET/POST /installations` | S/C limited |
| Finance | `GET/POST /expenses`, `GET/POST /owner-withdrawals`, `GET /receivables`, `GET /payables`, `GET /reports/profit-loss` | S restricted |
| Reporting | `GET /reports/leads`, `/reports/sales`, `/reports/purchases`, `/reports/stock`, `/reports/labour` | S restricted |
| Uploads | `POST /uploads/sign`, `POST /uploads/confirm`, `DELETE /uploads/{id}` | P/C/S per use case |
| Settings/roles | `GET/PATCH /admin/settings`, `GET /admin/permissions`, `POST /admin/users/{id}/roles` | A/S scoped |
| Notifications | `GET /notifications`, `POST /notifications/{id}/read` | C/S |
| Audit | `GET /admin/audit-logs` | A |
| Health | `GET /health` (minimal sanitized status) | P |
| Future payments | `POST /payments/intent`, `POST /webhooks/payment-provider`, `GET /payments/{id}` | C/server |
| Future partners | `GET /partner/assignments`, `POST /partner/quotations` | partner-scoped |

**Important:** The above is an inventory, not a claim that endpoints exist. `GET /me` and authenticated ownership/permissions are part of the contract. Never use generic `PATCH status` to bypass workflow rules. Public lead and upload endpoints require spam controls. Avoid allowing anonymous upload without short-lived upload intent tied to an enquiry and quotas.

