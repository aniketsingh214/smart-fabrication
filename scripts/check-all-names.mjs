import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    select gi.id, gi.name, gi.alt_text, c.name as category_name, c.slug as category_slug
    from public.gallery_items gi
    left join public.categories c on c.id = gi.category_id
    order by gi.name asc
  `);

  console.log(`Checking ${res.rows.length} gallery items for unusual names or spam:`);

  const list = [];
  for (const r of res.rows) {
    // Check if name has pipe '|' or hashtag '#' or url or unusual patterns
    if (
      r.name.includes('|') ||
      r.name.includes('#') ||
      r.name.includes('http') ||
      r.name.includes('.com') ||
      r.name.includes('...') ||
      r.name.includes('?') ||
      r.name.includes('!') ||
      r.name.toLowerCase().includes('en suite') ||
      r.name.toLowerCase().includes('kitchen') ||
      r.name.toLowerCase().includes('furniture') ||
      r.name.toLowerCase().includes('cabinet') ||
      r.name.toLowerCase().includes('bedroom') ||
      r.name.toLowerCase().includes('living room') ||
      r.name.toLowerCase().includes('sofa') ||
      r.name.toLowerCase().includes('wardrobe')
    ) {
      list.push(r);
    }
  }

  console.log(`Found ${list.length} items with non-standard / suspicious names:`);
  list.forEach(item => {
    console.log(`- ID: ${item.id} | Name: "${item.name}" | Cat: ${item.category_name}`);
  });

  await db.end();
}

main().catch(console.error);
