import { v2 as cloudinary } from 'cloudinary';
import { databaseClient } from './db-client.mjs';
import crypto from 'node:crypto';
import fs from 'node:fs';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function main() {
  console.log('=== Ingesting Laser Cutting Gates ===');
  const curated = JSON.parse(fs.readFileSync('scripts/curated-laser-gates.json', 'utf8'));
  console.log(`Loaded ${curated.length} curated laser cutting gates.`);

  const db = databaseClient();
  await db.connect();

  try {
    // 1. Get owner user id for media registration
    const ownerRes = await db.query(`select user_id from public.user_roles where role_id = 'owner' limit 1`);
    const ownerId = ownerRes.rows[0]?.user_id;

    // 2. Get default material for BOM
    const defaultMaterialRes = await db.query(
      `select id from public.materials where active = true limit 1`
    );
    const defaultMaterialId = defaultMaterialRes.rows[0]?.id;

    // 3. Ensure Top-Level Category: "Laser Cutting Gates"
    let laserCat = await db.query(`select id from public.categories where slug = 'laser-cutting-gates' limit 1`);
    let laserCatId = laserCat.rows[0]?.id;

    if (!laserCatId) {
      const ins = await db.query(
        `insert into public.categories(id, name, slug, parent_id, active, sort_order)
         values($1, 'Laser Cutting Gates', 'laser-cutting-gates', null, true, 2)
         returning id`,
        [crypto.randomUUID()]
      );
      laserCatId = ins.rows[0].id;
      console.log('Created top-level category "Laser Cutting Gates" (laser-cutting-gates)');
    } else {
      await db.query(`update public.categories set name = 'Laser Cutting Gates', active = true, parent_id = null, sort_order = 2 where id = $1`, [laserCatId]);
      console.log('Updated top-level category "Laser Cutting Gates"');
    }

    // Subcategories under Laser Cutting Gates
    const subDefs = [
      { name: 'Modern CNC Geometric Laser Gates', slug: 'modern-cnc-gates', sort: 1 },
      { name: 'Floral & Botanical Laser Cut Gates', slug: 'floral-laser-gates', sort: 2 },
      { name: 'Luxury Matte Black & Gold Laser Gates', slug: 'luxury-black-gold-gates', sort: 3 },
      { name: 'Motorized Laser Cut Sliding Gates', slug: 'laser-sliding-gates', sort: 4 }
    ];

    const categoryMap = new Map();
    categoryMap.set('laser-cutting-gates', laserCatId);

    for (const sub of subDefs) {
      const checkSub = await db.query(`select id from public.categories where slug = $1`, [sub.slug]);
      let subId;
      if (checkSub.rows.length > 0) {
        subId = checkSub.rows[0].id;
        await db.query(`update public.categories set parent_id = $1, active = true, sort_order = $2 where id = $3`, [laserCatId, sub.sort, subId]);
      } else {
        const ins = await db.query(
          `insert into public.categories(id, name, slug, parent_id, active, sort_order)
           values($1, $2, $3, $4, true, $5)
           returning id`,
          [crypto.randomUUID(), sub.name, sub.slug, laserCatId, sub.sort]
        );
        subId = ins.rows[0].id;
      }
      categoryMap.set(sub.slug, subId);
    }
    console.log('Categories ready:', Array.from(categoryMap.keys()).join(', '));

    // 4. Pre-cache existing media and product media
    await db.query(`update public.media_assets set context = 'product', visibility = 'public' where public_id like 'smart-fabrication/development/laser-gates/%'`);
    const allMediaRes = await db.query(`select id, public_id from public.media_assets`);
    const mediaByHash = new Map();
    for (const row of allMediaRes.rows) {
      const m = row.public_id.match(/laser-([a-f0-9]{6})/);
      if (m) {
        mediaByHash.set(m[1], row.id);
      }
    }

    const allProductMediaRes = await db.query(`select product_id, media_id from public.product_media`);
    const productByMediaId = new Map(allProductMediaRes.rows.map(r => [r.media_id, r.product_id]));

    let uploadedCount = 0;
    let reusedCount = 0;
    let createdCount = 0;
    let firstMediaId = null;

    for (let idx = 0; idx < curated.length; idx++) {
      const item = curated[idx];
      const hash = crypto.createHash('md5').update(item.imageUrl).digest('hex').slice(0, 6);
      const publicId = `smart-fabrication/development/laser-gates/laser-${hash}`;
      const sku = `LSR-GT-${hash.toUpperCase()}`;
      const slug = `laser-gate-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 45)}-${hash}`;
      const targetCategoryId = categoryMap.get(item.subSlug) || laserCatId;

      console.log(`\n[${idx + 1}/${curated.length}] Processing: ${item.title} (hash: ${hash})`);

      let mediaId = mediaByHash.get(hash);

      if (!mediaId) {
        console.log(`   Uploading image to Cloudinary...`);
        const uploadRes = await cloudinary.uploader.upload(item.imageUrl, {
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
          tags: ['laser-cutting-gates', 'laser-gates', 'cnc-design'],
          context: {
            title: item.title,
            category: 'laser-cutting-gates'
          }
        });

        const assetId = crypto.randomUUID();
        const intentId = crypto.randomUUID();

        await db.query(
          `insert into public.upload_intents (id, owner_user_id, public_id, context, visibility, resource_type, confirmed_at, expires_at)
           values ($1, $2, $3, 'product', 'public', 'image', now(), now() + interval '10 years')
           on conflict (public_id) do update set confirmed_at = now()`,
          [intentId, ownerId, publicId]
        );

        const insertRes = await db.query(
          `insert into public.media_assets (id, asset_id, public_id, resource_type, format, bytes, width, height, owner_user_id, context, visibility)
           values ($1, $2, $3, 'image', $4, $5, $6, $7, $8, 'product', 'public')
           on conflict (public_id) do update set
             width = excluded.width, height = excluded.height, bytes = excluded.bytes, context = 'product', visibility = 'public'
           returning id`,
          [
            assetId,
            uploadRes.asset_id || assetId,
            publicId,
            uploadRes.format,
            uploadRes.bytes,
            uploadRes.width,
            uploadRes.height,
            ownerId
          ]
        );

        mediaId = insertRes.rows[0].id;
        mediaByHash.set(hash, mediaId);
        uploadedCount++;
        console.log(`   -> Uploaded to Cloudinary & registered media: ${mediaId}`);
      } else {
        reusedCount++;
        console.log(`   -> Reusing existing media: ${mediaId}`);
      }

      if (!firstMediaId) {
        firstMediaId = mediaId;
      }

      // Create or update Product
      let prodId = productByMediaId.get(mediaId);
      const priceMin = item.priceMin || 3200000;
      const priceMax = Math.round(priceMin * 1.5);
      const weightKg = 85 + (idx % 8) * 10;

      const description = `Heavy-gauge architectural steel and CNC fiber laser cut sheet with 0.1mm cutting precision. Finished with dual-layer anti-corrosion zinc phosphate primer and automotive-grade weather coating. Built to exact feet & inches.`;

      if (prodId) {
        await db.query(
          `update public.products
           set name = $1, category_id = $2, status = 'published', featured = true, custom_size = true,
               delivery_availability = 'available', installation_availability = 'available'
           where id = $3`,
          [item.title, targetCategoryId, prodId]
        );
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
             status = 'published'
           returning id`,
          [
            item.title,
            sku,
            slug,
            targetCategoryId,
            description,
            'Heavy Mild Steel & CNC Laser Cut Steel Panel',
            'Epoxy Zinc Primer + Matte Polyurethane Finish',
            weightKg,
            `CNC-${hash.toUpperCase()}`,
            'Computerized fiber laser cut double leaf gate with heavy pivot hinges and multi-locking drop bolts.',
            priceMin,
            priceMax
          ]
        );

        prodId = prodRes.rows[0].id;
        productByMediaId.set(mediaId, prodId);

        // Product Media
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
             ($1, 'Standard Residential Swing (10ft x 7ft)', $2 || '-V1', 3048, 2134, 'Matte Charcoal Black & Gold Leaf Accent', 'Dual Zinc Primer + PU Finish', $3, $4, 'published'),
             ($1, 'Wide Bungalow Compound Gate (14ft x 8ft)', $2 || '-V2', 4267, 2438, 'Matte Charcoal Black & Gold Leaf Accent', 'Dual Zinc Primer + PU Finish', $3 * 1.35, $4 * 1.35, 'published'),
             ($1, 'Heavy Luxury Double Leaf Entry (16ft x 9ft)', $2 || '-V3', 4877, 2743, 'Matte Charcoal Black & Gold Leaf Accent', 'Dual Zinc Primer + PU Finish', $3 * 1.7, $4 * 1.7, 'published')
           on conflict do nothing`,
          [prodId, sku, priceMin, priceMax]
        );

        // BOM & Rules
        if (defaultMaterialId) {
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
             values($1, 1, 110000, 45000, 300000, 250000, 300000, 1800, 10, 'draft')
             on conflict (product_id, version) do nothing
             returning id`,
            [prodId]
          );
          if (ruleRes.rows.length > 0) {
            await db.query(`update public.calculation_rules set status = 'published' where id = $1`, [ruleRes.rows[0].id]);
          }
        }

        createdCount++;
        console.log(`   -> Created new product [${sku}] ${item.title}`);
      }

      // Add to Gallery Items
      const galleryCheck = await db.query(`select id from public.gallery_items where media_id = $1 limit 1`, [mediaId]);
      if (galleryCheck.rows.length === 0) {
        await db.query(
          `insert into public.gallery_items(id, name, media_id, alt_text, category_id, consent_confirmed, status)
           values($1, $2, $3, $4, $5, true, 'published')`,
          [crypto.randomUUID(), item.title, mediaId, item.title, targetCategoryId]
        );
        console.log(`   -> Added to gallery items`);
      }
    }

    // Set Category banner image
    if (firstMediaId) {
      await db.query(`update public.categories set image_media_id = $1 where id = $2`, [firstMediaId, laserCatId]);
      console.log(`Updated category banner image for "Laser Cutting Gates"`);
    }

    console.log(`\n========================================`);
    console.log(`LASER CUTTING GATES INGESTION COMPLETE!`);
    console.log(`Total Curated: ${curated.length}`);
    console.log(`Cloudinary Uploaded: ${uploadedCount}`);
    console.log(`Media Reused: ${reusedCount}`);
    console.log(`Products Created: ${createdCount}`);
    console.log(`========================================`);
  } finally {
    await db.end();
  }
}

main().catch(console.error);
