import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const shutters = await db.query(`
    SELECT id, name
    FROM public.gallery_items
    WHERE name ILIKE '%rolling shutter%' OR name ILIKE '%warehouse shutter%'
  `);
  console.log(`Numbered/unrelated rolling shutters in gallery: ${shutters.rows.length}`);
  shutters.rows.forEach(r => console.log(`- ${r.name}`));

  const publishedShutters = await db.query(`
    SELECT id, name
    FROM public.products
    WHERE status = 'published' AND (name ILIKE '%rolling shutter %' OR name ILIKE '%warehouse shutter %')
  `);
  console.log(`Published numbered shutters in catalog: ${publishedShutters.rows.length}`);

  const totalGallery = await db.query('SELECT count(*) FROM public.gallery_items');
  const totalPublished = await db.query("SELECT count(*) FROM public.products WHERE status = 'published'");
  console.log(`\nFinal gallery items: ${totalGallery.rows[0].count}`);
  console.log(`Final published products: ${totalPublished.rows[0].count}`);

  await db.end();
}

main().catch(console.error);
