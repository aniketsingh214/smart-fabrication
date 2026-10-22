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

const rawPins = JSON.parse(fs.readFileSync('scripts/steel-grills-all-pins.json', 'utf8'));
console.log(`Loaded ${rawPins.length} steel grill pins from Pinterest search.`);

const descriptiveGrillStyles = [
  'Modern Geometric SS 304 Box',
  'Minimalist Horizontal Pipe',
  'Architectural Diamond Lattice',
  'Heavy-Duty French Window Safety',
  'Decorative Floral Wave Stainless',
  'Vertical Bar Anti-Burglary',
  'Contemporary Villa Balcony Safety',
  'Bespoke Cross-Hatch Security',
  'Linear Louvered Exterior',
  'Artisan Scrollwork Stainless Steel'
];

function cleanGrillTitle(pin, index) {
  let title = (pin.title || '').trim();
  title = title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  // Remove non-latin or weird characters if mostly non-ascii
  const asciiCount = (title.match(/[a-zA-Z0-9]/g) || []).length;
  if (asciiCount < 4) {
    title = '';
  }

  const lower = title.toLowerCase();
  if (!title || title.length < 5) {
    const style = descriptiveGrillStyles[index % descriptiveGrillStyles.length];
    title = `${style} Window Grill ${index + 1}`;
  }

  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (title.length > 70) {
    title = title.slice(0, 67).trim() + '...';
  }

  return title;
}

function getGrillSubcategory(title, pin) {
  const text = (title + ' ' + (pin.description || '')).toLowerCase();
  if (text.includes('laser') || text.includes('cnc') || text.includes('cutting')) {
    return 'laser-cut-grills';
  }
  if (text.includes('balcony') || text.includes('railing') || text.includes('terrace')) {
    return 'balcony-safety-grills';
  }
  if (text.includes('ss') || text.includes('stainless') || text.includes('304')) {
    return 'ss-window-grills';
  }
  return 'modern-window-grills';
}

function prepareGrill(pin, index) {
  const title = cleanGrillTitle(pin, index);
  const subSlug = getGrillSubcategory(title, pin);

  const prefix = subSlug === 'ss-window-grills' ? 'SSG' :
                 subSlug === 'modern-window-grills' ? 'MDG' :
                 subSlug === 'balcony-safety-grills' ? 'BLG' : 'LSG';

  const sku = `GRL-${prefix}-${String(index + 1).padStart(3, '0')}`;
  const cleanTitleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const idHash = crypto.createHash('md5').update(pin.imgUrl).digest('hex').slice(0, 6);
  const slug = `grill-${cleanTitleSlug.slice(0, 45)}-${idHash}`;

  let material = 'High-Grade Cold-Rolled Mild Steel Square Hollow Section (25x25mm) + Solid Spindles';
  let finish = 'Red Oxide Anti-Rust Primer + 2-Coat Matte Black Epoxy Enamel';
  let weight_kg = 28 + (index % 5) * 4;
  let price_min_minor = 450000 + (index % 5) * 80000; // ₹4,500 - ₹7,700
  let price_max_minor = price_min_minor * 2 + 200000;

  if (subSlug === 'ss-window-grills') {
    material = 'Stainless Steel 304 (Grade A) Hollow Pipes & Polished Solid Spindles';
    finish = 'High-Gloss Mirror Finish & Electro-Chemical Passivation';
    price_min_minor = 680000 + (index % 5) * 90000; // ₹6,800 - ₹10,400
    price_max_minor = price_min_minor * 2;
  } else if (subSlug === 'balcony-safety-grills') {
    material = 'Heavy-Duty 32mm Outer Box Frame with 16mm Square Safety Bars';
    finish = 'Electrostatic Architectural Powder Coating (Charcoal Grey)';
    price_min_minor = 580000 + (index % 4) * 75000; // ₹5,800 - ₹8,050
    price_max_minor = price_min_minor * 2;
  } else if (subSlug === 'laser-cut-grills') {
    material = '2.5mm CNC Laser Cut Steel Sheet Panel + 40mm Framing Tube';
    finish = 'Multi-Layer Polyurethane Coating with Metallic Accent Finish';
    price_min_minor = 850000;
    price_max_minor = 1650000;
  }

  const description = `${title}. Custom fabricated with precision using ${material}. Finished with ${finish} for superior rust resistance and exterior weather durability. Ready for direct masonry wall mounting or wooden frame anchoring.`;

  return {
    index: index + 1,
    pinId: idHash,
    title,
    sku,
    slug,
    subSlug,
    material,
    finish,
    weight_kg,
    price_min_minor,
    price_max_minor,
    description,
    imgUrl: pin.imgUrl
  };
}

