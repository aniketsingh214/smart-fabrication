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

const pinsRaw = JSON.parse(fs.readFileSync('scripts/modern-steel-railings-pins.json', 'utf8'));
console.log(`Loaded ${pinsRaw.length} modern steel railing pins from Pinterest.`);

const modernRailingStyles = [
  'Modern Minimalist SS 304 Pipe Balcony Railing',
  'Architectural Glass & Stainless Steel Balustrade',
  'Contemporary Villa Terrace SS 304 Railing',
  'Heavy-Duty Stainless Steel Tubular Handrail',
  'Satin Hairline Brushed SS Balcony Railing',
  'Modern Geometric SS Square Pipe Railing',
  'Luxury Spindle Stainless Steel Staircase Railing',
  'Frameless Toughened Glass & SS Spigot Railing',
  'Designer Horizontal 4-Line SS Balcony Railing',
  'Contemporary Dual-Tone Matte & Gloss SS Railing',
  'Modern Residential SS Stair Flight Handrail',
  'Premium Grade 304 Exterior Veranda Railing',
  'Minimalist Circular Hollow Section SS Railing',
  'Modern Industrial Stainless Steel Deck Railing',
  'Bespoke Curved Architectural SS Handrail System',
  'High-Polish Mirror Chrome SS Balustrade System',
  'Modern Slotted Stainless Steel Perimeter Railing',
  'Modular SS 304 Interlocking Stair Balustrade',
  'Urban Loft Stainless Steel & Glass Railing',
  'Heavy-Gauge Corrosion-Proof SS Balcony Railing'
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

function getRailingSubcategory(title, pin) {
  const text = (title + ' ' + (pin.description || '')).toLowerCase();
  if (text.includes('glass') || text.includes('toughened') || text.includes('crystal') || text.includes('frameless')) {
    return 'glass-ss-railings';
  }
  if (text.includes('stair') || text.includes('stairs') || text.includes('handrail') || text.includes('flight') || text.includes('step') || text.includes('spiral')) {
    return 'staircase-handrails';
  }
  if (text.includes('balcony') || text.includes('terrace') || text.includes('porch') || text.includes('veranda') || text.includes('deck')) {
    return 'ss-balcony-railings';
  }
  return 'modern-pipe-railings';
}

async function uploadToCloudinary(pin, pinId, targetSubSlug, title, sku) {
  const publicId = `smart-fabrication/development/modern-steel-railings/item-${pinId}`;
  const urlsToTry = [
    pin.imgUrl,
    pin.imgUrl.replace('/originals/', '/736x/'),
    pin.imgUrl.replace('/originals/', '/474x/')
  ];

  let lastError = null;
  for (const url of urlsToTry) {
    try {
      const res = await cloudinary.uploader.upload(url, {
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        timeout: 25000,
        tags: ['smartfabrication', targetSubSlug, 'railing', 'modern-steel-railing'],
        context: {
          title,
          sku
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
  console.log('   PostgreSQL connected successfully.');

  try {
    const ownerRes = await db.query(`select user_id from public.user_roles where role_id = 'owner' limit 1`);
    const ownerId = ownerRes.rows[0]?.user_id;

    const defaultMaterialRes = await db.query(`select id from public.materials where active = true limit 1`);
    const defaultMaterialId = defaultMaterialRes.rows[0]?.id;

    // Ensure Categories & Subcategories
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
    categoryMap.set('railings', railingsId);

    for (const sub of railingSubDefs) {
      const checkSub = await db.query(`select id from public.categories where slug = $1`, [sub.slug]);
      let subId;
      if (checkSub.rows.length > 0) {
        subId = checkSub.rows[0].id;
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
    console.log('Categories ready:', Array.from(categoryMap.keys()).join(', '));

    console.log('2. Pre-caching existing media and products to minimize DB roundtrips...');
    const allMediaRes = await db.query(`select id, public_id from public.media_assets`);
    // Map by item hash (last 6 hex characters of public_id)
    const mediaByHash = new Map();
    for (const row of allMediaRes.rows) {
      const m = row.public_id.match(/item-([a-f0-9]{6})/);
      if (m) {
        mediaByHash.set(m[1], row.id);
      }
    }

    const allProductMediaRes = await db.query(`select product_id, media_id from public.product_media`);
    const productByMediaId = new Map(allProductMediaRes.rows.map(r => [r.media_id, r.product_id]));

    console.log(`   Found ${mediaByHash.size} existing cached media assets and ${productByMediaId.size} product media links.`);

    console.log(`3. Processing ${pinsRaw.length} pins...`);

    let uploadedCount = 0;
    let reusedCount = 0;
    let createdProducts = 0;
    let updatedProducts = 0;
    let failedCount = 0;

    for (let idx = 0; idx < pinsRaw.length; idx++) {
      const pin = pinsRaw[idx];
      const pinId = crypto.createHash('md5').update(pin.imgUrl).digest('hex').slice(0, 6);
      const title = cleanTitle(pin, idx, modernRailingStyles, 'Modern Railing');
      const subSlug = getRailingSubcategory(title, pin);
      const targetCategoryId = categoryMap.get(subSlug) || railingsId;
      const sku = `RLG-MODERN-${String(idx + 1).padStart(3, '0')}`;
      const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = `railing-ss-${cleanSlug.slice(0, 42)}-${pinId}`;

      let material = 'Stainless Steel 304 (50mm Top Handrail + 38mm Vertical Baluster Posts)';
      let finish = 'Architectural Satin Hairline Polish';
      let price_min_minor = 1400000 + (idx % 6) * 250000; // ₹14,000 - ₹26,500 (per 10ft standard section)

      if (subSlug === 'glass-ss-railings') {
        material = 'SS 304 Heavy Spigots / Top Rail + 12mm Toughened Clear Safety Glass';
        finish = 'High-Polish Mirror Chrome SS 304';
        price_min_minor = 2200000 + (idx % 5) * 300000;
      } else if (subSlug === 'staircase-handrails') {
        material = 'Stainless Steel 304 Ergonomic Pipe Handrail with CNC Laser Wall Mount Brackets';
        finish = 'Satin Hairline Brushed Finish';
        price_min_minor = 1200000 + (idx % 6) * 200000;
      } else if (subSlug === 'ss-balcony-railings') {
        material = 'Stainless Steel 304 Balcony Guardrail with Multi-Tier Safety Horizontal Pipes';
        finish = 'Electropolished Mirror Finish';
        price_min_minor = 1600000 + (idx % 5) * 250000;
      }

      const weight_kg = 35 + (idx % 5) * 6;
      const price_max_minor = price_min_minor * 2;
      const description = `${title}. Precision engineered modern stainless steel railing system designed for durability, rust-proof longevity, and architectural aesthetics. Fabricated with ${material} and finished with ${finish}.`;

      console.log(`[${idx + 1}/${pinsRaw.length}] [${sku}] ${title}`);

      try {
        // Step A: Find or Upload Media
        let mediaId = mediaByHash.get(pinId);

        if (mediaId) {
          reusedCount++;
          console.log(`   -> Reusing media asset (${mediaId})`);
        } else {
          const uploadRes = await uploadToCloudinary(pin, pinId, subSlug, title, sku);
          const intentId = crypto.randomUUID();
          const assetId = crypto.randomUUID();

          await db.query(
            `insert into public.upload_intents (id, owner_user_id, public_id, context, visibility, resource_type, confirmed_at, expires_at)
             values ($1, $2, $3, 'product', 'public', 'image', now(), now() + interval '10 years')
             on conflict (public_id) do update set context = 'product', visibility = 'public', confirmed_at = now()`,
            [intentId, ownerId, uploadRes.public_id]
          );

          const insertMedia = await db.query(
            `insert into public.media_assets (id, asset_id, public_id, resource_type, format, bytes, width, height, owner_user_id, context, visibility)
             values ($1, $2, $3, 'image', $4, $5, $6, $7, $8, 'product', 'public')
             returning id`,
            [assetId, uploadRes.asset_id || crypto.randomUUID(), uploadRes.public_id, uploadRes.format, uploadRes.bytes, uploadRes.width, uploadRes.height, ownerId]
          );
          mediaId = insertMedia.rows[0].id;
          mediaByHash.set(pinId, mediaId);
          uploadedCount++;
          console.log(`   -> Uploaded to Cloudinary (${uploadRes.public_id})`);
        }

        // Step B: Product Upsert
        let prodId = productByMediaId.get(mediaId);

        if (prodId) {
          await db.query(
            `update public.products
             set status = 'published', featured = true, custom_size = true,
                 delivery_availability = 'available', installation_availability = 'available'
             where id = $1`,
            [prodId]
          );
          updatedProducts++;
          console.log(`   -> Updated existing product (${prodId})`);
        } else {
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
              title, sku, slug, targetCategoryId, description,
              material, finish, weight_kg, `RLG-MOD-${pinId}`,
              'Custom engineered according to site opening and architectural layout.',
              price_min_minor, price_max_minor
            ]
          );
          prodId = prodRes.rows[0].id;
          productByMediaId.set(mediaId, prodId);

          // Product Media
          await db.query(`delete from public.product_media where product_id = $1`, [prodId]);
          await db.query(
            `insert into public.product_media (product_id, media_id, alt_text, sort_order)
             values ($1, $2, $3, 0)`,
            [prodId, mediaId, title]
          );

          // Product Variants
          await db.query(
            `insert into public.product_variants(product_id, name, sku, width_mm, height_mm, colour, finish, price_min_minor, price_max_minor, status)
             values
               ($1, 'Standard Balcony (10 Rft Section)', $2 || '-V1', 3048, 1066, 'Polished Chrome / Satin', 'Architectural SS 304', $3, $4, 'published'),
               ($1, 'Staircase Flight Section (12 Rft)', $2 || '-V2', 3657, 914, 'Polished Chrome / Satin', 'Architectural SS 304', $3 * 1.2, $4 * 1.2, 'published'),
               ($1, 'Extended Terrace Section (20 Rft)', $2 || '-V3', 6096, 1066, 'Polished Chrome / Satin', 'Architectural SS 304', $3 * 1.9, $4 * 1.9, 'published')
             on conflict do nothing`,
            [prodId, sku, price_min_minor, price_max_minor]
          );

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

          createdProducts++;
          console.log(`   -> Created new product [${sku}] ${title}`);
        }

        // Gallery Item
        const galleryCheck = await db.query(`select id from public.gallery_items where media_id = $1 limit 1`, [mediaId]);
        if (galleryCheck.rows.length === 0) {
          await db.query(
            `insert into public.gallery_items(id, name, media_id, alt_text, category_id, consent_confirmed, status)
             values($1, $2, $3, $4, $5, true, 'published')`,
            [crypto.randomUUID(), title, mediaId, title, targetCategoryId]
          );
        }
      } catch (err) {
        failedCount++;
        console.error(`   -> Error processing [${sku}] ${title}:`, err.message);
      }
    }

    console.log(`\n========================================`);
    console.log(`MODERN STEEL RAILINGS INGESTION COMPLETE!`);
    console.log(`Total Pins Processed: ${pinsRaw.length}`);
    console.log(`New Cloudinary Uploads: ${uploadedCount}`);
    console.log(`Reused Existing Media: ${reusedCount}`);
    console.log(`New Products Created: ${createdProducts}`);
    console.log(`Existing Products Updated: ${updatedProducts}`);
    console.log(`Failed Items: ${failedCount}`);
    console.log(`========================================\n`);
  } finally {
    await db.end();
  }
}

main().catch(console.error);
