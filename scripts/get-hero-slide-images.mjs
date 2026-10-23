import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    SELECT DISTINCT ON (c.slug)
      c.name as cat_name,
      c.slug as cat_slug,
      p.name as prod_name,
      ma.public_id,
      ma.format
    FROM public.products p
    JOIN public.categories c ON c.id = p.category_id
    JOIN public.product_media pm ON pm.product_id = p.id
    JOIN public.media_assets ma ON ma.id = pm.media_id
    WHERE p.status = 'published' AND ma.public_id IS NOT NULL
    ORDER BY c.slug, p.featured DESC
  `);

  console.log(`Found ${res.rows.length} category flagship images:`);
  res.rows.forEach(r => {
    const cloudUrl = `https://res.cloudinary.com/dytchcxam/image/upload/${r.public_id}.${r.format || 'jpg'}`;
    console.log(`- [${r.cat_slug}] "${r.prod_name}" -> ${cloudUrl}`);
  });

  await db.end();
}

main().catch(console.error);
