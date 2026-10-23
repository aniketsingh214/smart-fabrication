import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    select gi.id, gi.name, gi.alt_text, c.name as category_name, c.slug as category_slug, ma.public_id
    from public.gallery_items gi
    left join public.categories c on c.id = gi.category_id
    left join public.media_assets ma on ma.id = gi.media_id
    order by gi.name asc
  `);

  console.log(`Total gallery items: ${res.rows.length}`);

  const suspicious = [];
  for (const r of res.rows) {
    const n = r.name.toLowerCase();
    if (
      n.startsWith('#') ||
      n.includes('kitchen') ||
      n.includes('cabinet') ||
      n.includes('suite') ||
      n.includes('how to') ||
      n.includes('best roller') ||
      n.includes('cakhia') ||
      n.includes('toilet') ||
      n.includes('bath') ||
      n.includes('fitting') ||
      n.includes('furniture') ||
      n.includes('closet') ||
      n.includes('wardrobe') ||
      n.includes('appliances') ||
      n.includes('london |') ||
      n.includes('interlocking') === false && r.category_slug === 'commercial-shop-storefront-rolling-shutters' && n.length > 50
    ) {
      suspicious.push(r);
    }
  }

  console.log(`Suspicious items found: ${suspicious.length}`);
  suspicious.forEach(s => console.log(`- [${s.id}] "${s.name}" (Cat: ${s.category_name})`));

  await db.end();
}

main().catch(console.error);
