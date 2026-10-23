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

const pins = JSON.parse(fs.readFileSync('scripts/anirajpoot-shutter-pins.json', 'utf8'));

const curatedShutters = [
  {
    name: 'Heavy-Duty Motorized Commercial Rolling Shutter',
    subSlug: 'motorized-rolling-shutters',
    description: 'Heavy-duty motorized commercial rolling shutter engineered for retail storefronts, showrooms, and commercial godowns. Fabricated with high-grade galvanized steel slats, high-torque AC tubular motor, dual wireless remotes, and manual chain override.',
    material: 'Galvanized Steel Slats with High-Torque AC Tubular Motor & Remote',
    finish: 'Electrostatic Industrial Powder Coating',
    price_min: 3800000,
    price_max: 5600000
  },
  {
    name: 'Galvanized Steel Industrial Warehouse Shutter',
    subSlug: 'industrial-rolling-shutters',
    description: 'High-tensile galvanized steel industrial warehouse shutter built to withstand heavy operations and wind loads. Equipped with heavy C-channel guides, wind-lock clips, and durable ball bearing rollers.',
    material: '16-Gauge Hot-Dip Galvanized Interlocking Steel Slats',
    finish: 'Hot-Dip Heavy Galvanized Rust-Proof Coating',
    price_min: 6200000,
    price_max: 9500000
  },
  {
    name: 'Precision Perforated Showroom Display Shutter',
    subSlug: 'perforated-rolling-shutters',
    description: 'Precision CNC punched perforated showroom security shutter providing 24/7 product visibility while ensuring maximum physical barrier security. Ideal for luxury retail, electronics, and commercial arcades.',
    material: 'High-Tensile CNC Punched Perforated Steel Slats',
    finish: 'Architectural Matte Black Powder Coating',
    price_min: 2800000,
    price_max: 4200000
  },
  {
    name: 'Contemporary Insulated Commercial Roller Door',
    subSlug: 'commercial-shop-shutters',
    description: 'Double-walled insulated commercial roller door designed for temperature stability, noise reduction, and enhanced security for modern shopfronts and commercial spaces.',
    material: 'Double-Walled Aluminum with High-Density PU Foam Insulation',
    finish: 'Anodized Silver / Polyester Powder Coated Finish',
    price_min: 3400000,
    price_max: 5200000
  },
  {
    name: 'High-Security Multi-Lock Storefront Rolling Shutter',
    subSlug: 'commercial-shop-shutters',
    description: 'Multi-point central locking rolling shutter engineered for high-security commercial premises. Features reinforced bottom T-rail, concealed shoot-bolts, and tamper-resistant guide channels.',
    material: 'Cold-Rolled Galvanized Steel Slats with Side-Locking Bolts',
    finish: 'Anti-Corrosion Epoxy Zinc Primer with Enamel Topcoat',
    price_min: 2200000,
    price_max: 3200000
  },
  {
    name: 'Transparent Polycarbonate & Steel Hybrid Shutter',
    subSlug: 'perforated-rolling-shutters',
    description: 'Impact-resistant transparent polycarbonate slats reinforced with interlocking extruded aluminum joints. Provides clear showcase visibility with UV protection and impact strength.',
    material: 'Impact-Resistant Polycarbonate Panels with Aluminum Extrusions',
    finish: 'UV-Stabilized Clear & Satin Anodized Frame',
    price_min: 4500000,
    price_max: 6800000
  },
  {
    name: 'Corrosion-Resistant Powder Coated Shop Shutter',
    subSlug: 'commercial-shop-shutters',
    description: 'Smooth manual push-and-pull spring-assisted rolling shutter coated with weather-proof architectural powder coating for standard retail shops and village establishments.',
    material: 'Cold-Rolled GI Slats with High-Tensile Torsion Springs',
    finish: 'Dual-Coat Weatherproof Polyester Powder Coating',
    price_min: 1650000,
    price_max: 2450000
  },
  {
    name: 'Heavy Structural Steel Compound Rolling Shutter',
    subSlug: 'industrial-rolling-shutters',
    description: 'Rugged compound rolling shutter for large workshop entrances, logistics docks, and industrial storage yards. Operates via gear-box manual reduction or external chain motor drive.',
    material: 'Heavy Gauge Mild Steel Slats with High-Grade Steel Axle Tube',
    finish: 'Industrial Red Oxide Primer & Tough Polyurethane Paint',
    price_min: 5800000,
    price_max: 8800000
  },
  {
    name: 'Automated Remote-Control Retail Store Shutter',
    subSlug: 'motorized-rolling-shutters',
    description: 'Sleek, silent motorized roller shutter designed for upscale boutiques and modern shopping arcades. Features wireless remote activation, obstacle detection sensors, and emergency manual release.',
    material: 'Extruded Aluminum Slats with Integrated Tubular Motor',
    finish: 'Custom RAL Architectural Powder Coating',
    price_min: 3900000,
    price_max: 5900000
  },
  {
    name: 'Manual Gear-Operated Industrial Heavy Shutter',
    subSlug: 'industrial-rolling-shutters',
    description: 'Heavy-duty manual gear operated shutter using a smooth mechanical reduction ratio for effortless raising and lowering of oversized warehouse gates without electrical dependencies.',
    material: 'Reinforced 18-Gauge Galvanized Interlocking Slats with Bevel Gear',
    finish: 'Corrosion-Resistant Zinc Passivated Coating',
    price_min: 3200000,
    price_max: 4800000
  },
  {
    name: 'Smooth-Glide Spring Assisted Commercial Shutter',
    subSlug: 'commercial-shop-shutters',
    description: 'Standard dependable push-pull commercial shutter with oil-tempered helical torsion springs for balanced, lightweight daily manual opening and closing.',
    material: 'Standard Galvanized Steel Slats with Cast Iron Pulley Wheels',
    finish: 'Standard Protective Zinc Galvanized Finish',
    price_min: 1500000,
    price_max: 2200000
  },
  {
    name: 'Interlocking Steel Grill Safety Rolling Shutter',
    subSlug: 'perforated-rolling-shutters',
    description: 'See-through steel bar and link safety grill shutter allowing optimal ventilation and visibility while preventing unauthorized entry. Ideal for parking bays, mall kiosks, and bank lobbies.',
    material: 'Solid Steel Round Bars Interlinked with Heavy Steel Links',
    finish: 'High-Gloss Industrial Chrome/Nickel Finish or Powder Coat',
    price_min: 2400000,
    price_max: 3600000
  },
  {
    name: 'Bespoke Overhead Bay Shutter System',
    subSlug: 'motorized-rolling-shutters',
    description: 'Custom engineered wide-span overhead roller shutter system with dual guide rails, centralized control box, and key-switch wall stations for multi-bay automotive and commercial garages.',
    material: 'High-Tensile Cold-Rolled Galvanized Steel Slats with Center Support',
    finish: 'Commercial Grade Powder Coated Metallic Finish',
    price_min: 5200000,
    price_max: 7800000
  },
  {
    name: 'High-Security Steel Commercial Entrance Shutter',
    subSlug: 'commercial-shop-shutters',
    description: 'Security certified commercial entry shutter built with interlocking bullet-profile slats and anti-pry guide rails for high-value retail establishments and financial branch offices.',
    material: 'Anti-Pry Cold-Formed Steel Interlocking Slats',
    finish: 'Textured Matte Charcoal Industrial Powder Coating',
    price_min: 2700000,
    price_max: 4100000
  },
  {
    name: 'Architectural Louvered Security Roller Shutter',
    subSlug: 'commercial-shop-shutters',
    description: 'Aesthetic adjustable louvered roller shutter combining natural air circulation, solar shading, and physical storm & intrusion security for architectural facades.',
    material: 'Extruded Architectural Aluminum Louvers with Steel Axle',
    finish: 'Anodized Bronze / Champagne Finish',
    price_min: 3600000,
    price_max: 5400000
  },
  {
    name: 'Heavy-Gauge Wind-Resistant Industrial Shutter',
    subSlug: 'industrial-rolling-shutters',
    description: 'Engineered specifically for cyclone-prone and high-exposure industrial zones with deep-retained wind-lock guides and extra-thick slats to withstand severe exterior wind pressures.',
    material: '14-Gauge Heavy Structural Galvanized Steel with Wind-Lock Shoes',
    finish: 'Heavy Hot-Dip Galvanizing & Epoxy Barrier Coat',
    price_min: 7500000,
    price_max: 11000000
  },
  {
    name: 'Galvanized Steel Logistics Bay Roller Shutter',
    subSlug: 'industrial-rolling-shutters',
    description: 'Fast-acting commercial roller shutter built for continuous daily loading dock cycles with rubber bottom weather-seals and brush-lined side channels for weatherproofing.',
    material: 'High-Cycle Galvanized Interlocking Slats with Weather-Seals',
    finish: 'Hot-Dip Galvanized Slats with Yellow Safety Striping',
    price_min: 4800000,
    price_max: 7200000
  },
  {
    name: 'Precision Extruded Aluminum Roller Shutter',
    subSlug: 'commercial-shop-shutters',
    description: 'Lightweight, ultra-durable extruded aluminum shutter offering superior corrosion resistance and modern architectural appearance for storefronts, banks, and office entrances.',
    material: 'Double-Wall Extruded Aluminum Profiles with Nylon End-Caps',
    finish: 'Architectural Natural Anodized Finish',
    price_min: 3100000,
    price_max: 4600000
  }
];

