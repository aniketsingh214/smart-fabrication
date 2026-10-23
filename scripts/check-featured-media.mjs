import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    SELECT p.id, p.name, p.slug, c.name as cat_name, c.slug as cat_slug, ma.public_id, ma.format
    FROM public.products p
    JOIN public.categories c ON c.id = p.category_id
    JOIN public.product_media pm ON pm.product_id = p.id
    JOIN public.media_assets ma ON ma.id = pm.media_id
    WHERE p.featured = true AND p.status = 'published'
    ORDER BY c.name ASC
  `);

  console.log(`Featured Flagship Products (${res.rows.length}):`);
  res.rows.forEach((r, i) => {
    console.log(`${i + 1}. [${r.cat_name}] "${r.name}"\n   public_id: ${r.public_id}\n   format: ${r.format}\n`);
  });

  await db.end();
}

main().catch(console.error);
