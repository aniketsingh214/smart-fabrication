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

const mappings = [
  {
    localFile: 'peb_warehouse_shed_1792298289073.jpg',
    publicId: 'smart-fabrication/development/demo-stock/peb-warehouse-shed',
    title: 'Industrial PEB Factory & Warehouse Shed',
    productSlug: 'industrial-peb-warehouse-shed',
    categorySlug: 'industrial-sheds',
    galleryName: 'Industrial PEB Warehouse Roofing Shed',
    alt: 'Structural steel pre-engineered industrial warehouse shed with tubular roof trusses and profile roofing'
  },
  {
    localFile: 'ss_glass_railing_1792298307827.jpg',
    publicId: 'smart-fabrication/development/demo-stock/ss-glass-railing',
    title: 'SS 304 Toughened Glass Balcony Railing',
    productSlug: 'ss-304-glass-balcony-railing',
    categorySlug: 'railings',
    galleryName: 'SS 304 Glass Terrace Balcony Railing',
    alt: 'Luxury residential balcony with satin finish SS 304 stainless steel posts and 12mm clear toughened glass'
  },
  {
    localFile: 'outdoor_metal_pergola_1792298328170.jpg',
    publicId: 'smart-fabrication/development/demo-stock/outdoor-metal-pergola',
    title: 'Architectural Outdoor Metal Pergola',
    productSlug: 'architectural-outdoor-metal-pergola',
    categorySlug: 'custom-fabrication',
    galleryName: null,
    alt: 'Bespoke modern architectural outdoor patio metal pergola with matte black steel box section beams'
  },
  {
    localFile: 'laser_swing_gate_1792298350982.jpg',
    publicId: 'smart-fabrication/development/demo-stock/laser-swing-gate',
    title: 'Modern Laser Cut Double Swing Gate',
    productSlug: 'modern-laser-cut-double-swing-gate',
    categorySlug: 'main-gates',
    galleryName: 'Modern Laser Cut Residence Main Gate',
    alt: 'Luxury architectural double swing steel entrance driveway gate with geometric laser-cut CNC panels'
  },
  {
    localFile: 'spiral_staircase_1792298370663.jpg',
    publicId: 'smart-fabrication/development/demo-stock/spiral-staircase',
    title: 'Stainless Steel Spiral Staircase',
    productSlug: 'stainless-steel-spiral-staircase',
    categorySlug: null,
    galleryName: 'Stainless Steel Curving Spiral Staircase',
    alt: 'Custom architectural stainless steel spiral staircase with brushed steel treads and satin curved handrail'
  },
  {
    localFile: 'steel_security_door_1792298392142.jpg',
    publicId: 'smart-fabrication/development/demo-stock/steel-security-door',
    title: 'Contemporary Steel Front Security Door',
    productSlug: 'contemporary-steel-front-security-door',
    categorySlug: 'metal-doors',
    galleryName: null,
    alt: 'Contemporary architectural steel front security door with walnut woodgrain infill and long brass handle'
  },
  {
    localFile: 'window_safety_grill_1792298416994.jpg',
    publicId: 'smart-fabrication/development/demo-stock/window-safety-grill',
    title: 'Modern Geometrical Window Safety Grill',
    productSlug: 'modern-geometrical-window-safety-grill',
    categorySlug: 'window-grills',
    galleryName: 'Security Window Grills with Geometric Lines',
    alt: 'Modern geometric pattern mild steel window safety grill with anti-rust matte black powder coating'
  },
  {
    localFile: 'rolling_shutter_1792298445869.jpg',
    publicId: 'smart-fabrication/development/demo-stock/rolling-shutter',
    title: 'Motorized Galvanized Steel Rolling Shutter',
    productSlug: 'motorized-galvanized-steel-rolling-shutter',
    categorySlug: 'rolling-shutters',
    galleryName: 'Automated Commercial Rolling Shutter',
    alt: 'Commercial motorized galvanized steel rolling shutter door with precision interlocking slats'
  }
];

