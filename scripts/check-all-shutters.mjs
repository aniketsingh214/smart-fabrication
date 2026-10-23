import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    SELECT gi.id, gi.name, c.name as category_name
    FROM public.gallery_items gi
    JOIN public.categories c ON c.id = gi.category_id
    WHERE c.name ILIKE '%shutter%' OR gi.name ILIKE '%shutter%' OR gi.name IN ('Right', 'Cinema', 'Public', 'Iykyk')
    ORDER BY gi.name ASC
  `);

  console.log(`Total shutter related gallery items: ${res.rows.length}`);
  res.rows.forEach(r => console.log(`- [${r.id}] "${r.name}" (${r.category_name})`));

  await db.end();
}

main().catch(console.error);
