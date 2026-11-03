# Applied schema dictionary

Captured from the connected development project in a repeatable-read, read-only transaction. No application records or secrets included. Applied relationships and constraints: [diagram](erd.md).

## audit_logs

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| actor_id | uuid | YES |  |
| action | text | NO |  |
| entity_type | text | NO |  |
| entity_id | text | YES |  |
| old_status | text | YES |  |
| new_status | text | YES |  |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## bom_items

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| bom_id | uuid | NO |  |
| material_id | uuid | NO |  |
| quantity_per_sq_m | numeric | NO |  |
| wastage_percent | numeric | NO | 5 |
| created_at | timestamp with time zone | NO | now() |
| customer_visible | boolean | NO | true |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## bom_versions

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| product_id | uuid | NO |  |
| version | integer | NO |  |
| status | text | NO | 'draft'::text |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## calculation_rules

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| product_id | uuid | NO |  |
| version | integer | NO |  |
| labour_minor_per_sq_m | bigint | NO |  |
| finish_minor_per_sq_m | bigint | NO |  |
| hardware_minor | bigint | NO |  |
| delivery_minor | bigint | NO |  |
| installation_minor | bigint | NO |  |
| margin_bps | integer | NO |  |
| range_percent | integer | NO |  |
| status | text | NO | 'draft'::text |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## catalog_copies

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO |  |
| source_id | uuid | NO |  |
| product_id | uuid | NO |  |
| actor_id | uuid | NO |  |
| request | jsonb | NO |  |
| created_at | timestamp with time zone | NO | now() |

## categories

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| slug | text | NO |  |
| parent_id | uuid | YES |  |
| active | boolean | NO | true |
| sort_order | integer | NO | 0 |
| created_at | timestamp with time zone | NO | now() |
| image_media_id | uuid | YES |  |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## customer_payments

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| order_id | uuid | NO |  |
| amount_minor | bigint | NO |  |
| mode | text | NO |  |
| reference | text | NO |  |
| idempotency_key | uuid | NO |  |
| created_by | uuid | YES | auth.uid() |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## customers

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES |  |
| name | text | NO |  |
| phone | text | NO |  |
| email | text | YES |  |
| address | text | NO | ''::text |
| notes | text | NO | ''::text |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## deliveries

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| order_id | uuid | NO |  |
| scheduled_at | timestamp with time zone | NO |  |
| address | text | NO |  |
| crew | text | NO |  |
| status | text | NO | 'scheduled'::text |
| proof_media_id | uuid | YES |  |
| confirmed_at | timestamp with time zone | YES |  |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## estimate_snapshots

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| product_id | uuid | NO |  |
| bom_id | uuid | NO |  |
| input | jsonb | NO |  |
| result | jsonb | NO |  |
| formula_version | text | NO |  |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## expense_reversals

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| expense_id | uuid | NO |  |
| amount_minor | bigint | NO |  |
| reversal_date | date | NO |  |
| reason | text | NO |  |
| idempotency_key | uuid | NO |  |
| created_by | uuid | NO |  |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## expenses

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| category | text | NO |  |
| amount_minor | bigint | NO |  |
| expense_date | date | NO |  |
| mode | text | NO |  |
| reference | text | NO |  |
| order_id | uuid | YES |  |
| status | text | NO | 'draft'::text |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## finance_period_closures

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| closed_through | date | NO |  |
| reason | text | NO |  |
| idempotency_key | uuid | NO |  |
| created_by | uuid | NO |  |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## financial_adjustments

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| kind | text | NO |  |
| source_id | uuid | NO |  |
| purchase_id | uuid | YES |  |
| order_id | uuid | YES |  |
| worker_id | uuid | YES |  |
| amount_minor | bigint | NO |  |
| posting_date | date | NO |  |
| mode | text | NO |  |
| reference | text | NO |  |
| reason | text | NO |  |
| idempotency_key | uuid | NO |  |
| created_by | uuid | NO |  |
| request | jsonb | NO |  |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## follow_ups

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| lead_id | uuid | NO |  |
| assigned_to | uuid | YES |  |
| due_at | timestamp with time zone | NO |  |
| note | text | NO | ''::text |
| status | text | NO | 'pending'::text |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## gallery_items

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| media_id | uuid | YES |  |
| category_id | uuid | YES |  |
| alt_text | text | NO |  |
| status | text | NO | 'draft'::text |
| consent_confirmed | boolean | NO | false |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## installations

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| delivery_id | uuid | NO |  |
| checklist | jsonb | NO | '{}'::jsonb |
| customer_confirmed | boolean | NO | false |
| status | text | NO | 'pending'::text |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## labour_payments

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| worker_id | uuid | NO |  |
| amount_minor | bigint | NO |  |
| mode | text | NO |  |
| reference | text | NO |  |
| idempotency_key | uuid | NO |  |
| created_at | timestamp with time zone | NO | now() |
| created_by | uuid | YES | auth.uid() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## labour_rates

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| worker_id | uuid | NO |  |
| unit | text | NO |  |
| rate_minor | bigint | NO |  |
| effective_at | timestamp with time zone | NO | now() |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## lead_attachments

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| lead_id | uuid | NO |  |
| media_id | uuid | NO |  |
| created_at | timestamp with time zone | NO | now() |

