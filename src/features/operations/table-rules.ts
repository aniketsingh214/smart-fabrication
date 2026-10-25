import { resourceSchema, type Resource } from '@/contracts/resources';

export function canEditRecord(resource: Resource, permissions: string[], row?: Record<string, unknown>) {
  const draftOnly = ['quotations', 'purchases', 'expenses', 'bom-versions', 'calculation-rules'].includes(resource.slug);
  return permissions.includes(resource.writePermission ?? `${resource.domain}.write`) && !resource.readOnly && !resource.appendOnly && !resource.rpc && !['measurements', 'labour-rates'].includes(resource.slug) && (!row || !draftOnly || row.status === 'draft');
}

// Removing a listing never destroys operational or financial history.
export function removalPatch(resource: Resource): Record<string, unknown> | null {
  if (['categories', 'materials', 'workers'].includes(resource.slug)) return { active: false };
  if (['products', 'product-variants', 'product-options', 'gallery', 'site-sections'].includes(resource.slug)) return { status: 'archived' };
  if (resource.slug === 'reviews') return { status: 'hidden' };
  return null;
}

export function parseRecordForm(resource: Resource, form: FormData) {
  const payload: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const field of resource.fields) {
    const value = form.get(field.key);
    if (field.type === 'boolean') payload[field.key] = value === 'on';
    else if (value === null || value === '') payload[field.key] = ['text', 'textarea'].includes(field.type) ? '' : null;
    else {
      try {
        if (['number', 'money', 'percent'].includes(field.type)) {
          const number = Number(value);
          if (!Number.isFinite(number)) throw new Error('Enter a valid number');
          payload[field.key] = field.type === 'number' ? number : Math.round(number * 100);
        } else if (field.type === 'datetime') payload[field.key] = new Date(String(value)).toISOString();
        else if (field.type === 'json') payload[field.key] = JSON.parse(String(value));
        else payload[field.key] = value;
      } catch { errors[field.key] = field.type === 'json' ? 'Enter a valid JSON object' : `Enter a valid ${field.label.toLowerCase()}`; }
    }
  }
  const result = resourceSchema(resource).safeParse(payload);
  if (!result.success) for (const issue of result.error.issues) errors[String(issue.path[0])] ??= issue.message;
  if (['products', 'product-variants'].includes(resource.slug) && Number(payload.price_max_minor) < Number(payload.price_min_minor)) errors.price_max_minor = 'Maximum price must cover starting price';
  if (resource.slug === 'reviews' && Number(payload.rating) > 5) errors.rating = 'Rating must be between 1 and 5';
  return { payload: result.success ? result.data : payload, errors };
}
