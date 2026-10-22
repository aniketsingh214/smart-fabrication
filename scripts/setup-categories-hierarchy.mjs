import { databaseClient } from './db-client.mjs';

async function main() {
  console.log('1. Connecting to PostgreSQL...');
  const db = databaseClient();
  await db.connect();

  try {
    // Step 1: Deactivate test categories from automated test runs
    console.log('2. Deactivating test fixture categories...');
    await db.query(`
      update public.categories
      set active = false
      where slug like 'del-cat-%' or slug like 'test-category-%' or name like '%TEST ONLY%' or name like '%Delivery Gate Category%'
    `);
    console.log('Test categories deactivated.');

    // Step 2: Get Main Gates category ID
    const mainGatesRes = await db.query(`select id from public.categories where slug = 'main-gates'`);
    if (!mainGatesRes.rows.length) throw new Error("Main gates category not found");
    const mainGatesId = mainGatesRes.rows[0].id;

    // Get media assets for subcategories
    const mediaRes = await db.query(`
      select id, public_id from public.media_assets
      where public_id in (
        'smart-fabrication/development/steel-gate-album/royal-ss-304-mirror-walnut-gate',
        'smart-fabrication/development/pipe-gates/contemporary-iron-pipe-gate',
        'smart-fabrication/development/steel-gate-album/luxury-champagne-gold-laser-cut-ss-gate',
        'smart-fabrication/development/steel-gate-album/architectural-ss-ms-sliding-gate',
        'smart-fabrication/development/demo-stock/ss-glass-railing',
        'smart-fabrication/development/demo-stock/window-safety-grill',
        'smart-fabrication/development/demo-stock/rolling-shutter',
        'smart-fabrication/development/demo-stock/peb-warehouse-shed',
        'smart-fabrication/development/demo-stock/steel-security-door'
      )
    `);
    const mediaMap = new Map(mediaRes.rows.map(r => [r.public_id, r.id]));

    // Step 3: Insert Subcategories under Main Gates
    const subcategories = [
      {
        slug: 'steel-gates',
        name: 'Stainless Steel (SS 304) Gates',
        parent_id: mainGatesId,
        sort_order: 1,
        image_media_id: mediaMap.get('smart-fabrication/development/steel-gate-album/royal-ss-304-mirror-walnut-gate')
      },
      {
        slug: 'iron-pipe-gates',
        name: 'Iron Pipe Gates',
        parent_id: mainGatesId,
        sort_order: 2,
        image_media_id: mediaMap.get('smart-fabrication/development/pipe-gates/contemporary-iron-pipe-gate')
      },
      {
        slug: 'laser-cut-gates',
        name: 'CNC Laser Cut Gates',
        parent_id: mainGatesId,
        sort_order: 3,
        image_media_id: mediaMap.get('smart-fabrication/development/steel-gate-album/luxury-champagne-gold-laser-cut-ss-gate')
      },
      {
        slug: 'sliding-gates',
        name: 'Sliding & Motorized Gates',
        parent_id: mainGatesId,
        sort_order: 4,
        image_media_id: mediaMap.get('smart-fabrication/development/steel-gate-album/architectural-ss-ms-sliding-gate')
      }
    ];

    const subcategoryMap = new Map();
    for (const sub of subcategories) {
      const { rows } = await db.query(
        `insert into public.categories (id, name, slug, parent_id, active, sort_order, image_media_id)
         values ($1, $2, $3, $4, true, $5, $6)
         on conflict (slug) do update set
           name = excluded.name,
           parent_id = excluded.parent_id,
           active = true,
           sort_order = excluded.sort_order,
           image_media_id = coalesce(excluded.image_media_id, public.categories.image_media_id)
         returning id, slug`,
        [crypto.randomUUID(), sub.name, sub.slug, sub.parent_id, sub.sort_order, sub.image_media_id]
      );
      subcategoryMap.set(sub.slug, rows[0].id);
      console.log(`Subcategory active: ${sub.name} (${rows[0].id})`);
    }

    // Step 4: Map products to appropriate subcategories
    const productMappings = [
      // Stainless Steel Gates
      { sku: 'GATE-STEEL-001', subcategorySlug: 'steel-gates' },
      { sku: 'GATE-STEEL-004', subcategorySlug: 'steel-gates' },

      // Iron Pipe Gates
      { sku: 'GATE-PIPE-001', subcategorySlug: 'iron-pipe-gates' },
      { sku: 'GATE-PIPE-003', subcategorySlug: 'iron-pipe-gates' },

      // CNC Laser Cut Gates
      { sku: 'GATE-MS-001', subcategorySlug: 'laser-cut-gates' },
      { sku: 'GATE-STEEL-003', subcategorySlug: 'laser-cut-gates' },

      // Sliding Gates
      { sku: 'GATE-STEEL-002', subcategorySlug: 'sliding-gates' },
      { sku: 'GATE-PIPE-002', subcategorySlug: 'sliding-gates' },
    ];

    for (const m of productMappings) {
      const subId = subcategoryMap.get(m.subcategorySlug);
      if (subId) {
        await db.query(
          `update public.products set category_id = $1 where sku = $2`,
          [subId, m.sku]
        );
        console.log(`Mapped product ${m.sku} to subcategory ${m.subcategorySlug}`);
      }
    }

    // Step 5: Balance Homepage Featured Designs across categories
    console.log('5. Balancing homepage featured products across categories...');
    await db.query(`update public.products set featured = false`);
    const featuredSkus = [
      'GATE-STEEL-001',   // Royal SS 304 Mirror & Walnut Double Swing Gate (Steel Gate)
      'GATE-PIPE-001',    // Contemporary Iron Tubular Pipe Swing Gate (Pipe Gate)
      'RAIL-SS-002',      // SS 304 Toughened Glass Balcony Railing (Railing)
      'GRILL-MS-003',     // Modern Geometrical Window Safety Grill (Window Grill)
      'SHUTTER-GI-004',   // Motorized Galvanized Steel Rolling Shutter (Rolling Shutter)
      'SHED-IND-005'      // Industrial PEB Factory & Warehouse Shed (Shed)
    ];
    for (const sku of featuredSkus) {
      await db.query(`update public.products set featured = true where sku = $1`, [sku]);
    }
    console.log('Homepage featured products balanced.');

    console.log('SUCCESS: Category and Subcategory hierarchy established in PostgreSQL!');
  } finally {
    await db.end();
  }
}

main().catch(err => {
  console.error('Failed to setup categories hierarchy:', err);
  process.exit(1);
});