## lead_notes

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| lead_id | uuid | NO |  |
| note | text | NO |  |
| created_by | uuid | NO | auth.uid() |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## lead_status_history

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| lead_id | uuid | NO |  |
| from_status | text | YES |  |
| to_status | text | NO |  |
| actor_id | uuid | YES |  |
| created_at | timestamp with time zone | NO | now() |

## leads

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| phone | text | NO |  |
| email | text | YES |  |
| city | text | NO |  |
| requirement | text | NO |  |
| product_id | uuid | YES |  |
| source | text | NO | 'direct'::text |
| status | text | NO | 'NEW'::text |
| assigned_to | uuid | YES |  |
| customer_id | uuid | YES |  |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |
| version | integer | NO | 1 |
| duplicate_of | uuid | YES |  |
| configuration_snapshot | jsonb | NO | '{}'::jsonb |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## material_rates

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| material_id | uuid | NO |  |
| purchase_minor | bigint | NO |  |
| selling_minor | bigint | NO |  |
| effective_at | timestamp with time zone | NO | now() |
| currency | text | NO | 'INR'::text |
| created_by | uuid | YES | auth.uid() |
| created_at | timestamp with time zone | NO | clock_timestamp() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## materials

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| code | text | NO |  |
| type | text | NO |  |
| size | text | NO |  |
| thickness_mm | numeric | NO |  |
| unit | text | NO |  |
| weight_kg_per_unit | numeric | NO |  |
| reorder_level | numeric | NO | 0 |
| active | boolean | NO | true |
| created_at | timestamp with time zone | NO | now() |

## measurements

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| lead_id | uuid | NO |  |
| width_mm | numeric | NO |  |
| height_mm | numeric | NO |  |
| depth_mm | numeric | YES |  |
| note | text | NO | ''::text |
| verified_by | uuid | NO | auth.uid() |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## media_assets

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| asset_id | text | NO |  |
| public_id | text | NO |  |
| resource_type | text | NO |  |
| format | text | NO |  |
| bytes | bigint | NO |  |
| width | integer | YES |  |
| height | integer | YES |  |
| owner_user_id | uuid | YES |  |
| visibility | text | NO |  |
| context | text | NO |  |
| created_at | timestamp with time zone | NO | now() |
| duration_seconds | numeric | YES |  |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## notifications

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO |  |
| name | text | NO |  |
| body | text | NO |  |
| read_at | timestamp with time zone | YES |  |
| created_at | timestamp with time zone | NO | now() |
| event_key | text | YES |  |
| entity_type | text | YES |  |
| entity_id | uuid | YES |  |

## order_status_history

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| order_id | uuid | NO |  |
| from_status | text | YES |  |
| to_status | text | NO |  |
| note | text | NO | ''::text |
| actor_id | uuid | YES | auth.uid() |
| created_at | timestamp with time zone | NO | now() |

