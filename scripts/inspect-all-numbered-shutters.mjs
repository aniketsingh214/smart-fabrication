import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    SELECT gi.id, gi.name, c.name as category_name
    FROM public.gallery_items gi
    LEFT JOIN public.categories c ON c.id = gi.category_id
    WHERE gi.name ~* 'Rolling Shutter [0-9]+'
    ORDER BY gi.name ASC
  `);

  console.log(`Gallery items matching "Rolling Shutter [0-9]+": ${res.rows.length}`);
  res.rows.forEach((r, i) => {
    if (i < 10 || i > res.rows.length - 10) {
      console.log(`${i + 1}. [${r.id}] "${r.name}" (${r.category_name})`);
    } else if (i === 10) {
      console.log('... (truncated) ...');
    }
  });

  const prodRes = await db.query(`
    SELECT p.id, p.name, p.status
    FROM public.products p
    WHERE p.name ~* 'Rolling Shutter [0-9]+'
    ORDER BY p.name ASC
  `);

  console.log(`\nProducts matching "Rolling Shutter [0-9]+": ${prodRes.rows.length} (Published: ${prodRes.rows.filter(p => p.status === 'published').length})`);

  // Also check ALL shutter category items in gallery_items
  const allShuttersInGallery = await db.query(`
    SELECT gi.id, gi.name, c.name as category_name
    FROM public.gallery_items gi
    LEFT JOIN public.categories c ON c.id = gi.category_id
    WHERE c.slug ILIKE '%shutter%' OR gi.name ILIKE '%shutter%'
    ORDER BY gi.name ASC
  `);

  console.log(`\nTotal shutter gallery items in database: ${allShuttersInGallery.rows.length}`);
  allShuttersInGallery.rows.forEach((r, i) => {
    console.log(`${i + 1}. "${r.name}"`);
  });

  await db.end();
}

main().catch(console.error);
