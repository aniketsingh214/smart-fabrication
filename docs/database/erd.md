> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: planning draft; not implemented

# Conceptual ERD â€” draft

This source-era diagram describes intended relationships, not exact applied names. For the current 58-table schema, foreign keys, RLS policies and constraints use the generated [schema dictionary](schema-dictionary.md) and `actual-schema.json`. The live migration ledger has 38 entries. A fully synchronized visual ERD remains a Phase 02 acceptance item.

```mermaid
erDiagram
  PROFILES ||--o{ USER_ROLES : holds
  ROLES ||--o{ USER_ROLES : assigns
  ROLES ||--o{ ROLE_PERMISSIONS : grants
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : defines
  CATEGORIES ||--o{ PRODUCTS : groups
  PRODUCTS ||--o{ BOM_VERSIONS : versions
  BOM_VERSIONS ||--o{ BOM_ITEMS : contains
  MATERIALS ||--o{ BOM_ITEMS : uses
  MATERIALS ||--o{ MATERIAL_RATES : prices
  CUSTOMERS ||--o{ LEADS : requests
  LEADS ||--o{ FOLLOW_UPS : schedules
  LEADS ||--o{ MEASUREMENTS : measures
  LEADS ||--o{ QUOTATIONS : proposes
  QUOTATIONS ||--o{ QUOTATION_VERSIONS : snapshots
  QUOTATION_VERSIONS ||--o{ QUOTATION_ITEMS : contains
  QUOTATION_VERSIONS ||--o| ORDERS : converts
  ORDERS ||--o{ ORDER_HISTORY : records
  ORDERS ||--o{ WORK_ORDERS : fabricates
  SUPPLIERS ||--o{ PURCHASES : supplies
  PURCHASES ||--o{ PURCHASE_ITEMS : contains
  MATERIALS ||--o{ STOCK_MOVEMENTS : tracks
  WORK_ORDERS ||--o{ STOCK_RESERVATIONS : reserves
  WORKERS ||--o{ WORKER_RATE_VERSIONS : rates
  WORKERS ||--o{ WORK_ENTRIES : earns
  WORKERS ||--o{ LABOUR_PAYMENTS : receives
  ORDERS ||--o{ DELIVERIES : ships
  DELIVERIES ||--o{ INSTALLATIONS : installs
  CUSTOMERS ||--o{ CUSTOMER_RECEIPTS : pays
  SUPPLIERS ||--o{ SUPPLIER_PAYMENTS : receives
  PROFILES ||--o{ NOTIFICATIONS : receives
  PROFILES ||--o{ AUDIT_EVENTS : acts
```

Additional planned entities: addresses, media_assets and contextual links, gallery/content/reviews, quality checks, expense categories/expenses, owner withdrawals, financial entries, settings and idempotency records. Complete foreign keys, cardinality, deletion policy, constraints and transactional boundaries must be reviewed in Phase 02; this is not executable SQL.



