import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const countRes = await db.query('select count(*) from public.gallery_items');
  console.log('Total in gallery_items table:', countRes.rows[0].count);

  const res = await db.query(`
    select gi.id, gi.name, gi.alt_text, c.name as category_name, ma.public_id
    from public.gallery_items gi
    left join public.categories c on c.id = gi.category_id
    left join public.media_assets ma on ma.id = gi.media_id
    order by gi.created_at desc
    limit 40
  `);

  console.log('\nLatest 40 gallery items:');
  res.rows.forEach((r, i) => console.log(`${i + 1}. [${r.name}] (Cat: ${r.category_name}) -> ${r.public_id}`));

  await db.end();
}

main().catch(console.error);
