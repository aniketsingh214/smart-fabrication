import assert from 'node:assert/strict';
import { databaseClient } from './db-client.mjs';
/** Reconcile uncertain create responses by exact generated labels; read-only, no business writes. */
export async function publicationFixtureRecords(run) {
  assert.match(run, /^[0-9a-f-]{36}$/);
  const db = databaseClient();
  try {
    await db.connect(); await db.query('begin isolation level repeatable read read only');
    const found = {};
    for (const [key, sql, values] of [
      ['sectionId', 'select id from public.website_sections where name=$1 and heading=$2', ['process', `TEST ONLY process ${run}`]],
      ['categoryId', 'select id from public.categories where slug=$1 and name=$2', [`test-category-${run}`, `TEST ONLY category ${run}`]],
      ['materialId', 'select id from public.materials where code=$1 and name=$2', [`TEST-CALC-${run}`, `TEST ONLY calculator material ${run}`]],
      ['productId', 'select id,category_id from public.products where slug=$1 and name=$2', [`test-gate-${run}`, `TEST ONLY demo gate ${run}`]],
      ['variantId', 'select id from public.product_variants where sku=$1 and name=$2', [`TEST-V-${run}`, `TEST variant ${run}`]],
      ['optionId', 'select id from public.product_options where name=$1', [`TEST option ${run}`]],
      ['leadId', 'select id from public.leads where email=$1 and name=$2', [`sf-publication-lead-${run}@example.invalid`, `TEST ONLY publication lead ${run}`]],
    ]) {
      const { rows } = await db.query(sql, values); assert.ok(rows.length <= 1, 'Duplicate fixture labels; stop for review'); if (rows[0]) { found[key] = rows[0].id; if (key === 'productId') found.storedProductCategoryId = rows[0].category_id; }
    }
    await db.query('commit'); return found;
  } finally { await db.query('rollback').catch(() => {}); await db.end().catch(() => {}); }
}
