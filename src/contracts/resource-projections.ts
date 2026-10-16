import type { Resource } from './resources';
const extra: Record<string, string[]> = {
  leads: ['configuration_snapshot', 'assigned_to', 'duplicate_of', 'version', 'updated_at'],
  orders: ['quotation_version_id', 'customer_id', 'note', 'version'],
  quotations: ['status', 'revision_of', 'revision_reason'],
  'purchase-items': ['net_minor', 'tax_minor', 'inventory_minor'],
  'purchase-returns': ['inventory_value_minor'],
  'lead-notes': ['created_by'],
  'stock-movements': ['work_order_id', 'purchase_id', 'note', 'created_by'],
  'media-assets': ['duration_seconds', 'asset_id', 'format', 'width', 'height', 'owner_user_id', 'context'],
  'audit-logs': ['actor_id', 'old_status', 'new_status'],
};
/** Explicit shared projection: adding a database column cannot silently expose it. */
export function recordFields(resource: Resource) {
  return [...new Set(['id', 'created_at', ...resource.fields.map(field => field.key), ...resource.columns, ...(extra[resource.slug] ?? [])])].join(',');
}
