import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { databaseClient } from './db-client.mjs';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const rawPins = JSON.parse(fs.readFileSync('scripts/pinterest-all-pins.json', 'utf8'));
console.log(`Loaded ${rawPins.length} Pinterest pins.`);

function decodeHtml(html) {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

const descriptiveStyles = [
  'Modern Horizontal Tubular',
  'Architectural Geometric Grid',
  'Royal Heritage Scrollwork',
  'Contemporary Villa Entrance',
  'Heavy-Duty Farmhouse Compound',
  'Minimalist Double-Swing Pipe',
  'Ornamental Arch-Top Wrought',
  'Diamond Lattice Security',
  'Linear Slotted Dual-Leaf',
  'Industrial Steel Box-Section',
  'Classic Spindle Driveway',
  'Bespoke Cross-Braced Farm',
  'Vertical Bar Boundary',
  'Custom Welded Modular Pipe',
  'Artisan Medallion Iron'
];

function preparePin(pin, index) {
  let title = decodeHtml(pin.title || '').trim();
  title = title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  title = title.replace(/\b\d{10}\b/g, '').replace(/cel\s*\d+/gi, '').trim();

  let lower = title.toLowerCase();

  // Normalize specific foreign or awkward titles
  if (lower.startsWith('puerta') || lower.includes('puertas acorazadas')) {
    title = `Custom Handcrafted Iron Entry Door ${index + 1}`;
  } else if (lower.includes('همائی درب')) {
    title = `Luxury Forged Iron Estate Entrance Gate ${index + 1}`;
  } else if (lower.includes('porte d\'entrée moderne')) {
    title = `Contemporary Pivot Metal Entry Door ${index + 1}`;
  } else if (lower.includes('घर और विला फार्महाउस')) {
    title = 'Stylish Farmhouse & Villa Iron Entrance Gate';
  } else if (lower.includes('bihar onli steel get')) {
    title = 'Heavy Duty Stainless Steel Main Entrance Gate';
  } else if (lower.includes('real estate photo editing')) {
    title = `Contemporary Architectural Security Gate ${index + 1}`;
  } else if (lower.includes('mercado libre')) {
    title = `Heavy-Duty Industrial Steel Entrance Gate ${index + 1}`;
  } else if (title === 'C' || title.length < 5) {
    const style = descriptiveStyles[index % descriptiveStyles.length];
    title = `${style} Iron Gate ${index + 1}`;
  }

  // Cap title length
  if (title.length > 75) {
    title = title.slice(0, 72).trim() + '...';
  }

  lower = title.toLowerCase();
  let categorySlug = 'iron-pipe-gates';
  if (lower.includes('door') || lower.includes('entry door') || lower.includes('security door')) {
    categorySlug = 'metal-doors';
  } else if (lower.includes('jali') || lower.includes('laser cut') || lower.includes('cnc')) {
    categorySlug = 'laser-cut-gates';
  } else if (lower.includes('steel') || lower.includes('ss 304')) {
    categorySlug = 'steel-gates';
  } else if (lower.includes('sliding') || lower.includes('motorized')) {
    categorySlug = 'sliding-gates';
  }

  const categoryPrefix = categorySlug === 'iron-pipe-gates' ? 'IRN' :
                         categorySlug === 'metal-doors' ? 'DOR' :
                         categorySlug === 'steel-gates' ? 'STL' :
                         categorySlug === 'laser-cut-gates' ? 'LSR' : 'SLD';

  const sku = `PIN-${categoryPrefix}-${String(index + 1).padStart(3, '0')}`;
  const slugClean = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slug = `pin-${slugClean.slice(0, 45)}-${pin.id.slice(-6)}`;

  let material = 'High-Tensile Mild Steel Hollow Section (Class B) + Solid Bar Spindles';
  let finish = 'Zinc Phosphate Primer + 2-Coat Matte Black Anti-Rust Epoxy Enamel';
  let weight_kg = 160 + (index % 10) * 12;
  let price_min_minor = 2600000 + (index % 7) * 300000; // ₹26,000 - ₹44,000
  let price_max_minor = price_min_minor * 2 + 1000000;

  if (categorySlug === 'steel-gates') {
    material = 'Stainless Steel 304 (Hairline Brushed Pipes & Mirror Polish Trims)';
    finish = 'Satin Hairline Polish + Clear Passivation Anti-Stain Treatment';
    price_min_minor = 4500000 + (index % 5) * 400000; // ₹45,000 - ₹61,000
    price_max_minor = price_min_minor * 2;
  } else if (categorySlug === 'metal-doors') {
    material = 'Heavy-Gauge Pressed Steel Frame + Forged Wrought Iron Decorative Grille';
    finish = 'Electrostatic Powder Coating in Matte Charcoal / Satin Black';
    price_min_minor = 3200000 + (index % 6) * 350000; // ₹32,000 - ₹50,000
    price_max_minor = price_min_minor * 2;
  } else if (categorySlug === 'laser-cut-gates') {
    material = '3.2mm CNC Fiber-Laser Cut Steel Sheet + 50x50mm Heavy Hollow Tube Frame';
    finish = 'High-Durability Architectural Polyurethane with Gold Accent Highlight';
    price_min_minor = 5000000;
    price_max_minor = 10500000;
  }

  const description = `${title}. Fabricated with precision using ${material}. Finished with ${finish} for maximum exterior weather resistance, rust protection, and aesthetic appeal. Custom dimensions, hinges, and lock provisions tailored to site specifications.`;

  return {
    index: index + 1,
    pinId: pin.id,
    title,
    sku,
    slug,
    categorySlug,
    material,
    finish,
    weight_kg,
    price_min_minor,
    price_max_minor,
    description,
    imgUrl: pin.imgUrl,
    dominantColor: pin.dominantColor
  };
}

const preparedProducts = rawPins.map(preparePin);

async function uploadImageToCloudinary(item) {
  const publicId = `smart-fabrication/development/pinterest-collection/pin-${item.pinId}`;
  
  // Try high-res first, then fallback to 736x
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
        tags: ['smartfabrication-pinterest', item.categorySlug, 'catalog'],
        context: {
          title: item.title,
          pin_id: item.pinId,
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

    const catRes = await db.query(
      `select id, slug from public.categories`
    );
    const categoryMap = new Map();
    catRes.rows.forEach(c => categoryMap.set(c.slug, c.id));

    const defaultMaterialRes = await db.query(
      `select id from public.materials where active = true limit 1`
    );
    const defaultMaterialId = defaultMaterialRes.rows[0]?.id;

    console.log(`2. Starting sequential upload & registration for ${preparedProducts.length} items...`);

    let completed = 0;
    let failed = 0;

    for (const item of preparedProducts) {
      const targetCategoryId = categoryMap.get(item.categorySlug) || categoryMap.get('iron-pipe-gates') || categoryMap.get('main-gates');

      try {
        console.log(`[${completed + failed + 1}/${preparedProducts.length}] Uploading ${item.title}...`);
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

        // Products Record
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
            item.material, item.finish, item.weight_kg, `PIN-${item.pinId.slice(-4)}`,
            'Custom made according to site opening dimensions. Reinforced corners, heavy drop bolts, latch provision.',
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

        // Variants
        await db.query(
          `insert into public.product_variants(product_id, name, sku, width_mm, height_mm, colour, finish, price_min_minor, price_max_minor, status)
           values
             ($1, 'Standard Residential (10ft x 6ft)', $2 || '-V1', 3048, 1828, 'Matte Charcoal Black', 'Anti-Rust Coating', $3, $4, 'published'),
             ($1, 'Compact Single-Leaf (4ft x 7ft)', $2 || '-V2', 1219, 2133, 'Matte Charcoal Black', 'Anti-Rust Coating', $3 * 0.7, $4 * 0.7, 'published'),
             ($1, 'Grand Compound Entrance (14ft x 8ft)', $2 || '-V3', 4267, 2438, 'Matte Charcoal Black', 'Anti-Rust Coating', $3 * 1.45, $4 * 1.45, 'published')
           on conflict do nothing`,
          [prodId, item.sku, item.price_min_minor, item.price_max_minor]
        );

        // BOM and calculation rules
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
                 values($1, $2, 5.0, 7, true)`,
                [bomId, defaultMaterialId]
              );
              await db.query(`update public.bom_versions set status = 'published' where id = $1`, [bomId]);
            }

            const ruleRes = await db.query(
              `insert into public.calculation_rules(
                 product_id, version, labour_minor_per_sq_m, finish_minor_per_sq_m,
                 hardware_minor, delivery_minor, installation_minor, margin_bps, range_percent, status
               )
               values($1, 1, 95000, 45000, 300000, 150000, 200000, 1500, 10, 'draft')
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
        console.log(`(${completed}/${preparedProducts.length}) Successfully uploaded & registered: ${item.title}`);
      } catch (err) {
        failed++;
        console.error(`Failed item ${item.title}:`, err.message);
      }
    }

    console.log(`\n========================================`);
    console.log(`PINTEREST INGESTION COMPLETE!`);
    console.log(`Total: ${preparedProducts.length}`);
    console.log(`Completed: ${completed}`);
    console.log(`Failed: ${failed}`);
    console.log(`========================================`);
  } finally {
    await db.end();
  }
}

main().catch(console.error);
