import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { databaseClient } from './db-client.mjs';
export async function cleanupUnlinkedPublicationCategory(run) {
  assert.match(run ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  const db = databaseClient();
  try {
    await db.connect(); await db.query('begin');
    const { rows } = await db.query('select id from public.categories where slug=$1 and name=$2 for update', [`test-category-${run}`, `TEST ONLY category ${run}`]);
    assert.ok(rows.length <= 1, 'Ambiguous category fixture');
    if (rows[0]) {
      const used = await db.query('select exists(select 1 from public.products where category_id=$1) or exists(select 1 from public.categories where parent_id=$1) used', [rows[0].id]); assert.equal(used.rows[0].used, false, 'Linked category cannot use this cleanup');
      await db.query('update public.categories set active=false where id=$1 and slug=$2 and name=$3', [rows[0].id, `test-category-${run}`, `TEST ONLY category ${run}`]);
    }
    await db.query('commit');
    const file = 'test-results/publication-browser-latest.json';
    try { const report = JSON.parse(await fs.readFile(file, 'utf8')); if (report.fixture.run === run && rows[0]) { report.fixture.categoryId = rows[0].id; report.reconciledUncertainCategory = true; await fs.writeFile(file, JSON.stringify(report, null, 2)); } } catch (error) { if (error.code !== 'ENOENT') throw error; }
    console.log(`Reconciled ${rows.length} exact generated unlinked category fixture; deactivated, not deleted. Original failed-run status preserved.`);
  } finally { await db.query('rollback').catch(() => {}); await db.end().catch(() => {}); }
}
