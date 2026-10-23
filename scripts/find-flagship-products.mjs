import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const categories = [
    { slug: 'main-gates', name: 'Main Gates & Entry Gates' },
    { slug: 'railings', name: 'Stair & Balcony Railings' },
    { slug: 'window-grills', name: 'Safety Window Grills' },
    { slug: 'rolling-shutters', name: 'Commercial Rolling Shutters' },
    { slug: 'metal-doors', name: 'Steel & Security Doors' },
    { slug: 'industrial-sheds', name: 'Sheds & Roofing' }
  ];

  for (const cat of categories) {
    const res = await db.query(`
      select p.id, p.name, p.sku, p.slug, c.name as category_name, ma.public_id
      from public.products p
      join public.categories c on p.category_id = c.id
      left join public.product_media pm on pm.product_id = p.id and pm.sort_order = 0
      left join public.media_assets ma on ma.id = pm.media_id
      where (c.slug = $1 or c.parent_id in (select id from public.categories where slug = $1))
        and p.status = 'published'
        and ma.public_id is not null
      order by p.created_at asc, p.id asc
      limit 6
    `, [cat.slug]);

    console.log(`\n================ ${cat.name} (${cat.slug}) ================`);
    res.rows.forEach(r => console.log(`[${r.sku}] ${r.name}\n   Media: ${r.public_id}\n   Sub: ${r.category_name}`));
  }

  await db.end();
}

main().catch(console.error);
