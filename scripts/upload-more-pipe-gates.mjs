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

const newPipeGates = [
  {
    localFile: 'pipe_farmhouse_gate_1792667728027.jpg',
    publicId: 'smart-fabrication/development/pipe-gates/farmhouse-wheel-pipe-gate',
    title: 'Heritage Wheel Pattern Farmhouse Pipe Gate',
    sku: 'GATE-PIPE-004',
    slug: 'heritage-wheel-pattern-farmhouse-pipe-gate',
    description: 'Heavy-duty agricultural and farmhouse driveway double swing gate fabricated with thick hollow circular steel pipes, iconic center circular wheel rings, and diagonal cross braces for maximum structural rigidity.',
    material: 'Mild Steel Circular Hollow Pipe (60mm OD & 40mm Braces)',
    finish: 'Industrial Anti-Corrosive Red Oxide Primer + Satin Black Finish',
    weight_kg: 175,
    design_code: 'PIPE-FARM-04',
    design_details: 'Twin swing leaves with central wheel hub motif, double diagonal corner struts, heavy forged drop pins, and padlock bracket.',
    price_min_minor: 2800000, // ₹28,000
    price_max_minor: 5800000, // ₹58,000
    galleryName: 'Heritage Wheel Pattern Farmhouse Pipe Gate',
    alt: 'Heavy duty Indian farmhouse iron pipe driveway swing gate with center wheel rings and diagonal cross braces'
  },
  {
    localFile: 'pipe_horizontal_gate_1792667751057.jpg',
    publicId: 'smart-fabrication/development/pipe-gates/modern-horizontal-pipe-teak-gate',
    title: 'Modern Horizontal Pipe & Teak Louver Gate',
    sku: 'GATE-PIPE-005',
    slug: 'modern-horizontal-pipe-teak-louver-gate',
    description: 'Contemporary architectural main gate designed with precision horizontal circular steel pipes seamlessly integrated with natural weather-resistant teak wood composite slats and an independent matching wicket door.',
    material: 'Mild Steel Circular Hollow Pipes + Teak Wood Polymer Composite (WPC)',
    finish: 'Matte Charcoal Grey Polyurethane + Exterior UV Teak Finish',
    weight_kg: 215,
    design_code: 'PIPE-HORIZ-05',
    design_details: 'Single sliding / double swing options with horizontal pipe louver sections, integrated magnetic lock provision, matching side pedestrian gate.',
    price_min_minor: 4200000, // ₹42,000
    price_max_minor: 8800000, // ₹88,000
    galleryName: 'Modern Horizontal Pipe & Teak Louver Residence Gate',
    alt: 'Modern minimalist Indian residential main gate made of horizontal circular iron pipes with teak wood composite slats'
  },
  {
    localFile: 'pipe_vertical_gate_1792667773568.jpg',
    publicId: 'smart-fabrication/development/pipe-gates/royal-shubh-nilayam-spear-pipe-gate',
    title: 'Royal Ornamental Arch Spear-Tip Pipe Gate',
    sku: 'GATE-PIPE-006',
    slug: 'royal-ornamental-arch-spear-tip-pipe-gate',
    description: 'Traditional Indian luxury residence double swing gate fabricated with circular tubular steel outer arch frame, vertical hollow iron pipe pickets, classical S-scroll ornamental accents, and gold spear-tip finials.',
    material: 'Heavy Mild Steel Tubular Pipe Structure + Brass Spear Tips',
    finish: 'Satin Black Enamel with Electroplated Gold Brass Finials',
    weight_kg: 190,
    design_code: 'PIPE-ARCH-06',
    design_details: 'Gentle top arch radius, vertical tubular bars spaced at 100mm safety gaps, heavy greased ball bearing pivot hinges, brass lock trim.',
    price_min_minor: 3600000, // ₹36,000
    price_max_minor: 7600000, // ₹76,000
    galleryName: 'Royal Ornamental Arch Spear-Tip Residence Gate',
    alt: 'Popular Indian residential iron pipe swing gate with heavy tubular arch frame and gold spear tip finials'
  },
  {
    localFile: 'pipe_sliding_gate_v2_1792667792537.jpg',
    publicId: 'smart-fabrication/development/pipe-gates/tubular-heavy-duty-sliding-gate',
    title: 'Tubular Steel Heavy-Duty Sliding Driveway Gate',
    sku: 'GATE-PIPE-007',
    slug: 'tubular-steel-heavy-duty-sliding-driveway-gate',
    description: 'Clean modern motorized sliding driveway gate fabricated entirely from heavy-wall circular iron hollow sections inside a robust square steel perimeter beam. Smooth rolling double-bearing bottom track wheels.',
    material: 'High-Tensile Circular Hollow Section (CHS) & Square Section (SHS) Steel',
    finish: 'Multi-Stage Zinc Phosphate Epoxy Primer + Matte Charcoal Powder Coat',
    weight_kg: 230,
    design_code: 'PIPE-SLD-07',
    design_details: 'Cantilever / floor-track roller configuration, built-in automation gear rack bracket, top rubber guide rollers, recessed handle bar.',
    price_min_minor: 4800000, // ₹48,000
    price_max_minor: 9600000, // ₹96,000
    galleryName: 'Tubular Steel Heavy-Duty Sliding Driveway Gate',
    alt: 'Heavy duty Indian residential iron pipe sliding driveway gate with horizontal circular mild steel pipes'
  },
  {
    localFile: 'pipe_diamond_gate_1792667812588.jpg',
    publicId: 'smart-fabrication/development/pipe-gates/bungalow-diamond-lattice-pipe-gate',
    title: 'Bungalow Diamond Lattice Iron Pipe Swing Gate',
    sku: 'GATE-PIPE-008',
    slug: 'bungalow-diamond-lattice-iron-pipe-swing-gate',
    description: 'Charming residential bungalow entrance gate featuring a heavy circular steel pipe perimeter frame, diagonal criss-cross diamond mesh lattice, lower vertical tubular pipe railing, and decorative center forged ring accents.',
    material: 'Circular Steel Pipe Outer Frame + Diamond Lattice Mild Steel Grid',
    finish: 'Deep Gloss Black Weatherproof Polyurethane Coating',
    weight_kg: 180,
    design_code: 'PIPE-DIAM-08',
    design_details: 'Double swing configuration, diamond mesh upper lattice for partial visibility, lower tubular bar grill for pet safety, center brass ring motifs.',
    price_min_minor: 3400000, // ₹34,000
    price_max_minor: 7200000, // ₹72,000
    galleryName: 'Bungalow Diamond Lattice Iron Pipe Swing Gate',
    alt: 'Indian residential iron pipe driveway swing gate with diamond mesh lattice grille and circular pipe frame'
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

    // Get subcategory ID for iron-pipe-gates
    const subRes = await db.query(
      `select id from public.categories where slug = 'iron-pipe-gates' limit 1`
    );
    const pipeSubcategoryId = subRes.rows[0]?.id;
    if (!pipeSubcategoryId) {
      throw new Error("Subcategory 'iron-pipe-gates' not found");
    }

    // Default material for BOM
    const matRes = await db.query(
      `select id from public.materials where code = 'MAT-MS-PIPE-50' and active = true limit 1`
    );
    let defaultMaterialId = matRes.rows[0]?.id;
    if (!defaultMaterialId) {
      const anyMat = await db.query(`select id from public.materials where active = true limit 1`);
      defaultMaterialId = anyMat.rows[0]?.id;
    }

    console.log('2. Uploading 5 new Pipe Gate images to Cloudinary and registering in database...');
    for (const item of newPipeGates) {
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
        tags: ['smartfabrication-pipe-gates', 'iron-pipe-gates'],
        context: {
          title: item.title,
          alt: item.alt,
          design: 'pipe gate design'
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

      // 4. Create/Update Product under iron-pipe-gates subcategory
      const prodRes = await db.query(
        `insert into public.products(
           name, sku, slug, category_id, description, material, finish,
           weight_kg, design_code, design_details, price_min_minor, price_max_minor,
           custom_size, featured, delivery_availability, installation_availability, status
         )
         values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, false, 'available', 'available', 'published')
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
           status = 'published'
         returning id`,
        [
          item.title, item.sku, item.slug, pipeSubcategoryId, item.description,
          item.material, item.finish, item.weight_kg, item.design_code,
          item.design_details, item.price_min_minor, item.price_max_minor
        ]
      );
      const prodId = prodRes.rows[0].id;
      console.log(`Product registered in iron-pipe-gates: ${item.title} (${prodId})`);

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
           ($1, 'Standard Gate Opening (10ft x 6ft)', $2 || '-V1', 3048, 1828, 'Matte Black', 'Anti-Rust Coating', $3, $4, 'published'),
           ($1, 'Compact Residential (8ft x 5ft)', $2 || '-V2', 2438, 1524, 'Satin Black', 'Red Oxide + Enamel', $3 * 0.85, $4 * 0.85, 'published'),
           ($1, 'Grand Farmhouse Driveway (14ft x 7ft)', $2 || '-V3', 4267, 2133, 'Deep Charcoal', 'Powder Coated', $3 * 1.45, $4 * 1.45, 'published')
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
               values($1, $2, 4.8, 8, true)`,
              [bomId, defaultMaterialId]
            );
            await db.query(`update public.bom_versions set status = 'published' where id = $1`, [bomId]);
          }

          const ruleRes = await db.query(
            `insert into public.calculation_rules(
               product_id, version, labour_minor_per_sq_m, finish_minor_per_sq_m,
               hardware_minor, delivery_minor, installation_minor, margin_bps, range_percent, status
             )
             values($1, 1, 85000, 35000, 250000, 150000, 200000, 1500, 10, 'draft')
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
          [mediaId, item.alt, pipeSubcategoryId, galleryCheck.rows[0].id]
        );
        console.log(`Updated gallery item '${item.galleryName}'`);
      } else {
        await db.query(
          `insert into public.gallery_items (id, name, media_id, alt_text, category_id, consent_confirmed, status)
           values ($1, $2, $3, $4, $5, true, 'published')`,
          [crypto.randomUUID(), item.galleryName, mediaId, item.alt, pipeSubcategoryId]
        );
        console.log(`Inserted gallery item '${item.galleryName}'`);
      }
    }

    console.log('ALL NEW PIPE GATES UPLOADED AND REGISTERED SUCCESSFULLY!');
  } finally {
    await db.end();
  }
}

main().catch(err => {
  console.error('Failed to upload new pipe gates:', err);
  process.exit(1);
});
