import fs from 'node:fs';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { databaseClient } from './db-client.mjs';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const steelGatesRaw = JSON.parse(fs.readFileSync('scripts/steel-gates-search-pins.json', 'utf8'));
const steelRailingsRaw = JSON.parse(fs.readFileSync('scripts/steel-railings-search-pins.json', 'utf8'));

console.log(`Loaded ${steelGatesRaw.length} steel gates and ${steelRailingsRaw.length} steel railings.`);

const gateStyles = [
  'Royal SS 304 Architectural Double Swing',
  'Contemporary Hairline Brushed Driveway',
  'Minimalist Geometric Stainless Steel Box',
  'Luxury Laser-Infused Villa Main',
  'Modern Horizontal Slotted Stainless',
  'Monumental Compound Stately Stainless',
  'Bespoke PVD Gold Accented SS 304',
  'Architectural Satin Polish Motorized Sliding',
  'Heavy-Duty Stainless Steel Perimeter Estate',
  'Artisan Spindle Infill Stainless Double'
];

const railingStyles = [
  'Modern Stainless Steel 304 Balcony',
  'Architectural Glass & SS Top-Mount',
  'Minimalist Horizontal Rod Staircase',
  'Contemporary Villa Terrace Boundary',
  'Heavy-Duty SS Tubular Handrail',
  'Satin Brushed Floating Glass Balustrade',
  'Geometric Square-Bar Exterior Balcony',
  'Luxury Spindle Stainless Stair Flight',
  'Corrosion-Resistant SS 304 Deck',
  'Bespoke Curved Stainless Steel Staircase'
];

function cleanTitle(pin, index, fallbackStyles, fallbackSuffix) {
  let title = (pin.title || '').trim();
  title = title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  const asciiCount = (title.match(/[a-zA-Z0-9]/g) || []).length;
  if (asciiCount < 4) {
    title = '';
  }

  if (!title || title.length < 5) {
    const style = fallbackStyles[index % fallbackStyles.length];
    title = `${style} ${fallbackSuffix} ${index + 1}`;
  }

  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (title.length > 72) {
    title = title.slice(0, 69).trim() + '...';
  }
  return title;
}

function prepareGates() {
  return steelGatesRaw.map((pin, idx) => {
    const title = cleanTitle(pin, idx, gateStyles, 'Gate');
    const idHash = crypto.createHash('md5').update(pin.imgUrl).digest('hex').slice(0, 6);
    const sku = `GATE-STL-${String(idx + 1).padStart(3, '0')}`;
    const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `gate-ss-${cleanSlug.slice(0, 42)}-${idHash}`;

    const material = 'Stainless Steel 304 (Grade A) Heavy Gauge Tubes & Sheet Infill';
    const finish = 'Satin Hairline Brushed Finish with Mirror Polish Trims';
    const weight_kg = 185 + (idx % 6) * 15;
    const price_min_minor = 4400000 + (idx % 7) * 450000; // ₹44,000 - ₹71,000
    const price_max_minor = price_min_minor * 2 + 500000;

    const description = `${title}. Fabricated using certified SS 304 food-grade stainless steel with superior anti-rust corrosion resistance. Includes heavy-duty pivot bearings, ground drop bolts, and stainless lock housing.`;

    return {
      type: 'gate',
      index: idx + 1,
      pinId: idHash,
      title,
      sku,
      slug,
      targetSubSlug: 'steel-gates',
      material,
      finish,
      weight_kg,
      price_min_minor,
      price_max_minor,
      description,
      imgUrl: pin.imgUrl,
      cloudinaryFolder: 'smart-fabrication/development/steel-gates-search'
    };
  });
}

function getRailingSubcategory(title, pin) {
  const text = (title + ' ' + (pin.description || '')).toLowerCase();
  if (text.includes('glass') || text.includes('toughened')) {
    return 'glass-ss-railings';
  }
  if (text.includes('stair') || text.includes('stairs') || text.includes('handrail') || text.includes('flight')) {
    return 'staircase-handrails';
  }
  if (text.includes('balcony') || text.includes('terrace')) {
    return 'ss-balcony-railings';
  }
  return 'modern-pipe-railings';
}

