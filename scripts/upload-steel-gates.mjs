import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { databaseClient } from './db-client.mjs';

const artifactDir = 'C:\\Users\\mukul\\.gemini\\antigravity-ide\\brain\\92c5a1a5-61f4-42ac-b6af-6219f1792376';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const steelGates = [
  {
    localFile: 'ss_luxury_gate_1792663236795.jpg',
    publicId: 'smart-fabrication/development/steel-gate-album/royal-ss-304-mirror-walnut-gate',
    title: 'Royal SS 304 Mirror & Walnut Double Swing Gate',
    sku: 'GATE-STEEL-001',
    slug: 'royal-ss-304-mirror-walnut-swing-gate',
    categorySlug: 'main-gates',
    description: 'Ultra-luxury stainless steel 304 double swing driveway entrance gate from our design album. Combines precision hairline brushed and mirror-finish SS 304 frames, natural exterior walnut grain paneling, and electroplated gold insignia crest accents.',
    material: 'Stainless Steel 304 (Hairline & Mirror Finish) + Exterior HPL Woodgrain Panel',
    finish: 'Brushed Hairline SS 304 with Gold PVD Accents & UV Wood Coating',
    weight_kg: 210,
    design_code: 'ALBUM-SS-01',
    design_details: 'Dual swing leaf with concealed heavy-duty bottom pivot bearing hinges, magnetic lock provision, weather-sealed vertical joints, and gold accent grille rods.',
    price_min_minor: 4800000, // ₹48,000
    price_max_minor: 9800000, // ₹98,000
    galleryName: 'Royal SS 304 Mirror & Walnut Residence Gate',
    alt: 'Architectural SS 304 double swing driveway gate with mirror finish panels and natural walnut accents'
  },
  {
    localFile: 'steel_sliding_album_1792663258456.jpg',
    publicId: 'smart-fabrication/development/steel-gate-album/architectural-ss-ms-sliding-gate',
    title: 'Architectural SS & MS Motorized Sliding Gate',
    sku: 'GATE-STEEL-002',
    slug: 'architectural-ss-ms-motorized-sliding-gate',
    categorySlug: 'main-gates',
    description: 'Designer motorized cantilever sliding gate blending structural mild steel with high-grade stainless steel 304 accents. Features horizontal brushed steel strips, CNC laser cut geometric privacy louvers, and warm teak woodgrain insets.',
    material: 'Mild Steel Box Sections + Stainless Steel 304 Bands + Wood Polymer Louvers',
    finish: 'Matte Charcoal Grey Polyurethane & Satin Brushed SS 304',
    weight_kg: 260,
    design_code: 'ALBUM-SLD-02',
    design_details: 'Heavy-duty integrated bottom gear rack, Italian sliding motor ready, dual anti-vibration top guide rollers, safety photocell brackets.',
    price_min_minor: 5500000, // ₹55,000
    price_max_minor: 12000000, // ₹120,000
    galleryName: 'Architectural SS & MS Motorized Sliding Gate',
    alt: 'Modern stainless steel and mild steel combination motorized sliding entrance gate with woodgrain louvers'
  },
  {
    localFile: 'ss_laser_main_gate_1792663278369.jpg',
    publicId: 'smart-fabrication/development/steel-gate-album/luxury-champagne-gold-laser-cut-ss-gate',
    title: 'Luxury Champagne Gold Laser Cut SS Gate',
    sku: 'GATE-STEEL-003',
    slug: 'luxury-champagne-gold-laser-cut-ss-gate',
    categorySlug: 'main-gates',
    description: 'Bespoke CNC laser-cut architectural gate in champagne gold PVD coating over stainless steel 304. Intricate floral mandala privacy motif with heavy tubular brushed steel frame and matching independent pedestrian wicket gate.',
    material: 'Stainless Steel 304 (3.5mm CNC Sheet & 50x50mm Tubular Frame)',
    finish: 'Champagne Gold PVD Titanium Coating & Satin Brushed Silver Frame',
    weight_kg: 190,
    design_code: 'ALBUM-LSR-03',
    design_details: 'CNC fiber-laser precision cut mandala pattern, chamfered corner joints, long vertical stainless steel pull handles, mortise latch lockbox.',
    price_min_minor: 6200000, // ₹62,000
    price_max_minor: 13500000, // ₹135,000
    galleryName: 'Champagne Gold Laser Cut SS 304 Estate Gate',
    alt: 'Luxury stainless steel main gate with laser-cut champagne gold CNC mandala screen and integrated wicket gate'
  },
  {
    localFile: 'royal_steel_gate_1792663297467.jpg',
    publicId: 'smart-fabrication/development/steel-gate-album/heritage-royal-steel-compound-gate',
    title: 'Heritage Royal Steel Compound Entrance Gate',
    sku: 'GATE-STEEL-004',
    slug: 'heritage-royal-steel-compound-entrance-gate',
    categorySlug: 'main-gates',
    description: 'Monumental driveway entrance gate combining heavy-gauge structural steel box framing with vertical solid stainless steel spindles and a laser-machined royal heraldic center medallion. Engineered for stately residences and farmhouses.',
    material: 'Structural Steel Box Section Frame + Solid Stainless Steel 304 Spindles',
    finish: 'Deep Gloss Black Anti-Rust Powder Coat + Polished Chrome SS Spindles',
    weight_kg: 245,
    design_code: 'ALBUM-RYL-04',
    design_details: 'Stately double swing gate with reinforced hinge pins, circular CNC medallion plate with custom monogram engraving option, decorative header scrolls.',
    price_min_minor: 5200000, // ₹52,000
    price_max_minor: 11000000, // ₹110,000
    galleryName: 'Heritage Royal Compound Gate with SS Spindles',
    alt: 'Heavy-duty tubular steel compound gate with vertical stainless steel rods and central royal emblem'
  }
];

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
      `select id from public.categories where slug = 'main-gates' limit 1`
    );
    const mainGatesCategoryId = catRes.rows[0]?.id;
    if (!mainGatesCategoryId) {
      throw new Error("Category 'main-gates' not found");
    }

    const matRes = await db.query(
      `select id from public.materials where code in ('MAT-SS-PIPE-38', 'MAT-MS-PIPE-50') and active = true limit 1`
    );
    let defaultMaterialId = matRes.rows[0]?.id;
    if (!defaultMaterialId) {
      const anyMat = await db.query(`select id from public.materials where active = true limit 1`);
      defaultMaterialId = anyMat.rows[0]?.id;
    }

    console.log('2. Uploading Steel Gate Album images to Cloudinary and registering...');
    for (const item of steelGates) {
      const fullPath = path.join(artifactDir, item.localFile);
      if (!fs.existsSync(fullPath)) {
        console.error(`Missing file: ${fullPath}`);
        continue;
      }

      console.log(`Uploading ${item.title} to Cloudinary...`);
      const uploadRes = await cloudinary.uploader.upload(fullPath, {
        public_id: item.publicId,
        resource_type: 'image',
        overwrite: true,
        tags: ['smartfabrication-steel-gate-album', 'main-gates', 'steel-design'],
        context: {
          title: item.title,
          alt: item.alt,
          album: 'steel gate design album'
        }
      });
      console.log(`Uploaded: ${uploadRes.secure_url} (${uploadRes.width}x${uploadRes.height})`);

      // 3. Register in upload_intents and media_assets
      const intentId = crypto.randomUUID();
      const assetId = crypto.randomUUID();

      await db.query(
        `insert into public.upload_intents (id, owner_user_id, public_id, context, visibility, resource_type, confirmed_at, expires_at)
         values ($1, $2, $3, 'product', 'public', 'image', now(), now() + interval '10 years')
         on conflict (public_id) do update set confirmed_at = now()`,
        [intentId, ownerId, item.publicId]
      );

      const existingMedia = await db.query(
        `select id from public.media_assets where public_id = $1`,
        [item.publicId]
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
        console.log(`Updated media asset ${mediaId}`);
      } else {
        const insertRes = await db.query(
          `insert into public.media_assets (id, asset_id, public_id, resource_type, format, bytes, width, height, owner_user_id, context, visibility)
           values ($1, $2, $3, 'image', $4, $5, $6, $7, $8, 'product', 'public')
           returning id`,
          [assetId, uploadRes.asset_id || crypto.randomUUID(), item.publicId, uploadRes.format, uploadRes.bytes, uploadRes.width, uploadRes.height, ownerId]
        );
        mediaId = insertRes.rows[0].id;
        console.log(`Created media asset ${mediaId}`);
      }

      // 4. Create/Update Product
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
          item.title, item.sku, item.slug, mainGatesCategoryId, item.description,
          item.material, item.finish, item.weight_kg, item.design_code,
          item.design_details, item.price_min_minor, item.price_max_minor
        ]
      );
      const prodId = prodRes.rows[0].id;
      console.log(`Product registered: ${item.title} (${prodId})`);

      // 5. Link Product Media
      await db.query(`delete from public.product_media where product_id = $1`, [prodId]);
      await db.query(
        `insert into public.product_media (product_id, media_id, alt_text, sort_order)
         values ($1, $2, $3, 0)`,
        [prodId, mediaId, item.alt]
      );
      console.log(`Linked media ${mediaId} to product ${prodId}`);

      // 6. Product Variants
      await db.query(
        `insert into public.product_variants(product_id, name, sku, width_mm, height_mm, colour, finish, price_min_minor, price_max_minor, status)
         values
           ($1, 'Standard Villa Opening (10ft x 6.5ft)', $2 || '-V1', 3048, 1981, 'Brushed Silver / Wood', 'Architectural Satin', $3, $4, 'published'),
           ($1, 'Compact Residential (8ft x 5.5ft)', $2 || '-V2', 2438, 1676, 'Charcoal / SS Infill', 'Weatherproof Polyurethane', $3 * 0.85, $4 * 0.85, 'published'),
           ($1, 'Grand Estate Entrance (14ft x 8ft)', $2 || '-V3', 4267, 2438, 'Titanium Gold / Satin Chrome', 'PVD + Powder Coated', $3 * 1.5, $4 * 1.5, 'published')
         on conflict do nothing`,
        [prodId, item.sku, item.price_min_minor, item.price_max_minor]
      );

      // 7. BOM & Calculation Rules
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
               values($1, $2, 6.0, 8, true)`,
              [bomId, defaultMaterialId]
            );
            await db.query(`update public.bom_versions set status = 'published' where id = $1`, [bomId]);
          }

          const ruleRes = await db.query(
            `insert into public.calculation_rules(
               product_id, version, labour_minor_per_sq_m, finish_minor_per_sq_m,
               hardware_minor, delivery_minor, installation_minor, margin_bps, range_percent, status
             )
             values($1, 1, 120000, 60000, 450000, 200000, 250000, 1500, 10, 'draft')
             on conflict (product_id, version) do nothing
             returning id`,
            [prodId]
          );
          if (ruleRes.rows.length > 0) {
            await db.query(`update public.calculation_rules set status = 'published' where id = $1`, [ruleRes.rows[0].id]);
          }
          console.log(`BOM and calculation rules published for product ${prodId}`);
        } else {
          console.log(`Product ${prodId} already has a published BOM.`);
        }
      }

      // 8. Gallery Item
      const galleryCheck = await db.query(
        `select id from public.gallery_items where name = $1`,
        [item.galleryName]
      );
      if (galleryCheck.rows.length > 0) {
        await db.query(
          `update public.gallery_items
           set media_id = $1, alt_text = $2, category_id = $3, consent_confirmed = true, status = 'published'
           where id = $4`,
          [mediaId, item.alt, mainGatesCategoryId, galleryCheck.rows[0].id]
        );
        console.log(`Updated gallery item '${item.galleryName}'`);
      } else {
        await db.query(
          `insert into public.gallery_items (id, name, media_id, alt_text, category_id, consent_confirmed, status)
           values ($1, $2, $3, $4, $5, true, 'published')`,
          [crypto.randomUUID(), item.galleryName, mediaId, item.alt, mainGatesCategoryId]
        );
        console.log(`Inserted gallery item '${item.galleryName}'`);
      }
    }

    console.log('ALL STEEL GATE ALBUM ITEMS UPLOADED AND SEEDED SUCCESSFULLY!');
  } finally {
    await db.end();
  }
}

main().catch(err => {
  console.error('Upload steel gates script failed:', err);
  process.exit(1);
});