## orders

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| quotation_version_id | uuid | NO |  |
| customer_id | uuid | NO |  |
| total_minor | bigint | NO |  |
| status | text | NO | 'CONFIRMED'::text |
| due_at | timestamp with time zone | YES |  |
| note | text | NO | ''::text |
| version | integer | NO | 1 |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## owner_withdrawals

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| amount_minor | bigint | NO |  |
| withdrawal_date | date | NO |  |
| mode | text | NO |  |
| reason | text | NO |  |
| created_by | uuid | YES | auth.uid() |
| created_at | timestamp with time zone | NO | now() |
| idempotency_key | uuid | NO | gen_random_uuid() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## permissions

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |

## product_media

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| product_id | uuid | NO |  |
| media_id | uuid | NO |  |
| alt_text | text | NO |  |
| sort_order | integer | NO | 0 |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## product_options

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| product_id | uuid | NO |  |
| name | text | NO |  |
| option_group | text | NO |  |
| extra_cost_minor | bigint | NO | 0 |
| sort_order | integer | NO | 0 |
| status | text | NO | 'draft'::text |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## product_variants

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| product_id | uuid | NO |  |
| name | text | NO |  |
| sku | text | NO |  |
| width_mm | integer | YES |  |
| height_mm | integer | YES |  |
| colour | text | NO | ''::text |
| finish | text | NO | ''::text |
| price_min_minor | bigint | NO | 0 |
| price_max_minor | bigint | NO | 0 |
| status | text | NO | 'draft'::text |
| created_at | timestamp with time zone | NO | now() |

## products

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| sku | text | NO |  |
| slug | text | NO |  |
| category_id | uuid | YES |  |
| description | text | NO | ''::text |
| material | text | NO | 'Mild steel'::text |
| finish | text | NO | ''::text |
| price_min_minor | bigint | NO | 0 |
| price_max_minor | bigint | NO | 0 |
| custom_size | boolean | NO | true |
| status | text | NO | 'draft'::text |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |
| weight_kg | numeric | YES |  |
| design_code | text | NO | ''::text |
| design_details | text | NO | ''::text |
| featured | boolean | NO | false |
| delivery_availability | text | NO | 'confirm_with_workshop'::text |
| installation_availability | text | NO | 'confirm_with_workshop'::text |

## profiles

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO |  |
| display_name | text | NO | ''::text |
| disabled | boolean | NO | false |
| created_at | timestamp with time zone | NO | now() |

## purchase_attachments

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| purchase_id | uuid | NO |  |
| media_id | uuid | NO |  |
| note | text | NO | ''::text |
| created_by | uuid | NO |  |
| created_at | timestamp with time zone | NO | now() |

## purchase_items

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| purchase_id | uuid | NO |  |
| material_id | uuid | NO |  |
| quantity | numeric | NO |  |
| rate_minor | bigint | NO |  |
| created_at | timestamp with time zone | NO | now() |
| discount_minor | bigint | NO | 0 |
| tax_bps | integer | NO | 0 |
| tax_recoverable | boolean | NO | false |
| net_minor | bigint | YES |  |
| tax_minor | bigint | YES |  |
| total_minor | bigint | YES |  |
| inventory_minor | bigint | YES |  |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## purchase_returns

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| purchase_item_id | uuid | NO |  |
| quantity | numeric | NO |  |
| amount_minor | bigint | NO |  |
| reason | text | NO |  |
| idempotency_key | uuid | NO |  |
| created_by | uuid | YES | auth.uid() |
| created_at | timestamp with time zone | NO | now() |
| inventory_value_minor | bigint | YES |  |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## purchases

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| supplier_id | uuid | NO |  |
| bill_number | text | NO |  |
| bill_date | date | NO |  |
| total_minor | bigint | NO | 0 |
| status | text | NO | 'draft'::text |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## quality_checks

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| work_order_id | uuid | NO |  |
| name | text | NO |  |
| passed | boolean | NO |  |
| note | text | NO | ''::text |
| created_by | uuid | YES | auth.uid() |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## quotation_versions

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| quotation_id | uuid | NO |  |
| version | integer | NO |  |
| snapshot | jsonb | NO |  |
| total_minor | bigint | NO |  |
| currency | text | NO | 'INR'::text |
| created_at | timestamp with time zone | NO | now() |

