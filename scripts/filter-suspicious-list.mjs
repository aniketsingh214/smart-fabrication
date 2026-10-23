import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    select gi.id, gi.name, c.name as category_name, ma.public_id, ma.format
    from public.gallery_items gi
    left join public.categories c on c.id = gi.category_id
    left join public.media_assets ma on ma.id = gi.media_id
    order by gi.name asc
  `);

  const list = res.rows.filter(r => !/^[A-Za-z0-9\s\-\(\)\&]+$/.test(r.name) || r.name.toLowerCase().includes('en suite') || r.name.toLowerCase().includes('cabinet'));

  console.log(`Total non-standard items: ${list.length}`);
  list.slice(0, 8).forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.id}] "${r.name}" | Cat: ${r.category_name}`);
  });

  await db.end();
}

main().catch(console.error);