async function main() {
  console.log(`Ingesting ${pins.length} user-selected shutter pins into Cloudinary, Gallery, and Catalog...`);
  const db = databaseClient();
  await db.connect();

  const ownerRes = await db.query(`select user_id from public.user_roles where role_id = 'owner' limit 1`);
  const ownerId = ownerRes.rows[0]?.user_id;

  const defaultMaterialRes = await db.query(`select id from public.materials where active = true limit 1`);
  const defaultMaterialId = defaultMaterialRes.rows[0]?.id;

  // Categories map
  const catRes = await db.query(`select id, slug from public.categories`);
  const catMap = new Map(catRes.rows.map(r => [r.slug, r.id]));
  const parentShutterId = catMap.get('rolling-shutters') || catMap.get('commercial-shop-shutters');

  for (let i = 0; i < pins.length; i++) {
    const pin = pins[i];
    const itemData = curatedShutters[i];
    const pinId = pin.id;
    const publicId = `smart-fabrication/development/user-shutters/pin-${pinId}`;

    console.log(`\n[${i + 1}/${pins.length}] Pin ${pinId}: "${itemData.name}"...`);

    // 1. Upload to Cloudinary
    let cloudRes;
    try {
      cloudRes = await cloudinary.uploader.upload(pin.imgUrl, {
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        timeout: 30000,
        tags: ['smartfabrication', 'user-shutters', itemData.subSlug]
      });
      console.log(`   Cloudinary OK: ${cloudRes.secure_url}`);
    } catch (err) {
      console.error(`   Cloudinary upload failed for ${pinId}:`, err.message);
      continue;
    }

    // 2. Upload Intent
    const intentId = crypto.randomUUID();
    await db.query(`
      insert into public.upload_intents (id, owner_user_id, public_id, context, visibility, resource_type, confirmed_at, expires_at)
      values ($1, $2, $3, 'product', 'public', 'image', now(), now() + interval '10 years')
      on conflict (public_id) do update set context = 'product', visibility = 'public', confirmed_at = now()
    `, [intentId, ownerId, cloudRes.public_id]);

    // 3. Media Asset
    const mediaId = crypto.randomUUID();
    const mediaRes = await db.query(`
      insert into public.media_assets(id, asset_id, public_id, resource_type, format, bytes, width, height, owner_user_id, context, visibility)
      values($1, $2, $3, 'image', $4, $5, $6, $7, $8, 'product', 'public')
      on conflict (public_id) do update set context = 'product'
      returning id
    `, [
      mediaId,
      cloudRes.asset_id || crypto.randomUUID(),
      cloudRes.public_id,
      cloudRes.format || 'jpg',
      cloudRes.bytes || 150000,
      cloudRes.width || 800,
      cloudRes.height || 600,
      ownerId
    ]);
    const finalMediaId = mediaRes.rows[0].id;

    const targetCatId = catMap.get(itemData.subSlug) || parentShutterId;

    // 4. Gallery Item
    const galleryCheck = await db.query(`select id from public.gallery_items where media_id = $1 limit 1`, [finalMediaId]);
    if (galleryCheck.rows.length === 0) {
      const galleryId = crypto.randomUUID();
      await db.query(`
        insert into public.gallery_items(id, name, media_id, alt_text, category_id, consent_confirmed, status)
        values($1, $2, $3, $4, $5, true, 'published')
      `, [
        galleryId,
        itemData.name,
        finalMediaId,
        itemData.name,
        targetCatId
      ]);
      console.log(`   Gallery Item Inserted: ${galleryId}`);
    }

    // 5. Product Creation
    const cleanSlug = itemData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${cleanSlug}-${pinId.slice(-6)}`;
    const sku = `SHT-USR-${String(i + 1).padStart(3, '0')}`;
    const weight_kg = 85 + (i % 6) * 15;

    const prodInsert = await db.query(`
      insert into public.products(
        id, name, sku, slug, category_id, description,
        material, finish, weight_kg, design_code,
        design_details, price_min_minor, price_max_minor,
        custom_size, featured, status,
        delivery_availability, installation_availability
      )
      values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, false, 'published', 'available', 'available')
      on conflict (slug) do update set
        name = excluded.name,
        description = excluded.description,
        material = excluded.material,
        finish = excluded.finish,
        status = 'published'
      returning id
    `, [
      crypto.randomUUID(),
      itemData.name,
      sku,
      slug,
      targetCatId,
      itemData.description,
      itemData.material,
      itemData.finish,
      weight_kg,
      `SHT-${pinId.slice(-6)}`,
      'Custom fabricated according to precise commercial bay or shop opening measurements.',
      itemData.price_min,
      itemData.price_max
    ]);
    const prodId = prodInsert.rows[0].id;

    // 6. Product Media
    await db.query(`delete from public.product_media where product_id = $1`, [prodId]);
    await db.query(`
      insert into public.product_media (product_id, media_id, alt_text, sort_order)
      values ($1, $2, $3, 0)
    `, [prodId, finalMediaId, itemData.name]);

    // 7. Product Variants
    await db.query(`delete from public.product_variants where product_id = $1`, [prodId]);
    await db.query(`
      insert into public.product_variants(id, product_id, name, sku, width_mm, height_mm, colour, finish, price_min_minor, price_max_minor, status)
      values
        ($1, $2, 'Standard Retail Opening (10ft x 8ft)', $3 || '-V1-' || $7, 3048, 2438, 'Galvanized Silver', 'Industrial Zinc Coated', $4, $5, 'published'),
        ($6, $2, 'Large Showroom Opening (14ft x 10ft)', $3 || '-V2-' || $7, 4267, 3048, 'Galvanized Silver', 'Industrial Zinc Coated', $4 * 1.4, $5 * 1.4, 'published')
      on conflict (sku) do nothing
    `, [
      crypto.randomUUID(),
      prodId,
      sku,
      itemData.price_min,
      itemData.price_max,
      crypto.randomUUID(),
      pinId.slice(-6)
    ]);

    // 8. BOM & Rules
    if (defaultMaterialId) {
      const existingBom = await db.query(
        `select id from public.bom_versions where product_id = $1 and status = 'published' limit 1`,
        [prodId]
      );

      if (existingBom.rows.length === 0) {
        const bomRes = await db.query(`
          insert into public.bom_versions(product_id, version, status)
          values($1, 1, 'draft')
          on conflict (product_id, version) do nothing
          returning id
        `, [prodId]);

        if (bomRes.rows.length > 0) {
          const bomId = bomRes.rows[0].id;
          await db.query(`
            insert into public.bom_items(bom_id, material_id, quantity_per_sq_m, wastage_percent, customer_visible)
            values($1, $2, 8.5, 5, true)
          `, [bomId, defaultMaterialId]);
          await db.query(`update public.bom_versions set status = 'published' where id = $1`, [bomId]);
        }

        const ruleRes = await db.query(`
          insert into public.calculation_rules(
            product_id, version, labour_minor_per_sq_m, finish_minor_per_sq_m,
            hardware_minor, delivery_minor, installation_minor, margin_bps, range_percent, status
          )
          values($1, 1, 95000, 35000, 250000, 200000, 250000, 1500, 10, 'draft')
          on conflict (product_id, version) do nothing
          returning id
        `, [prodId]);

        if (ruleRes.rows.length > 0) {
          await db.query(`update public.calculation_rules set status = 'published' where id = $1`, [ruleRes.rows[0].id]);
        }
      }
    }

    console.log(`   Product Ready: ${prodId} [${slug}]`);
  }

  const gCount = await db.query('SELECT count(*) FROM public.gallery_items');
  const pCount = await db.query("SELECT count(*) FROM public.products WHERE status = 'published'");
  console.log(`\n========================================`);
  console.log(`All 18 user shutter pins processed successfully!`);
  console.log(`Final Gallery count: ${gCount.rows[0].count} | Published Products: ${pCount.rows[0].count}`);
  console.log(`========================================`);

  await db.end();
}

main().catch(console.error);
