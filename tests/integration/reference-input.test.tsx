import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReferenceInput } from '@/features/operations/reference-input';
it('preserves an existing foreign key while asynchronous options have not loaded', () => {
  const id = crypto.randomUUID(), html = renderToStaticMarkup(<ReferenceInput field={{ key: 'category_id', label: 'Category', type: 'reference', reference: 'categories' }} initial={id}/>);
  expect(html).toContain(`value="${id}" selected=""`); expect(html).toContain('Saved selection (not in loaded options)'); expect(html).toContain('name="category_id"');
});