function prepareRailings() {
  return steelRailingsRaw.map((pin, idx) => {
    const title = cleanTitle(pin, idx, railingStyles, 'Railing');
    const subSlug = getRailingSubcategory(title, pin);
    const idHash = crypto.createHash('md5').update(pin.imgUrl).digest('hex').slice(0, 6);

    const prefix = subSlug === 'glass-ss-railings' ? 'GLS' :
                   subSlug === 'staircase-handrails' ? 'STR' :
                   subSlug === 'ss-balcony-railings' ? 'BAL' : 'MOD';

    const sku = `RLG-${prefix}-${String(idx + 1).padStart(3, '0')}`;
    const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `railing-ss-${cleanSlug.slice(0, 42)}-${idHash}`;

    let material = 'Stainless Steel 304 (50mm Top Handrail + 38mm Vertical Baluster Posts)';
    let finish = 'Architectural Satin Hairline Polish';
    if (subSlug === 'glass-ss-railings') {
      material = 'SS 304 Heavy Spigots / Top Rail + 12mm Toughened Clear Safety Glass';
      finish = 'High-Polish Mirror Chrome SS 304';
    }

    const weight_kg = 35 + (idx % 5) * 6;
    const price_min_minor = 1400000 + (idx % 6) * 250000; // ₹14,000 - ₹26,500 (per 10ft standard section)
    const price_max_minor = price_min_minor * 2;

    const description = `${title}. Engineered for residential and commercial architectural installations. Made with ${material} and finished in ${finish} for complete weather resistance.`;

    return {
      type: 'railing',
      index: idx + 1,
      pinId: idHash,
      title,
      sku,
      slug,
      targetSubSlug: subSlug,
      material,
      finish,
      weight_kg,
      price_min_minor,
      price_max_minor,
      description,
      imgUrl: pin.imgUrl,
      cloudinaryFolder: 'smart-fabrication/development/steel-railings'
    };
  });
}