async function main() {
  console.log('1. Connecting to PostgreSQL...');
  const db = databaseClient();
  await db.connect();

  console.log('2. Uploading demo images to Cloudinary and registering assets...');
  for (const item of mappings) {
    const fullLocalPath = path.join(artifactDir, item.localFile);
    if (!fs.existsSync(fullLocalPath)) {
      console.warn(`File missing: ${fullLocalPath}`);
      continue;
    }

    console.log(`Uploading ${item.title} to Cloudinary as ${item.publicId}...`);
    const uploadRes = await cloudinary.uploader.upload(fullLocalPath, {
      public_id: item.publicId,
      resource_type: 'image',
      overwrite: true,
      tags: ['smartfabrication-demo-showcase'],
      context: {
        title: item.title,
        alt: item.alt,
        demo: 'true'
      }
    });

    console.log(`Cloudinary uploaded: ${uploadRes.secure_url} (${uploadRes.width}x${uploadRes.height})`);

    // Ensure upload intent & media asset in database
    const intentId = crypto.randomUUID();
    const assetId = crypto.randomUUID();

    // Check if media asset already exists with this public_id
    const existing = await db.query(
      `select id from public.media_assets where public_id = $1`,
      [item.publicId]
    );

    let mediaId;
    if (existing.rows.length > 0) {
      mediaId = existing.rows[0].id;
      await db.query(
        `update public.media_assets
         set width = $1, height = $2, bytes = $3, format = $4, resource_type = 'image', visibility = 'public'
         where id = $5`,
        [uploadRes.width, uploadRes.height, uploadRes.bytes, uploadRes.format, mediaId]
      );
      console.log(`Updated media asset ${mediaId}`);
    } else {
      // Find an owner user
      const ownerRes = await db.query(
        `select user_id from public.user_roles where role_id = 'owner' limit 1`
      );
      const ownerId = ownerRes.rows[0]?.user_id;

      await db.query(
        `insert into public.upload_intents (id, owner_user_id, public_id, context, visibility, resource_type, confirmed_at, expires_at)
         values ($1, $2, $3, 'product', 'public', 'image', now(), now() + interval '10 years')
         on conflict (public_id) do update set confirmed_at = now()`,
        [intentId, ownerId, item.publicId]
      );

      const inserted = await db.query(
        `insert into public.media_assets (id, asset_id, public_id, resource_type, format, bytes, width, height, owner_user_id, context, visibility)
         values ($1, $2, $3, 'image', $4, $5, $6, $7, $8, 'product', 'public')
         returning id`,
        [assetId, uploadRes.asset_id || crypto.randomUUID(), item.publicId, uploadRes.format, uploadRes.bytes, uploadRes.width, uploadRes.height, ownerId]
      );
      mediaId = inserted.rows[0].id;
      console.log(`Inserted media asset ${mediaId}`);
    }

    // 3. Link to Product
    if (item.productSlug) {
      const prodRes = await db.query(
        `select id from public.products where slug = $1`,
        [item.productSlug]
      );
      if (prodRes.rows.length > 0) {
        const prodId = prodRes.rows[0].id;
        await db.query(`delete from public.product_media where product_id = $1`, [prodId]);
        await db.query(
          `insert into public.product_media (product_id, media_id, alt_text, sort_order)
           values ($1, $2, $3, 0)`,
          [prodId, mediaId, item.alt]
        );
        console.log(`Linked product '${item.productSlug}' to media ${mediaId}`);
      }
    }

    // 4. Link to Category
    if (item.categorySlug) {
      await db.query(
        `update public.categories set image_media_id = $1 where slug = $2`,
        [mediaId, item.categorySlug]
      );
      console.log(`Linked category '${item.categorySlug}' to media ${mediaId}`);
    }

    // 5. Link to Gallery Item
    if (item.galleryName) {
      await db.query(
        `update public.gallery_items set media_id = $1, alt_text = $2 where name = $3`,
        [mediaId, item.alt, item.galleryName]
      );
      console.log(`Linked gallery item '${item.galleryName}' to media ${mediaId}`);
    }
  }

  await db.end();
  console.log('SUCCESS: All real demo images uploaded and linked!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
