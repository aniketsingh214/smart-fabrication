import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    select gi.id, gi.name, c.name as cat_name, ma.public_id
    from public.gallery_items gi
    left join public.categories c on c.id = gi.category_id
    left join public.media_assets ma on ma.id = gi.media_id
    order by c.name asc, gi.name asc
  `);

  console.log(`Total gallery items: ${res.rows.length}`);

  const byCat = new Map();
  for (const r of res.rows) {
    const cat = r.cat_name || 'Uncategorized';
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(r);
  }

  for (const [cat, items] of byCat.entries()) {
    console.log(`\n=== Category: ${cat} (${items.length} items) ===`);
    console.log('Sample item 1:', items[0]?.name, '->', items[0]?.public_id);
    if (items.length > 1) {
      console.log('Sample item 2:', items[1]?.name, '->', items[1]?.public_id);
    }
  }

  await db.end();
}

main().catch(console.error);