const preparedGrills = rawPins.map(prepareGrill);

async function uploadImageToCloudinary(item) {
  const publicId = `smart-fabrication/development/steel-grills/grill-${item.pinId}`;
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
        tags: ['smartfabrication-steel-grills', item.subSlug, 'window-grills'],
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
    const ownerRes = await db.query(
      `select user_id from public.user_roles where role_id = 'owner' limit 1`
    );
    const ownerId = ownerRes.rows[0]?.user_id;

    // 1. Get or Create parent category: Safety Window Grills
    let parentCatRes = await db.query(
      `select id from public.categories where slug = 'window-grills' limit 1`
    );
    let parentCategoryId = parentCatRes.rows[0]?.id;
    if (!parentCategoryId) {
      const newParent = await db.query(
        `insert into public.categories(id, name, slug, parent_id, active, sort_order)
         values($1, 'Safety Window Grills', 'window-grills', null, true, 4)
         returning id`,
        [crypto.randomUUID()]
      );
      parentCategoryId = newParent.rows[0].id;
    }

    // 2. Setup Subcategories under window-grills
    const subcategoryDefs = [
      { name: 'Stainless Steel (SS 304) Window Grills', slug: 'ss-window-grills', sort: 1 },
      { name: 'Modern Box & Geometric Window Grills', slug: 'modern-window-grills', sort: 2 },
      { name: 'Balcony & Safety Boundary Grills', slug: 'balcony-safety-grills', sort: 3 },
      { name: 'CNC Laser Cut Window Grills', slug: 'laser-cut-grills', sort: 4 }
    ];

    const categoryMap = new Map();
    categoryMap.set('window-grills', parentCategoryId);

    for (const sub of subcategoryDefs) {
      const checkSub = await db.query(`select id from public.categories where slug = $1`, [sub.slug]);
      let subId;
      if (checkSub.rows.length > 0) {
        subId = checkSub.rows[0].id;
        await db.query(`update public.categories set parent_id = $1, active = true where id = $2`, [parentCategoryId, subId]);
      } else {
        const ins = await db.query(
          `insert into public.categories(id, name, slug, parent_id, active, sort_order)
           values($1, $2, $3, $4, true, $5)
           returning id`,
          [crypto.randomUUID(), sub.name, sub.slug, parentCategoryId, sub.sort]
        );
        subId = ins.rows[0].id;
      }
      categoryMap.set(sub.slug, subId);
    }
    console.log('Subcategories ready for Safety Window Grills.');

    const defaultMaterialRes = await db.query(
      `select id from public.materials where active = true limit 1`
    );
    const defaultMaterialId = defaultMaterialRes.rows[0]?.id;

    console.log(`2. Starting upload & registration for ${preparedGrills.length} steel grill designs...`);

    let completed = 0;
    let failed = 0;

    for (const item of preparedGrills) {
      const targetCategoryId = categoryMap.get(item.subSlug) || parentCategoryId;

      try {
        console.log(`[${completed + failed + 1}/${preparedGrills.length}] Uploading ${item.title}...`);
        const uploadRes = await uploadImageToCloudinary(item);

        // Upload Intent & Media Asset
        const intentId = crypto.randomUUID();
        const assetId = crypto.randomUUID();

        await db.query(
          `insert into public.upload_intents (id, owner_user_id, public_id, context, visibility, resource_type, confirmed_at, expires_at)
           values ($1, $2, $3, 'product', 'public', 'image', now(), now() + interval '10 years')
           on conflict (public_id) do update set confirmed_at = now()`,
          [intentId, ownerId, uploadRes.public_id]
        );

        const existingMedia = await db.query(
          `select id from public.media_assets where public_id = $1`,
          [uploadRes.public_id]
        );

        let mediaId;
        if (existingMedia.rows.length > 0) {
          mediaId = existingMedia.rows[0].id;
          await db.query(
            `update public.media_assets
             set width = $1, height = $2, bytes = $3, format = $4, resource_type = 'image', visibility = 'public'
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

        // Product Record
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
             delivery_availability = 'available',
             installation_availability = 'available',
             status = 'published'
           returning id`,
          [
            item.title, item.sku, item.slug, targetCategoryId, item.description,
            item.material, item.finish, item.weight_kg, `GRL-${item.pinId}`,
            'Custom welded to fit masonry opening. Masonry expansion anchor lugs provided.',
            item.price_min_minor, item.price_max_minor
          ]
        );
        const prodId = prodRes.rows[0].id;

        // Product Media link
        await db.query(`delete from public.product_media where product_id = $1`, [prodId]);
        await db.query(
          `insert into public.product_media (product_id, media_id, alt_text, sort_order)
           values ($1, $2, $3, 0)`,
          [prodId, mediaId, item.title]
        );

        // Product Variants
        await db.query(
          `insert into public.product_variants(product_id, name, sku, width_mm, height_mm, colour, finish, price_min_minor, price_max_minor, status)
           values
             ($1, 'Standard Bedroom Window (4ft x 4ft)', $2 || '-V1', 1219, 1219, 'Matte Black / Polished Silver', 'Protective Coating', $3, $4, 'published'),
             ($1, 'Compact Bathroom Vent (2.5ft x 2.5ft)', $2 || '-V2', 762, 762, 'Matte Black / Polished Silver', 'Protective Coating', $3 * 0.65, $4 * 0.65, 'published'),
             ($1, 'Large French / Bay Window (5ft x 5ft)', $2 || '-V3', 1524, 1524, 'Matte Black / Polished Silver', 'Protective Coating', $3 * 1.5, $4 * 1.5, 'published')
           on conflict do nothing`,
          [prodId, item.sku, item.price_min_minor, item.price_max_minor]
        );

        // BOM & Calculation Rules
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
                 values($1, $2, 4.0, 5, true)`,
                [bomId, defaultMaterialId]
              );
              await db.query(`update public.bom_versions set status = 'published' where id = $1`, [bomId]);
            }

            const ruleRes = await db.query(
              `insert into public.calculation_rules(
                 product_id, version, labour_minor_per_sq_m, finish_minor_per_sq_m,
                 hardware_minor, delivery_minor, installation_minor, margin_bps, range_percent, status
               )
               values($1, 1, 45000, 25000, 80000, 60000, 80000, 1500, 10, 'draft')
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
        const galleryCheck = await db.query(
          `select id from public.gallery_items where name = $1`,
          [item.title]
        );
        if (galleryCheck.rows.length === 0) {
          await db.query(
            `insert into public.gallery_items(id, name, media_id, alt_text, category_id, consent_confirmed, status)
             values($1, $2, $3, $4, $5, true, 'published')`,
            [crypto.randomUUID(), item.title, mediaId, item.title, targetCategoryId]
          );
        }

        completed++;
        console.log(`(${completed}/${preparedGrills.length}) Successfully uploaded & registered: ${item.title}`);
      } catch (err) {
        failed++;
        console.error(`Failed item ${item.title}:`, err.message);
      }
    }

    console.log(`\n========================================`);
    console.log(`STEEL GRILLS INGESTION COMPLETE!`);
    console.log(`Total: ${preparedGrills.length}`);
    console.log(`Completed: ${completed}`);
    console.log(`Failed: ${failed}`);
    console.log(`========================================`);
  } finally {
    await db.end();
  }
}

main().catch(console.error);
