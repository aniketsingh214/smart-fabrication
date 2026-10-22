import { databaseClient } from './db-client.mjs';

async function verify() {
  const db = databaseClient();
  await db.connect();

  const prodRes = await db.query(`select count(*) as count from public.products where sku like 'GRL-%'`);
  const mediaRes = await db.query(`select count(*) as count from public.media_assets where public_id like '%steel-grills%'`);
  const varRes = await db.query(`select count(*) as count from public.product_variants where sku like 'GRL-%'`);
  const totalProducts = await db.query(`select count(*) as count from public.products where status = 'published'`);

  const catBreakdown = await db.query(`
    select c.name, c.slug, count(p.id) as count
    from public.products p
    join public.categories c on p.category_id = c.id
    where p.sku like 'GRL-%'
    group by c.name, c.slug
    order by count desc
  `);

  console.log('--- Steel Grills Database Verification ---');
  console.log('Steel Grill Products in Database:', prodRes.rows[0].count);
  console.log('Steel Grill Cloudinary Media Assets:', mediaRes.rows[0].count);
  console.log('Steel Grill Product Variants:', varRes.rows[0].count);
  console.log('Total Published Products in Entire Catalog:', totalProducts.rows[0].count);
  console.log('\nBreakdown by Subcategory:');
  catBreakdown.rows.forEach(r => {
    console.log(`- ${r.name} (${r.slug}): ${r.count} products`);
  });

  const sampleProducts = await db.query(`
    select p.name, p.sku, c.name as category, m.public_id
    from public.products p
    join public.categories c on p.category_id = c.id
    join public.product_media pm on pm.product_id = p.id
    join public.media_assets m on pm.media_id = m.id
    where p.sku like 'GRL-%'
    limit 5
  `);
  console.log('\nSample Steel Grill Products:');
  console.log(sampleProducts.rows);

  await db.end();
}

verify().catch(console.error);
