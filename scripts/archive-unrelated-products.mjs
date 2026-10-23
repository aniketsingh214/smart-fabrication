import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const badSkus = [
    'SHT-COM-002', 'SHT-COM-034', 'SHT-COM-045', 'SHT-COM-063',
    'SHT-COM-066', 'SHT-COM-069', 'SHT-COM-073', 'SHT-COM-074',
    'SHT-COM-076', 'SHT-COM-079', 'SHT-COM-081', 'SHT-COM-084',
    'SHT-COM-086', 'SHT-COM-088', 'SHT-COM-096', 'SHT-COM-098'
  ];

  console.log(`Archiving ${badSkus.length} unrelated products...`);
  const res = await db.query(
    `update public.products
     set status = 'archived', featured = false
     where sku = any($1)
     returning id, sku, name`,
    [badSkus]
  );

  console.log(`Successfully archived ${res.rows.length} products:`);
  res.rows.forEach(r => console.log(` - [${r.sku}] ${r.name}`));

  // Also remove them from gallery_items if any remain
  const delGallery = await db.query(`
    delete from public.gallery_items
    where id in (
      select gi.id from public.gallery_items gi
      join public.product_media pm on pm.media_id = gi.media_id
      join public.products p on p.id = pm.product_id
      where p.status = 'archived'
    )
  `);
  console.log(`Deleted ${delGallery.rowCount} gallery items linked to archived products.`);

  const activeProducts = await db.query(`select count(*) from public.products where status = 'published'`);
  const totalGallery = await db.query(`select count(*) from public.gallery_items where status = 'published'`);

  console.log('\n--- Active Catalog Summary ---');
  console.log('Published Products:', activeProducts.rows[0].count);
  console.log('Published Gallery Items in "Our Work":', totalGallery.rows[0].count);

  await db.end();
}

main().catch(console.error);
