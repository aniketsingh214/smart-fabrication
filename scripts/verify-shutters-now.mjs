import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const gShutters = await db.query(`
    select gi.id, gi.name, c.name as category_name, ma.public_id
    from public.gallery_items gi
    join public.categories c on c.id = gi.category_id
    left join public.media_assets ma on ma.id = gi.media_id
    where c.slug ilike '%shutter%'
    order by gi.created_at desc
  `);

  console.log(`Shutter items in Our Work Gallery: ${gShutters.rows.length}`);
  gShutters.rows.forEach((r, i) => console.log(`${i + 1}. "${r.name}" (${r.category_name}) -> ${r.public_id}`));

  const pShutters = await db.query(`
    select p.id, p.name, p.status, c.name as category_name
    from public.products p
    join public.categories c on c.id = p.category_id
    where c.slug ilike '%shutter%' and p.status = 'published'
    order by p.name asc
  `);
  console.log(`\nPublished Shutter products in Catalog: ${pShutters.rows.length}`);
  pShutters.rows.forEach((r, i) => console.log(`${i + 1}. "${r.name}" (${r.category_name})`));

  await db.end();
}

main().catch(console.error);
