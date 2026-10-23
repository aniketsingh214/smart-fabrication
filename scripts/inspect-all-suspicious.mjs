import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const cols = await db.query(`select column_name from information_schema.columns where table_name = 'media_assets'`);
  console.log('media_assets columns:', cols.rows.map(c => c.column_name));

  const res = await db.query(`
    select gi.id, gi.name, c.name as category_name, ma.public_id, ma.format
    from public.gallery_items gi
    left join public.categories c on c.id = gi.category_id
    left join public.media_assets ma on ma.id = gi.media_id
    order by gi.name asc
  `);

  const list = res.rows.filter(r => !/^[A-Za-z0-9\s\-\(\)\&]+$/.test(r.name) || r.name.toLowerCase().includes('en suite') || r.name.toLowerCase().includes('cabinet'));

  console.log(`Analyzing ${list.length} items:`);
  for (const item of list) {
    const cloudUrl = item.public_id ? `https://res.cloudinary.com/dytchcxam/image/upload/${item.public_id}.${item.format || 'jpg'}` : 'NO_IMAGE';
    console.log(`ID: ${item.id} | Name: "${item.name}" | Cat: ${item.category_name} | URL: ${cloudUrl}`);
  }

  await db.end();
}

main().catch(console.error);
