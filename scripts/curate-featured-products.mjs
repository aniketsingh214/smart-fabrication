import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  console.log('1. Setting featured = false on all products...');
  await db.query(`update public.products set featured = false`);

  // Define the 6 flagship products representing the 6 core categories
  const flagshipSkus = [
    { sku: 'GATE-STEEL-001', altSku: 'GATE-MS-001', category: 'Main Gates & Entry Gates' },
    { sku: 'RAIL-SS-002', altSku: 'RLG-GLS-002', category: 'Stair & Balcony Railings' },
    { sku: 'GRILL-MS-003', altSku: 'GRL-SSG-001', category: 'Safety Window Grills' },
    { sku: 'SHUTTER-GI-004', altSku: 'SHT-COM-001', category: 'Commercial Rolling Shutters' },
    { sku: 'DOOR-SEC-006', altSku: 'PIN-DOR-002', category: 'Steel & Security Doors' },
    { sku: 'SHED-IND-005', altSku: 'PERGOLA-EXT-007', category: 'Sheds & Roofing' }
  ];

  console.log('2. Activating curated flagship products for each category...');
  const baseTime = Date.now();

  for (let i = 0; i < flagshipSkus.length; i++) {
    const item = flagshipSkus[i];
    let res = await db.query(`select id, name, sku, slug from public.products where sku = $1`, [item.sku]);
    if (res.rows.length === 0) {
      res = await db.query(`select id, name, sku, slug from public.products where sku = $1`, [item.altSku]);
    }

    if (res.rows.length > 0) {
      const prod = res.rows[0];
      // Stagger created_at by seconds so order is deterministic
      const staggeredDate = new Date(baseTime - i * 10000).toISOString();
      await db.query(`update public.products set featured = true, created_at = $1 where id = $2`, [staggeredDate, prod.id]);
      console.log(`   [${i + 1}/6] Flagship for ${item.category}: [${prod.sku}] ${prod.name}`);
    } else {
      console.warn(`   WARNING: No product found for ${item.category}`);
    }
  }

  console.log('\n3. Verifying the 6 featured products that will appear on homepage:');
  const verifyRes = await db.query(`
    select p.name, p.sku, p.material, c.name as category_name, ma.public_id
    from public.products p
    join public.categories c on p.category_id = c.id
    left join public.product_media pm on pm.product_id = p.id and pm.sort_order = 0
    left join public.media_assets ma on ma.id = pm.media_id
    where p.status = 'published' and p.featured = true
    order by p.created_at desc, p.id desc
    limit 6
  `);

  verifyRes.rows.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.category_name}] ${r.name} (${r.sku})\n   Image: ${r.public_id}`);
  });

  await db.end();
}

main().catch(console.error);
