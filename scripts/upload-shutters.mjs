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

const pinsRaw = JSON.parse(fs.readFileSync('scripts/prepared-shutters.json', 'utf8'));
console.log(`Loaded ${pinsRaw.length} shutter pins.`);

const shutterStyles = [
  'Heavy-Duty Motorized Commercial Rolling Shutter',
  'Galvanized Steel Industrial Warehouse Shutter',
  'Precision Perforated Showroom Display Shutter',
  'High-Security MS Shop Front Rolling Shutter',
  'Automated Remote-Control Retail Store Shutter',
  'Interlocking Steel Grill Safety Rolling Shutter',
  'Corrosion-Resistant Powder Coated Shop Shutter',
  'Heavy-Gauge Wind-Resistant Industrial Shutter',
  'Contemporary Insulated Commercial Roller Door',
  'Bespoke Motorized Overhead Bay Shutter System',
  'Multi-Locking Commercial Storefront Shutter',
  'Transparent Polycarbonate & Steel Hybrid Shutter',
  'Manual Gear-Operated Heavy Duty Shutter',
  'Smooth-Glide Spring Assisted Commercial Shutter',
  'Heavy Structural Steel Compound Rolling Shutter'
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

function getShutterSubcategory(title, pin) {
  const text = (title + ' ' + (pin.description || '')).toLowerCase();
  if (text.includes('motor') || text.includes('remote') || text.includes('electric') || text.includes('automat')) {
    return 'motorized-rolling-shutters';
  }
  if (text.includes('perforated') || text.includes('grill') || text.includes('see-through') || text.includes('transparent') || text.includes('vision') || text.includes('polycarbonate')) {
    return 'perforated-rolling-shutters';
  }
  if (text.includes('industrial') || text.includes('warehouse') || text.includes('factory') || text.includes('overhead') || text.includes('heavy')) {
    return 'industrial-rolling-shutters';
  }
  return 'commercial-shop-shutters';
}

async function uploadToCloudinary(pin, pinId, targetSubSlug, title, sku) {
  const publicId = `smart-fabrication/development/commercial-shutters/item-${pinId}`;
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
        tags: ['smartfabrication', targetSubSlug, 'shutter', 'rolling-shutter'],
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

    // Ensure Parent Category: Commercial Rolling Shutters
    let shuttersCat = await db.query(`select id from public.categories where slug = 'rolling-shutters' limit 1`);
    let shuttersId = shuttersCat.rows[0]?.id;
    if (!shuttersId) {
      const ins = await db.query(
        `insert into public.categories(id, name, slug, parent_id, active, sort_order)
         values($1, 'Commercial Rolling Shutters', 'rolling-shutters', null, true, 4)
         returning id`,
        [crypto.randomUUID()]
      );
      shuttersId = ins.rows[0].id;
    }

    const shutterSubDefs = [
      { name: 'Commercial Shop & Storefront Rolling Shutters', slug: 'commercial-shop-shutters', sort: 1 },
      { name: 'Motorized & Remote Controlled Rolling Shutters', slug: 'motorized-rolling-shutters', sort: 2 },
      { name: 'Perforated & Grill See-Through Shutters', slug: 'perforated-rolling-shutters', sort: 3 },
      { name: 'Heavy-Duty Industrial & Warehouse Shutters', slug: 'industrial-rolling-shutters', sort: 4 }
    ];

    const categoryMap = new Map();
    categoryMap.set('rolling-shutters', shuttersId);

    for (const sub of shutterSubDefs) {
      const checkSub = await db.query(`select id from public.categories where slug = $1`, [sub.slug]);
      let subId;
      if (checkSub.rows.length > 0) {
        subId = checkSub.rows[0].id;
        await db.query(`update public.categories set parent_id = $1, active = true where id = $2`, [shuttersId, subId]);
      } else {
        const ins = await db.query(
          `insert into public.categories(id, name, slug, parent_id, active, sort_order)
           values($1, $2, $3, $4, true, $5)
           returning id`,
          [crypto.randomUUID(), sub.name, sub.slug, shuttersId, sub.sort]
        );
        subId = ins.rows[0].id;
      }
      categoryMap.set(sub.slug, subId);
    }
    console.log('Categories ready:', Array.from(categoryMap.keys()).join(', '));

    console.log('2. Pre-caching existing media and products...');
    const allMediaRes = await db.query(`select id, public_id from public.media_assets`);
    const mediaByHash = new Map();
    for (const row of allMediaRes.rows) {
      const m = row.public_id.match(/item-([a-f0-9]{6})/);
      if (m) {
        mediaByHash.set(m[1], row.id);
      }
    }

    const allProductMediaRes = await db.query(`select product_id, media_id from public.product_media`);
    const productByMediaId = new Map(allProductMediaRes.rows.map(r => [r.media_id, r.product_id]));

    console.log(`   Found ${mediaByHash.size} existing cached media assets.`);

    console.log(`3. Processing ${pinsRaw.length} pins...`);

    let uploadedCount = 0;
    let reusedCount = 0;
    let createdProducts = 0;
    let updatedProducts = 0;
    let failedCount = 0;

    for (let idx = 0; idx < pinsRaw.length; idx++) {
      const pin = pinsRaw[idx];
      const pinId = crypto.createHash('md5').update(pin.imgUrl).digest('hex').slice(0, 6);
      const title = cleanTitle(pin, idx, shutterStyles, 'Rolling Shutter');
      const subSlug = getShutterSubcategory(title, pin);
      const targetCategoryId = categoryMap.get(subSlug) || shuttersId;
      const sku = `SHT-COM-${String(idx + 1).padStart(3, '0')}`;
      const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = `shutter-${cleanSlug.slice(0, 42)}-${pinId}`;

      let material = 'High-Strength Cold-Rolled Galvanized Steel (GI) Interlocking Slats';
      let finish = 'Industrial Zinc Galvanized & Anti-Corrosion Primer';
      let price_min_minor = 1600000 + (idx % 6) * 150000; // ₹16,000 - ₹23,500 (standard 10x8ft shop opening)

      if (subSlug === 'motorized-rolling-shutters') {
        material = 'Galvanized Steel Slats with High-Torque AC Tubular Motor, Dual Wireless Remotes & Manual Chain Override';
        finish = 'Electrostatic Powder Coated Industrial Finish';
        price_min_minor = 3800000 + (idx % 5) * 400000; // ₹38,000 - ₹54,000
      } else if (subSlug === 'perforated-rolling-shutters') {
        material = 'CNC Punched Perforated High-Tensile Steel Slats for Continuous Showroom Visibility';
        finish = 'Premium Architectural Powder Coating';
        price_min_minor = 2200000 + (idx % 5) * 250000; // ₹22,000 - ₹32,000
      } else if (subSlug === 'industrial-rolling-shutters') {
        material = '16-Gauge Heavy Structural Galvanized Steel with Wind-Lock End Guides & Heavy C-Channels';
        finish = 'Hot-Dip Heavy Galvanized Finish';
        price_min_minor = 6500000 + (idx % 6) * 600000; // ₹65,000 - ₹95,000
      }

      const weight_kg = 85 + (idx % 6) * 20;
      const price_max_minor = price_min_minor * 2;
      const description = `${title}. Heavy-duty commercial fabrication rolling shutter engineered for retail shops, showrooms, industrial sheds, and commercial godowns. Fabricated with ${material} and finished with ${finish}. Includes side guide channels, bottom T-angle, heavy ball bearings, and high-tensile coil spring balance.`;

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
              material, finish, weight_kg, `SHT-${pinId}`,
              'Custom engineered according to storefront or warehouse bay opening dimensions.',
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
               ($1, 'Standard Retail Shop (10ft x 8ft)', $2 || '-V1', 3048, 2438, 'Galvanized Silver / Slate Grey', 'Zinc Primer Coated', $3, $4, 'published'),
               ($1, 'Wide Commercial Showroom (14ft x 10ft)', $2 || '-V2', 4267, 3048, 'Galvanized Silver / Slate Grey', 'Zinc Primer Coated', $3 * 1.4, $4 * 1.4, 'published'),
               ($1, 'Heavy Industrial Bay (18ft x 14ft)', $2 || '-V3', 5486, 4267, 'Galvanized Silver / Slate Grey', 'Heavy Industrial Coated', $3 * 2.2, $4 * 2.2, 'published')
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
                   values($1, $2, 8.5, 5, true)`,
                  [bomId, defaultMaterialId]
                );
                await db.query(`update public.bom_versions set status = 'published' where id = $1`, [bomId]);
              }

              const ruleRes = await db.query(
                `insert into public.calculation_rules(
                   product_id, version, labour_minor_per_sq_m, finish_minor_per_sq_m,
                   hardware_minor, delivery_minor, installation_minor, margin_bps, range_percent, status
                 )
                 values($1, 1, 95000, 35000, 250000, 200000, 250000, 1500, 10, 'draft')
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
    console.log(`COMMERCIAL SHUTTERS INGESTION COMPLETE!`);
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