async function uploadToCloudinary(item) {
  const publicId = `${item.cloudinaryFolder}/item-${item.pinId}`;
  const urlsToTry = [
    item.imgUrl,
    item.imgUrl.replace('/originals/', '/736x/'),
    item.imgUrl.replace('/originals/', '/474x/')
  ];

  let lastError = null;
  for (const url of urlsToTry) {
    try {
      const res = await cloudinary.uploader.upload(url, {
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        tags: ['smartfabrication', item.targetSubSlug, item.type],
        context: {
          title: item.title,
          sku: item.sku
        }
      });
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function main() {
  console.log('1. Connecting to PostgreSQL...');
  const db = databaseClient();
  await db.connect();

  try {
    const ownerRes = await db.query(`select user_id from public.user_roles where role_id = 'owner' limit 1`);
    const ownerId = ownerRes.rows[0]?.user_id;

    const defaultMaterialRes = await db.query(`select id from public.materials where active = true limit 1`);
    const defaultMaterialId = defaultMaterialRes.rows[0]?.id;

    // 2. Setup Category: Main Gates & Steel Gates
    const mainGatesCat = await db.query(`select id from public.categories where slug = 'main-gates' limit 1`);
    const mainGatesId = mainGatesCat.rows[0]?.id;

    const steelGatesCat = await db.query(`select id from public.categories where slug = 'steel-gates' limit 1`);
    const steelGatesId = steelGatesCat.rows[0]?.id;

    // 3. Setup Category: Stair & Balcony Railings & its Subcategories
    let railingsCat = await db.query(`select id from public.categories where slug = 'railings' limit 1`);
    let railingsId = railingsCat.rows[0]?.id;
    if (!railingsId) {
      const ins = await db.query(
        `insert into public.categories(id, name, slug, parent_id, active, sort_order)
         values($1, 'Stair & Balcony Railings', 'railings', null, true, 3)
         returning id`,
        [crypto.randomUUID()]
      );
      railingsId = ins.rows[0].id;
    }

    const railingSubDefs = [
      { name: 'Stainless Steel (SS 304) Balcony Railings', slug: 'ss-balcony-railings', sort: 1 },
      { name: 'Glass & Stainless Steel Railings', slug: 'glass-ss-railings', sort: 2 },
      { name: 'Staircase SS Handrails & Balusters', slug: 'staircase-handrails', sort: 3 },
      { name: 'Modern Minimalist Pipe Railings', slug: 'modern-pipe-railings', sort: 4 }
    ];

    const categoryMap = new Map();
    categoryMap.set('main-gates', mainGatesId);
    categoryMap.set('steel-gates', steelGatesId);
    categoryMap.set('railings', railingsId);

    for (const sub of railingSubDefs) {
      const checkSub = await db.query(`select id from public.categories where slug = $1`, [sub.slug]);
      let subId;
      if (checkSub.rows.length > 0) {
        subId = checkSub.rows[0].id;
        await db.query(`update public.categories set parent_id = $1, active = true where id = $2`, [railingsId, subId]);
      } else {
        const ins = await db.query(
          `insert into public.categories(id, name, slug, parent_id, active, sort_order)
           values($1, $2, $3, $4, true, $5)
           returning id`,
          [crypto.randomUUID(), sub.name, sub.slug, railingsId, sub.sort]
        );
        subId = ins.rows[0].id;
      }
      categoryMap.set(sub.slug, subId);
    }
    console.log('Categories & Subcategories ready for Steel Gates and Railings.');

    const allItems = [...prepareGates(), ...prepareRailings()];
    console.log(`2. Starting upload & registration for ${allItems.length} designs (${steelGatesRaw.length} Gates + ${steelRailingsRaw.length} Railings)...`);

    let completed = 0;
    let failed = 0;

    for (const item of allItems) {
      const targetCategoryId = categoryMap.get(item.targetSubSlug) || (item.type === 'gate' ? steelGatesId : railingsId);

      try {
        console.log(`[${completed + failed + 1}/${allItems.length}] Uploading ${item.title}...`);
        const uploadRes = await uploadToCloudinary(item);

        const intentId = crypto.randomUUID();
        const assetId = crypto.randomUUID();

        await db.query(
          `insert into public.upload_intents (id, owner_user_id, public_id, context, visibility, resource_type, confirmed_at, expires_at)
           values ($1, $2, $3, 'product', 'public', 'image', now(), now() + interval '10 years')
           on conflict (public_id) do update set context = 'product', visibility = 'public', confirmed_at = now()`,
          [intentId, ownerId, uploadRes.public_id]
        );

        let mediaId;
        const existingMedia = await db.query(`select id from public.media_assets where public_id = $1`, [uploadRes.public_id]);
        if (existingMedia.rows.length > 0) {
          mediaId = existingMedia.rows[0].id;
          await db.query(
            `update public.media_assets
             set width = $1, height = $2, bytes = $3, format = $4, context = 'product', visibility = 'public'
             where id = $5`,
            [uploadRes.width, uploadRes.height, uploadRes.bytes, uploadRes.format, mediaId]
          );
        } else {
          const insertMedia = await db.query(
            `insert into public.media_assets (id, asset_id, public_id, resource_type, format, bytes, width, height, owner_user_id, context, visibility)
             values ($1, $2, $3, 'image', $4, $5, $6, $7, $8, 'product', 'public')
             returning id`,
            [assetId, uploadRes.asset_id || crypto.randomUUID(), uploadRes.public_id, uploadRes.format, uploadRes.bytes, uploadRes.width, uploadRes.height, ownerId]
          );
          mediaId = insertMedia.rows[0].id;
        }

        // Product
        const prodRes = await db.query(
          `insert into public.products(
             name, sku, slug, category_id, description, material, finish,
             weight_kg, design_code, design_details, price_min_minor, price_max_minor,
             custom_size, featured, delivery_availability, installation_availability, status
           )
           values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, true, 'available', 'available', 'published')
           on conflict (sku) do update set
             name = excluded.name,
             slug = excluded.slug,
             category_id = excluded.category_id,
             description = excluded.description,
             material = excluded.material,
             finish = excluded.finish,
             weight_kg = excluded.weight_kg,
             design_code = excluded.design_code,
             design_details = excluded.design_details,
             price_min_minor = excluded.price_min_minor,
             price_max_minor = excluded.price_max_minor,
             custom_size = true,
             featured = true,
             status = 'published'
           returning id`,
          [
            item.title, item.sku, item.slug, targetCategoryId, item.description,
            item.material, item.finish, item.weight_kg, `${item.type.toUpperCase()}-${item.pinId}`,
            'Custom engineered according to site opening and architectural layout.',
            item.price_min_minor, item.price_max_minor
          ]
        );
        const prodId = prodRes.rows[0].id;

        // Product media
        await db.query(`delete from public.product_media where product_id = $1`, [prodId]);
        await db.query(
          `insert into public.product_media (product_id, media_id, alt_text, sort_order)
           values ($1, $2, $3, 0)`,
          [prodId, mediaId, item.title]
        );

        // Variants
        if (item.type === 'gate') {
          await db.query(
            `insert into public.product_variants(product_id, name, sku, width_mm, height_mm, colour, finish, price_min_minor, price_max_minor, status)
             values
               ($1, 'Standard Villa Opening (10ft x 6ft)', $2 || '-V1', 3048, 1828, 'Satin Brushed Silver', 'Hairline Finish', $3, $4, 'published'),
               ($1, 'Compact Single Wicket (4ft x 7ft)', $2 || '-V2', 1219, 2133, 'Satin Brushed Silver', 'Hairline Finish', $3 * 0.7, $4 * 0.7, 'published'),
               ($1, 'Grand Estate Compound (14ft x 8ft)', $2 || '-V3', 4267, 2438, 'Satin Brushed Silver', 'Hairline Finish', $3 * 1.5, $4 * 1.5, 'published')
             on conflict do nothing`,
            [prodId, item.sku, item.price_min_minor, item.price_max_minor]
          );
        } else {
          await db.query(
            `insert into public.product_variants(product_id, name, sku, width_mm, height_mm, colour, finish, price_min_minor, price_max_minor, status)
             values
               ($1, 'Standard Balcony (10 Rft Section)', $2 || '-V1', 3048, 1066, 'Polished Chrome / Satin', 'Architectural SS 304', $3, $4, 'published'),
               ($1, 'Staircase Flight Section (12 Rft)', $2 || '-V2', 3657, 914, 'Polished Chrome / Satin', 'Architectural SS 304', $3 * 1.2, $4 * 1.2, 'published'),
               ($1, 'Extended Terrace Section (20 Rft)', $2 || '-V3', 6096, 1066, 'Polished Chrome / Satin', 'Architectural SS 304', $3 * 1.9, $4 * 1.9, 'published')
             on conflict do nothing`,
            [prodId, item.sku, item.price_min_minor, item.price_max_minor]
          );
        }

        // BOM & Rules
        if (defaultMaterialId) {
          const existingBom = await db.query(
            `select id from public.bom_versions where product_id = $1 and status = 'published' limit 1`,
            [prodId]
          );

          if (existingBom.rows.length === 0) {
            const bomRes = await db.query(
              `insert into public.bom_versions(product_id, version, status)
               values($1, 1, 'draft')
               on conflict (product_id, version) do nothing
               returning id`,
              [prodId]
            );
            if (bomRes.rows.length > 0) {
              const bomId = bomRes.rows[0].id;
              await db.query(`delete from public.bom_items where bom_id = $1`, [bomId]);
              await db.query(
                `insert into public.bom_items(bom_id, material_id, quantity_per_sq_m, wastage_percent, customer_visible)
                 values($1, $2, 5.0, 6, true)`,
                [bomId, defaultMaterialId]
              );
              await db.query(`update public.bom_versions set status = 'published' where id = $1`, [bomId]);
            }

            const ruleRes = await db.query(
              `insert into public.calculation_rules(
                 product_id, version, labour_minor_per_sq_m, finish_minor_per_sq_m,
                 hardware_minor, delivery_minor, installation_minor, margin_bps, range_percent, status
               )
               values($1, 1, 80000, 40000, 200000, 150000, 180000, 1500, 10, 'draft')
               on conflict (product_id, version) do nothing
               returning id`,
              [prodId]
            );
            if (ruleRes.rows.length > 0) {
              await db.query(`update public.calculation_rules set status = 'published' where id = $1`, [ruleRes.rows[0].id]);
            }
          }
        }

        // Gallery item
        const galleryCheck = await db.query(`select id from public.gallery_items where name = $1`, [item.title]);
        if (galleryCheck.rows.length === 0) {
          await db.query(
            `insert into public.gallery_items(id, name, media_id, alt_text, category_id, consent_confirmed, status)
             values($1, $2, $3, $4, $5, true, 'published')`,
            [crypto.randomUUID(), item.title, mediaId, item.title, targetCategoryId]
          );
        }

        completed++;
        console.log(`(${completed}/${allItems.length}) Successfully registered: [${item.sku}] ${item.title}`);
      } catch (err) {
        failed++;
        console.error(`Failed item ${item.title}:`, err.message);
      }
    }

    console.log(`\n========================================`);
    console.log(`GATES AND RAILINGS INGESTION COMPLETE!`);
    console.log(`Total: ${allItems.length}`);
    console.log(`Completed: ${completed}`);
    console.log(`Failed: ${failed}`);
    console.log(`========================================`);
  } finally {
    await db.end();
  }
}

main().catch(console.error);
