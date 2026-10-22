import { databaseClient } from './db-client.mjs';

async function verify() {
  const db = databaseClient();
  await db.connect();

  const gatesCount = await db.query(`select count(*) as count from public.products where sku like 'GATE-STL-%'`);
  const railingsCount = await db.query(`select count(*) as count from public.products where sku like 'RLG-%'`);
  const totalProducts = await db.query(`select count(*) as count from public.products where status = 'published'`);

  const catBreakdown = await db.query(`
    select c.name, c.slug, count(p.id) as count
    from public.products p
    join public.categories c on p.category_id = c.id
    where p.sku like 'GATE-STL-%' or p.sku like 'RLG-%'
    group by c.name, c.slug
    order by count desc
  `);

  console.log('--- Database Verification for Steel Gates & Railings ---');
  console.log('Steel Gates in Database (from this search):', gatesCount.rows[0].count);
  console.log('Steel Railings in Database (from this search):', railingsCount.rows[0].count);
  console.log('Total Published Products across Entire Website:', totalProducts.rows[0].count);

  console.log('\nBreakdown by Category/Subcategory:');
  catBreakdown.rows.forEach(r => {
    console.log(`- ${r.name} (${r.slug}): ${r.count} products`);
  });

  await db.end();
}

verify().catch(console.error);
