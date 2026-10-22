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

const pipeGates = [
  {
    localFile: 'iron_pipe_gate_1792662131476.jpg',
    publicId: 'smart-fabrication/development/pipe-gates/contemporary-iron-pipe-gate',
    title: 'Contemporary Iron Tubular Pipe Swing Gate',
    sku: 'GATE-PIPE-001',
    slug: 'contemporary-iron-tubular-pipe-swing-gate',
    categorySlug: 'main-gates',
    description: 'Modern heavy-duty mild steel iron pipe driveway swing gate. Fabricated with precision circular and rectangular hollow section steel pipes, horizontal tubular pattern with decorative gold brass collar accents, and anti-rust matte black polyurethane coating.',
    material: 'Mild Steel (Heavy Circular & Rectangular Hollow Section Pipes)',
    finish: 'Matte Black Anti-Rust Powder Coated with Brass Accents',
    weight_kg: 165,
    design_code: 'PIPE-SWG-01',
    design_details: 'Dual leaf swing configuration with horizontal tubular iron bars, heavy-duty adjustable pivot hinges, integrated center drop bolt and brass lock accents.',
    price_min_minor: 3200000, // ₹32,000
    price_max_minor: 6800000, // ₹68,000
    galleryName: 'Contemporary Iron Tubular Pipe Swing Gate',
    alt: 'Modern mild steel iron pipe driveway swing gate with circular and rectangular hollow sections and brass accents'
  },
  {
    localFile: 'pipe_sliding_gate_1792662174466.jpg',
    publicId: 'smart-fabrication/development/pipe-gates/modern-pipe-sliding-gate',
    title: 'Modern Iron Pipe Sliding Driveway Gate',
    sku: 'GATE-PIPE-002',
    slug: 'modern-iron-pipe-sliding-driveway-gate',
    categorySlug: 'main-gates',
    description: 'Architectural iron pipe sliding gate featuring horizontal tubular steel hollow pipes integrated with weather-resistant teak wood composite louvers. Heavy-duty bottom roller wheels and motorized track ready.',
    material: 'Heavy Hollow Mild Steel Pipes & Wood Polymer Composite (WPC)',
    finish: 'Charcoal Black Powder Coat & UV Exterior Teak Finish',
    weight_kg: 220,
    design_code: 'PIPE-SLD-02',
    design_details: 'Single leaf sliding gate with concealed guide rail, heavy nylon upper roller guides, bottom double bearing cast iron wheels, ready for rack-and-pinion motor integration.',
    price_min_minor: 4500000, // ₹45,000
    price_max_minor: 9500000, // ₹95,000
    galleryName: 'Modern Iron Pipe Sliding Driveway Gate',
    alt: 'Modern architectural iron pipe sliding driveway gate with steel hollow section pipes and teak louvers'
  },
  {
    localFile: 'ornamental_pipe_gate_1792662238725.jpg',
    publicId: 'smart-fabrication/development/pipe-gates/ornamental-pipe-arch-gate',
    title: 'Classical Ornamental Arch Iron Pipe Gate',
    sku: 'GATE-PIPE-003',
    slug: 'ornamental-arch-iron-pipe-estate-gate',
    categorySlug: 'main-gates',
    description: 'Classical arch double-leaf entrance gate constructed with heavy-gauge circular iron pipes, forged decorative scrollwork, integrated wicket gate access door, and gold-tipped security spear finials.',
    material: 'Mild Steel Circular Pipe Structure & Wrought Iron Scrolls',
    finish: 'Satin Black Protective Enamel with Antique Brass Highlights',
    weight_kg: 195,
    design_code: 'PIPE-ORN-03',
    design_details: 'Graceful arched header beam, reinforced outer tubular frame, embedded pedestrian wicket door with lockbox, anti-climb spear finials.',
    price_min_minor: 3800000, // ₹38,000
    price_max_minor: 8200000, // ₹82,000
    galleryName: 'Classical Ornamental Arch Iron Pipe Gate',
    alt: 'Classical arch double-leaf entrance gate with heavy-gauge circular iron pipes and decorative scrollwork'
  }
];

async function main() {
  console.log('1. Connecting to PostgreSQL...');
  const db = databaseClient();
  await db.connect();

  try {
    // Get owner user for uploads
    const ownerRes = await db.query(
      `select user_id from public.user_roles where role_id = 'owner' limit 1`
    );
    const ownerId = ownerRes.rows[0]?.user_id;

    // Get category id for main-gates
    const catRes = await db.query(
      `select id from public.categories where slug = 'main-gates' limit 1`
    );
    const mainGatesCategoryId = catRes.rows[0]?.id;
    if (!mainGatesCategoryId) {
      throw new Error("Category 'main-gates' not found");
    }

    // Get an active material for BOM (e.g. MAT-MS-PIPE-50)
    const matRes = await db.query(
      `select id from public.materials where code = 'MAT-MS-PIPE-50' and active = true limit 1`
    );
    let defaultMaterialId = matRes.rows[0]?.id;
    if (!defaultMaterialId) {
      const anyMat = await db.query(`select id from public.materials where active = true limit 1`);
      defaultMaterialId = anyMat.rows[0]?.id;
    }

    console.log('2. Uploading pipe gate images to Cloudinary and registering into database...');
    for (const item of pipeGates) {
      const fullPath = path.join(artifactDir, item.localFile);
      if (!fs.existsSync(fullPath)) {
        console.error(`Missing file: ${fullPath}`);
        continue;
      }

      console.log(`Uploading ${item.title} (${item.localFile}) to Cloudinary...`);
      const uploadRes = await cloudinary.uploader.upload(fullPath, {
        public_id: item.publicId,
        resource_type: 'image',
        overwrite: true,
        tags: ['smartfabrication-pipe-gates', 'main-gates'],
        context: {
          title: item.title,
          alt: item.alt,
          design: 'pipe gate design'
        }
      });
      console.log(`Uploaded to Cloudinary: ${uploadRes.secure_url} (${uploadRes.width}x${uploadRes.height})`);

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
           ($1, 'Standard Gate (10ft x 6ft)', $2 || '-V1', 3048, 1828, 'Charcoal Black', 'Matte Powder Coated', $3, $4, 'published'),
           ($1, 'Compact Residential (8ft x 5ft)', $2 || '-V2', 2438, 1524, 'Matte Black', 'Anti-Rust Coating', $3 * 0.85, $4 * 0.85, 'published'),
           ($1, 'Wide Estate Driveway (14ft x 7ft)', $2 || '-V3', 4267, 2133, 'Antique Highlight', 'Weatherproof Finish', $3 * 1.45, $4 * 1.45, 'published')
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
               values($1, $2, 5.0, 8, true)`,
              [bomId, defaultMaterialId]
            );
            await db.query(`update public.bom_versions set status = 'published' where id = $1`, [bomId]);
          }

          const ruleRes = await db.query(
            `insert into public.calculation_rules(
               product_id, version, labour_minor_per_sq_m, finish_minor_per_sq_m,
               hardware_minor, delivery_minor, installation_minor, margin_bps, range_percent, status
             )
             values($1, 1, 90000, 40000, 300000, 150000, 200000, 1500, 10, 'draft')
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

    console.log('ALL PIPE GATES UPLOADED AND SEEDED SUCCESSFULLY!');
  } finally {
    await db.end();
  }
}

main().catch(err => {
  console.error('Upload pipe gates script failed:', err);
  process.exit(1);
});