## quotations

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| lead_id | uuid | YES |  |
| customer_id | uuid | NO |  |
| status | text | NO | 'draft'::text |
| expires_at | timestamp with time zone | NO |  |
| created_at | timestamp with time zone | NO | now() |
| revision_of | uuid | YES |  |
| revision_key | uuid | YES |  |
| revision_reason | text | YES |  |
| revision_actor | uuid | YES |  |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## reviews

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| rating | integer | NO |  |
| body | text | NO |  |
| status | text | NO | 'pending'::text |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## role_permissions

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| role_id | text | NO |  |
| permission_id | text | NO |  |

## roles

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | text | NO |  |

## site_settings

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| value | text | NO |  |
| public | boolean | NO | false |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## stock_movements

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| material_id | uuid | NO |  |
| quantity | numeric | NO |  |
| unit_cost_minor | bigint | NO |  |
| kind | text | NO |  |
| purchase_id | uuid | YES |  |
| work_order_id | uuid | YES |  |
| note | text | NO |  |
| idempotency_key | uuid | NO |  |
| created_by | uuid | YES | auth.uid() |
| created_at | timestamp with time zone | NO | now() |
| book_value_minor | bigint | YES |  |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## stock_reservations

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| material_id | uuid | NO |  |
| work_order_id | uuid | NO |  |
| quantity | numeric | NO |  |
| status | text | NO | 'active'::text |
| created_at | timestamp with time zone | NO | now() |
| consumed_quantity | numeric | NO | 0 |
| release_note | text | NO | ''::text |
| released_at | timestamp with time zone | YES |  |
| released_by | uuid | YES |  |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## supplier_payments

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| purchase_id | uuid | NO |  |
| amount_minor | bigint | NO |  |
| mode | text | NO |  |
| reference | text | NO |  |
| idempotency_key | uuid | NO |  |
| created_at | timestamp with time zone | NO | now() |
| created_by | uuid | YES | auth.uid() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## suppliers

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| phone | text | NO |  |
| address | text | NO | ''::text |
| gst_number | text | YES |  |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## upload_intents

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO |  |
| owner_user_id | uuid | YES |  |
| public_id | text | NO |  |
| context | text | NO |  |
| visibility | text | NO |  |
| expires_at | timestamp with time zone | NO |  |
| confirmed_at | timestamp with time zone | YES |  |
| created_at | timestamp with time zone | NO | now() |
| lead_id | uuid | YES |  |
| resource_type | text | NO | 'image'::text |

## user_roles

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| user_id | uuid | NO |  |
| role_id | text | NO |  |

## website_sections

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| heading | text | NO |  |
| body | text | NO | ''::text |
| status | text | NO | 'draft'::text |
| sort_order | integer | NO | 0 |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## work_entries

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| worker_id | uuid | NO |  |
| work_order_id | uuid | NO |  |
| labour_rate_id | uuid | NO |  |
| quantity | numeric | NO |  |
| rate_minor | bigint | NO |  |
| amount_minor | bigint | NO |  |
| status | text | NO | 'approved'::text |
| created_at | timestamp with time zone | NO | now() |
| idempotency_key | uuid | NO | gen_random_uuid() |
| created_by | uuid | YES | auth.uid() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## work_orders

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| order_id | uuid | NO |  |
| assigned_to | uuid | YES |  |
| status | text | NO | 'pending'::text |
| planned_weight_kg | numeric | NO | 0 |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |

## workers

RLS enabled: true.

| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| phone | text | NO |  |
| work_type | text | NO |  |
| active | boolean | NO | true |
| created_at | timestamp with time zone | NO | now() |
| record_number | bigint | NO |  |
| record_code | text | NO |  |
