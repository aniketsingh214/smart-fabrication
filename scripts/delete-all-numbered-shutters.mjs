import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  console.log('--- Deleting all numbered / uncurated scraped rolling shutter items ---');

  // 1. Delete from gallery_items
  const delGallery = await db.query(`
    DELETE FROM public.gallery_items
    WHERE name ~* 'Rolling Shutter [0-9]+'
       OR name ~* 'Warehouse Shutter [0-9]+'
       OR name IN ('Aluminium Roller Shutter', 'Black Glass Rolling Shutter')
    RETURNING id, name
  `);
  console.log(`Deleted ${delGallery.rowCount} items from public.gallery_items:`);
  delGallery.rows.forEach((r, i) => console.log(` ${i + 1}. [Gallery ID: ${r.id}] ${r.name}`));

  // 2. Archive corresponding products in public.products
  const archiveProducts = await db.query(`
    UPDATE public.products
    SET status = 'archived', featured = false
    WHERE name ~* 'Rolling Shutter [0-9]+'
       OR name ~* 'Warehouse Shutter [0-9]+'
       OR name IN ('Aluminium Roller Shutter', 'Black Glass Rolling Shutter')
    RETURNING id, name, status
  `);
  console.log(`\nArchived ${archiveProducts.rowCount} products in public.products:`);
  archiveProducts.rows.forEach((r, i) => console.log(` ${i + 1}. [Product ID: ${r.id}] ${r.name} -> status: ${r.status}`));

  // 3. Ensure authentic workshop shutter product is published and featured
  await db.query(`
    UPDATE public.products
    SET status = 'published', featured = true
    WHERE id = '8e459ea1-2fe4-4b21-83ed-47ffebca2589'
  `);

  // 4. Verify featured products
  const featured = await db.query(`
    SELECT p.id, p.name, p.status, c.name as category_name
    FROM public.products p
    JOIN public.categories c ON c.id = p.category_id
    WHERE p.featured = true AND p.status = 'published'
    ORDER BY c.name ASC
  `);
  console.log(`\nFlagship Featured Products (${featured.rowCount}):`);
  featured.rows.forEach((f, i) => console.log(` ${i + 1}. ${f.name} (${f.category_name})`));

  // 5. Total counts
  const gCount = await db.query('SELECT count(*) FROM public.gallery_items');
  const pCount = await db.query("SELECT count(*) FROM public.products WHERE status = 'published'");
  console.log(`\nRemaining Active Counts:`);
  console.log(`- Gallery Items in "Our Work": ${gCount.rows[0].count}`);
  console.log(`- Published Products in Catalog: ${pCount.rows[0].count}`);

  await db.end();
}

main().catch(console.error);
