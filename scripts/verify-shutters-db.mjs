import { databaseClient } from './db-client.mjs';

async function verify() {
  const db = databaseClient();
  await db.connect();

  const shuttersCount = await db.query(`select count(*) as count from public.products where sku like 'SHT-%' or sku like 'SHUTTER-%'`);
  const totalProducts = await db.query(`select count(*) as count from public.products where status = 'published'`);
  const mediaCount = await db.query(`select count(*) as count from public.media_assets`);

  const catBreakdown = await db.query(`
    select c.name, c.slug, count(p.id) as count
    from public.products p
    join public.categories c on p.category_id = c.id
    where p.sku like 'SHT-%' or p.sku like 'SHUTTER-%' or c.slug like '%shutter%'
    group by c.name, c.slug
    order by count desc
  `);

  console.log('=== Database Verification for Rolling Shutters ===');
  console.log('Total Shutters in Database:', shuttersCount.rows[0].count);
  console.log('Total Published Products across Entire Website:', totalProducts.rows[0].count);
  console.log('Total Media Assets:', mediaCount.rows[0].count);

  console.log('\nShutters Breakdown by Subcategory:');
  catBreakdown.rows.forEach(r => {
    console.log(`- ${r.name} (${r.slug}): ${r.count} products`);
  });

  await db.end();
}

verify().catch(console.error);
