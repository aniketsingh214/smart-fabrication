import { databaseClient } from './db-client.mjs';

async function verify() {
  const db = databaseClient();
  await db.connect();

  const gatesCount = await db.query(`select count(*) as count from public.products where sku like 'GATE-%'`);
  const modernRailingsCount = await db.query(`select count(*) as count from public.products where sku like 'RLG-MODERN-%'`);
  const allRailingsCount = await db.query(`select count(*) as count from public.products where sku like 'RLG-%'`);
  const totalProducts = await db.query(`select count(*) as count from public.products where status = 'published'`);
  const mediaCount = await db.query(`select count(*) as count from public.media_assets`);

  const catBreakdown = await db.query(`
    select c.name, c.slug, count(p.id) as count
    from public.products p
    join public.categories c on p.category_id = c.id
    where p.sku like 'RLG-%'
    group by c.name, c.slug
    order by count desc
  `);

  console.log('=== Database Verification for Railings ===');
  console.log('New Modern Railings (RLG-MODERN-*):', modernRailingsCount.rows[0].count);
  console.log('Total Railings in Database (RLG-*):', allRailingsCount.rows[0].count);
  console.log('Total Gates in Database (GATE-*):', gatesCount.rows[0].count);
  console.log('Total Published Products across Entire Website:', totalProducts.rows[0].count);
  console.log('Total Media Assets:', mediaCount.rows[0].count);

  console.log('\nRailings Breakdown by Subcategory:');
  catBreakdown.rows.forEach(r => {
    console.log(`- ${r.name} (${r.slug}): ${r.count} products`);
  });

  await db.end();
}

verify().catch(console.error);
