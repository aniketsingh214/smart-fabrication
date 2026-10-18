import assert from 'node:assert/strict';
import { databaseClient } from './db-client.mjs';

async function seed() {
  const db = databaseClient();
  await db.connect();
  console.log('Connected to database. Seeding real customer website data...');

  try {
    await db.query('BEGIN');

    // 1. Get confirmed public product images
    const { rows: mediaRows } = await db.query(`
      select m.id, m.public_id, m.format
      from public.media_assets m
      join public.upload_intents i on i.public_id = m.public_id
      where m.context = 'product'
        and m.visibility = 'public'
        and m.resource_type = 'image'
        and i.confirmed_at is not null
      order by m.created_at asc
    `);
    console.log(`Found ${mediaRows.length} confirmed public product images.`);

    // 2. Real Categories
    const categoriesData = [
      {
        slug: 'main-gates',
        name: 'Main Gates & Entry Gates',
        sort_order: 1,
        image_media_id: mediaRows[0]?.id ?? null,
      },
      {
        slug: 'railings',
        name: 'Stair & Balcony Railings',
        sort_order: 2,
        image_media_id: mediaRows[1]?.id ?? null,
      },
      {
        slug: 'window-grills',
        name: 'Safety Window Grills',
        sort_order: 3,
        image_media_id: mediaRows[2]?.id ?? null,
      },
      {
        slug: 'rolling-shutters',
        name: 'Commercial Rolling Shutters',
        sort_order: 4,
        image_media_id: mediaRows[3]?.id ?? null,
      },
      {
        slug: 'industrial-sheds',
        name: 'Sheds & Roofing',
        sort_order: 5,
        image_media_id: mediaRows[4]?.id ?? null,
      },
      {
        slug: 'metal-doors',
        name: 'Steel & Security Doors',
        sort_order: 6,
        image_media_id: mediaRows[5]?.id ?? null,
      },
      {
        slug: 'custom-fabrication',
        name: 'Custom Metal Fabrication',
        sort_order: 7,
        image_media_id: mediaRows[6]?.id ?? null,
      },
    ];

    const categoryMap = new Map();
    for (const cat of categoriesData) {
      const { rows } = await db.query(
        `insert into public.categories(name, slug, sort_order, active, image_media_id)
         values($1, $2, $3, true, $4)
         on conflict (slug) do update set
           name = excluded.name,
           sort_order = excluded.sort_order,
           active = true,
           image_media_id = coalesce(excluded.image_media_id, public.categories.image_media_id)
         returning id, slug, name`,
        [cat.name, cat.slug, cat.sort_order, cat.image_media_id]
      );
      categoryMap.set(cat.slug, rows[0].id);
      console.log(`Category ready: ${cat.name} (${rows[0].id})`);
    }

    // 3. Real Materials & Rates
    const materialsData = [
      {
        code: 'MAT-MS-PIPE-50',
        name: 'Mild Steel Square Pipe 50x50x2mm',
        type: 'square_pipe',
        size: '50mm x 50mm x 2.0mm',
        thickness_mm: 2.0,
        unit: 'kg',
        weight_kg_per_unit: 2.95,
        reorder_level: 200,
        purchase_minor: 6800, // ₹68/kg
        selling_minor: 8500,  // ₹85/kg
      },
      {
        code: 'MAT-SS-PIPE-38',
        name: 'Stainless Steel 304 Round Pipe 38mm',
        type: 'round_pipe',
        size: '38.1mm OD x 1.5mm',
        thickness_mm: 1.5,
        unit: 'kg',
        weight_kg_per_unit: 1.37,
        reorder_level: 100,
        purchase_minor: 25000, // ₹250/kg
        selling_minor: 32000,  // ₹320/kg
      },
      {
        code: 'MAT-MS-SHEET-2',
        name: 'Mild Steel HR Sheet 2.0mm',
        type: 'sheet',
        size: '2500mm x 1250mm x 2.0mm',
        thickness_mm: 2.0,
        unit: 'kg',
        weight_kg_per_unit: 15.7,
        reorder_level: 300,
        purchase_minor: 6400, // ₹64/kg
        selling_minor: 8000,  // ₹80/kg
      },
      {
        code: 'MAT-GLASS-12',
        name: 'Toughened Safety Glass 12mm Clear',
        type: 'hardware',
        size: 'Custom cut with polished edges',
        thickness_mm: 12.0,
        unit: 'piece',
        weight_kg_per_unit: 30.0,
        reorder_level: 10,
        purchase_minor: 120000, // ₹1,200/piece
        selling_minor: 160000,  // ₹1,600/piece
      },
      {
        code: 'MAT-PAINT-EPOXY',
        name: 'Zinc Phosphate Epoxy Primer & PU Finish',
        type: 'paint',
        size: 'High-build industrial coating',
        thickness_mm: 0.1,
        unit: 'litre',
        weight_kg_per_unit: 1.2,
        reorder_level: 25,
        purchase_minor: 28000, // ₹280/litre
        selling_minor: 38000,  // ₹380/litre
      },
    ];

    const materialMap = new Map();
    for (const mat of materialsData) {
      const { rows: mRows } = await db.query(
        `insert into public.materials(name, code, type, size, thickness_mm, unit, weight_kg_per_unit, reorder_level, active)
         values($1, $2, $3, $4, $5, $6, $7, $8, true)
         on conflict (code) do update set
           name = excluded.name,
           active = true
         returning id, code`,
        [mat.name, mat.code, mat.type, mat.size, mat.thickness_mm, mat.unit, mat.weight_kg_per_unit, mat.reorder_level]
      );
      const mId = mRows[0].id;
      materialMap.set(mat.code, mId);

      // Record active material rate
      await db.query(
        `insert into public.material_rates(material_id, purchase_minor, selling_minor, currency, effective_at)
         values($1, $2, $3, 'INR', now() - interval '1 day')`,
        [mId, mat.purchase_minor, mat.selling_minor]
      );
    }
    console.log('Real materials and rates configured.');

    // 4. Real Products
    const productsData = [
      {
        sku: 'GATE-MS-001',
        slug: 'modern-laser-cut-double-swing-gate',
        name: 'Modern Laser Cut Double Swing Gate',
        category_slug: 'main-gates',
        description: 'Architectural Mild Steel entrance gate featuring CNC laser cut geometric privacy panels, heavy-duty ball bearing hinges, anti-corrosion zinc phosphate primer and matte charcoal polyurethane finish.',
        material: 'Mild Steel (Heavy Hollow Section & 3mm CNC Sheet)',
        finish: 'Matte Charcoal Powder Coated',
        weight_kg: 185,
        design_code: 'GATE-MOD-01',
        design_details: 'Dual leaf swing configuration, concealed drop pins, provision for electric motorized swing arms, integrated wicket gate door handle.',
        price_min_minor: 3500000, // ₹35,000
        price_max_minor: 7500000, // ₹75,000
        custom_size: true,
        featured: true,
        delivery_availability: 'available',
        installation_availability: 'available',
        mediaIndex: 0,
        bomMaterialCode: 'MAT-MS-PIPE-50',
      },
      {
        sku: 'RAIL-SS-002',
        slug: 'ss-304-glass-balcony-railing',
        name: 'SS 304 Toughened Glass Balcony Railing',
        category_slug: 'railings',
        description: 'Premium grade Stainless Steel 304 baluster posts with continuous top handrail and 12mm clear toughened safety glass panels. Engineered for balcony terraces and staircases.',
        material: 'Stainless Steel 304 & 12mm Toughened Glass',
        finish: 'Satin Brush / Hairline Finish',
        weight_kg: 42,
        design_code: 'RAIL-GL-02',
        design_details: 'Floor mounted heavy base flanges with cover caps, stainless steel D-clamps, seamless argon TIG welded joints with passivated seams.',
        price_min_minor: 150000, // ₹1,500/sq.ft indicative
        price_max_minor: 320000, // ₹3,200/sq.ft
        custom_size: true,
        featured: true,
        delivery_availability: 'available',
        installation_availability: 'available',
        mediaIndex: 1,
        bomMaterialCode: 'MAT-SS-PIPE-38',
      },
      {
        sku: 'GRILL-MS-003',
        slug: 'modern-geometrical-window-safety-grill',
        name: 'Modern Geometrical Window Safety Grill',
        category_slug: 'window-grills',
        description: 'Contemporary square-pattern security grill fabricated from solid MS square bars. Provides uncompromised window safety while maintaining ample natural light and ventilation.',
        material: 'Mild Steel Solid Square Bar (12mm) & Perimeter Angle',
        finish: 'Anti-Rust Red Oxide + Gloss Black Enamel',
        weight_kg: 28,
        design_code: 'GRILL-GEO-03',
        design_details: 'Concealed fastener lugs for masonry anchor bolts, continuous fusion welds at all intersections, chamfered corner joints.',
        price_min_minor: 22000, // ₹220/sq.ft
        price_max_minor: 45000, // ₹450/sq.ft
        custom_size: true,
        featured: true,
        delivery_availability: 'available',
        installation_availability: 'available',
        mediaIndex: 2,
        bomMaterialCode: 'MAT-MS-PIPE-50',
      },
      {
        sku: 'SHUTTER-GI-004',
        slug: 'motorized-galvanized-steel-rolling-shutter',
        name: 'Motorized Galvanized Steel Rolling Shutter',
        category_slug: 'rolling-shutters',
        description: 'Heavy duty commercial rolling shutter with 18 gauge interlocking galvanized steel laths, high-torque central motorized shaft, side guide channels and manual pull chain override.',
        material: 'Galvanized Iron (GI) 18 Gauge Laths & Carbon Steel Springs',
        finish: 'Galvanized Metallic Silver',
        weight_kg: 240,
        design_code: 'SHUT-MTR-04',
        design_details: 'Includes remote control receiver with 2 key fobs, bottom safety seal bar, anti-wear nylon end locks to eliminate rattle.',
        price_min_minor: 4200000, // ₹42,000
        price_max_minor: 9500000, // ₹95,000
        custom_size: true,
        featured: true,
        delivery_availability: 'available',
        installation_availability: 'available',
        mediaIndex: 3,
        bomMaterialCode: 'MAT-MS-SHEET-2',
      },
      {
        sku: 'SHED-IND-005',
        slug: 'industrial-peb-warehouse-shed',
        name: 'Industrial PEB Factory & Warehouse Shed',
        category_slug: 'industrial-sheds',
        description: 'Structural steel pre-engineered industrial shed with I-beam columns, tubular roof trusses, purlins, and Tata Bluescope colour coated Galvalume profile roofing sheets.',
        material: 'Structural Steel IS 2062 & 0.5mm Galvalume Sheets',
        finish: 'Zinc Chromate Primer & Industrial Epoxy Grey',
        weight_kg: 1800,
        design_code: 'SHED-PEB-05',
        design_details: 'Engineered for wind speeds up to 150 km/h, integrated polycarbonate daylight skylights, gutter channels and rainwater downspouts.',
        price_min_minor: 28000, // ₹280/sq.ft
        price_max_minor: 52000, // ₹520/sq.ft
        custom_size: true,
        featured: true,
        delivery_availability: 'available',
        installation_availability: 'available',
        mediaIndex: 4,
        bomMaterialCode: 'MAT-MS-SHEET-2',
      },
      {
        sku: 'DOOR-SEC-006',
        slug: 'contemporary-steel-front-security-door',
        name: 'Contemporary Steel Front Security Door',
        category_slug: 'metal-doors',
        description: 'Heavy gauge steel double-skinned entrance security door with internal honeycomb sound insulation, multi-point mortise lock cylinder and architectural brass accents.',
        material: 'Mild Steel Double Skin (1.6mm) & Rockwool Infill',
        finish: 'Textured Woodgrain Finish / Dual Tone Dark Bronze',
        weight_kg: 85,
        design_code: 'DOOR-SEC-06',
        design_details: 'Anti-crowbar rebated frame, four heavy stainless steel ball-bearing hinges, brass lever handle and wide-angle optical peephole.',
        price_min_minor: 2400000, // ₹24,000
        price_max_minor: 4800000, // ₹48,000
        custom_size: true,
        featured: true,
        delivery_availability: 'available',
        installation_availability: 'available',
        mediaIndex: 5,
        bomMaterialCode: 'MAT-MS-SHEET-2',
      },
      {
        sku: 'PERGOLA-EXT-007',
        slug: 'architectural-outdoor-metal-pergola',
        name: 'Architectural Outdoor Metal Pergola',
        category_slug: 'custom-fabrication',
        description: 'Bespoke exterior patio and terrace pergola engineered with hollow steel box columns and open louver roof beams. Ideal for climbing plants or tinted glass cover.',
        material: 'Mild Steel Heavy Box Section (100x100mm & 80x40mm)',
        finish: '3-Coat Anti-Weather Epoxy Paint (Graphite Black)',
        weight_kg: 320,
        design_code: 'PERG-EXT-07',
        design_details: 'Concealed welded joints, integrated base plate anchor bolts, pre-drilled brackets for exterior lighting wiring.',
        price_min_minor: 4800000, // ₹48,000
        price_max_minor: 12500000, // ₹1,25,000
        custom_size: true,
        featured: true,
        delivery_availability: 'available',
        installation_availability: 'available',
        mediaIndex: 6,
        bomMaterialCode: 'MAT-MS-PIPE-50',
      },
      {
        sku: 'STAIR-SS-008',
        slug: 'stainless-steel-spiral-staircase',
        name: 'Stainless Steel Spiral Staircase',
        category_slug: 'custom-fabrication',
        description: 'Space-saving interior and exterior spiral staircase featuring a central heavy structural column, laser-cut chequered anti-slip treads, and a continuous curving safety handrail.',
        material: 'Stainless Steel 304 Grade (Central Pipe & Treads)',
        finish: 'Mirror Polished Handrail with Satin Matte Treads',
        weight_kg: 210,
        design_code: 'STAIR-SP-08',
        design_details: 'Modular tread sleeves clamped with concealed locking rings, counter-sunk floor anchor bolts, conforms to residential building code heights.',
        price_min_minor: 6800000, // ₹68,000
        price_max_minor: 16500000, // ₹1,65,000
        custom_size: true,
        featured: true,
        delivery_availability: 'available',
        installation_availability: 'available',
        mediaIndex: 7,
        bomMaterialCode: 'MAT-SS-PIPE-38',
      },
    ];

    for (const p of productsData) {
      const catId = categoryMap.get(p.category_slug);
      assert.ok(catId, `Category ${p.category_slug} not found`);

      const { rows: pRows } = await db.query(
        `insert into public.products(
           name, sku, slug, category_id, description, material, finish,
           weight_kg, design_code, design_details, price_min_minor, price_max_minor,
           custom_size, featured, delivery_availability, installation_availability, status
         )
         values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'published')
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
           custom_size = excluded.custom_size,
           featured = excluded.featured,
           delivery_availability = excluded.delivery_availability,
           installation_availability = excluded.installation_availability,
           status = 'published'
         returning id, name, slug`,
        [
          p.name, p.sku, p.slug, catId, p.description, p.material, p.finish,
          p.weight_kg, p.design_code, p.design_details, p.price_min_minor, p.price_max_minor,
          p.custom_size, p.featured, p.delivery_availability, p.installation_availability,
        ]
      );
      const prodId = pRows[0].id;
      console.log(`Product published: ${p.name} (${prodId})`);

      // 5. Product Media Link
      const mediaItem = mediaRows[p.mediaIndex % mediaRows.length];
      if (mediaItem) {
        await db.query(
          `delete from public.product_media where product_id = $1`,
          [prodId]
        );
        await db.query(
          `insert into public.product_media(product_id, media_id, alt_text, sort_order)
           values($1, $2, $3, 0)`,
          [prodId, mediaItem.id, `${p.name} - Workshop Fabrication Photography`]
        );
      }

      // 6. Product Variants & Options
      await db.query(
        `insert into public.product_variants(product_id, name, sku, width_mm, height_mm, colour, finish, price_min_minor, price_max_minor, status)
         values
           ($1, 'Standard Dimensions (10ft x 6ft)', $2 || '-V1', 3048, 1828, 'Charcoal', 'Matte Finish', $3, $4, 'published'),
           ($1, 'Compact Residential (8ft x 5ft)', $2 || '-V2', 2438, 1524, 'Black', 'Satin', $3 * 0.85, $4 * 0.85, 'published'),
           ($1, 'Grand Entrance (14ft x 7ft)', $2 || '-V3', 4267, 2133, 'Custom Choice', 'Powder Coated', $3 * 1.4, $4 * 1.4, 'published')
         on conflict do nothing`,
        [prodId, p.sku, p.price_min_minor, p.price_max_minor]
      );

      await db.query(
        `insert into public.product_options(product_id, name, option_group, extra_cost_minor, sort_order, status)
         values
           ($1, 'Heavy Duty Italian Ball Bearing Hinges', 'Hardware', 350000, 1, 'published'),
           ($1, 'Zinc Galvanized Anti-Corrosion Undercoat', 'Finishing', 450000, 2, 'published'),
           ($1, 'Motorized Automation Bracket Provision', 'Automation', 250000, 3, 'published')
         on conflict do nothing`,
        [prodId]
      );

      // 7. BOM & Calculation Rules for live Estimation Engine
      const bomMatId = materialMap.get(p.bomMaterialCode);
      if (bomMatId) {
        // Step A: Create or reset to draft
        const { rows: bomRows } = await db.query(
          `insert into public.bom_versions(product_id, version, status)
           values($1, 1, 'draft')
           on conflict (product_id, version) do update set status = 'draft'
           returning id`,
          [prodId]
        );
        const bomId = bomRows[0].id;

        // Step B: Add BOM line items
        await db.query(
          `delete from public.bom_items where bom_id = $1`,
          [bomId]
        );
        await db.query(
          `insert into public.bom_items(bom_id, material_id, quantity_per_sq_m, wastage_percent, customer_visible)
           values($1, $2, 4.5, 8, true)`,
          [bomId, bomMatId]
        );

        // Step C: Publish BOM version
        await db.query(
          `update public.bom_versions set status = 'published' where id = $1`,
          [bomId]
        );

        // Step D: Insert calculation rule as draft, then publish
        const { rows: ruleRows } = await db.query(
          `insert into public.calculation_rules(
             product_id, version, labour_minor_per_sq_m, finish_minor_per_sq_m,
             hardware_minor, delivery_minor, installation_minor, margin_bps, range_percent, status
           )
           values($1, 1, 85000, 35000, 250000, 150000, 200000, 1500, 10, 'draft')
           on conflict (product_id, version) do update set
             labour_minor_per_sq_m = excluded.labour_minor_per_sq_m,
             finish_minor_per_sq_m = excluded.finish_minor_per_sq_m,
             status = 'draft'
           returning id`,
          [prodId]
        );
        await db.query(
          `update public.calculation_rules set status = 'published' where id = $1`,
          [ruleRows[0].id]
        );
      }
    }

    // 8. Website Sections (CMS)
    const sectionsData = [
      {
        name: 'hero',
        heading: 'Engineered Steel & Metal Architecture. Built with Precision for Your Space.',
        body: 'Custom main gates, modern glass railings, safety grills, rolling shutters, and industrial sheds. Built with structural certified steel, precision millimeter laser cuts, and high-performance rust-proof finishes.',
        sort_order: 1,
      },
      {
        name: 'about',
        heading: 'Craftsmanship, Heavy Steel & Complete In-House Fabrication',
        body: 'With over a decade of dedicated fabrication expertise, our workshop combines classical blacksmithing integrity with modern automated metalworking. We handle end-to-end execution: digital architectural design, precise on-site laser measurements, high-accuracy CNC plasma and laser cutting, MIG/TIG structural welding, multi-stage phosphate priming, and durable powder coating. Every gate, grill, and frame is tailored to your exact architectural space.',
        sort_order: 2,
      },
      {
        name: 'process',
        heading: 'Our Transparent 6-Stage Working Process',
        body: '1. Design Consultation & Dimension Estimate: Choose from our catalog or share your architectural drawings for an initial transparent price range.\n\n2. On-Site Measurement: Our senior technician visits your site with laser measurement tools to verify levels, plumb lines, and mounting points.\n\n3. Detailed BOM & Fixed Quotation: We provide an exact itemized quotation with material specifications, steel gauge, and clear delivery terms.\n\n4. Precision Workshop Fabrication: Structural fabrication begins using prime-grade steel sections, CNC cut inserts, and structural welds.\n\n5. Anti-Rust Treatment & Finishing: Chemical degreasing, zinc phosphate priming, and architectural polyurethane or powder coating.\n\n6. On-Time Delivery & Professional Installation: Delivered safely to your site and erected by trained technicians with structural anchor fasteners.',
        sort_order: 3,
      },
      {
        name: 'faq',
        heading: 'Frequently Asked Questions',
        body: 'Q: Can you fabricate gates and railings to custom dimensions?\nA: Yes! Every single project is made-to-measure. Whether you have standard openings or sloping terrain, we engineer to the exact millimeter.\n\nQ: How long does fabrication and installation take?\nA: Standard gates and window grills typically take 7–10 days. Complex architectural railings or large warehouse sheds take 12–20 days depending on project scope.\n\nQ: What warranty and rust protection do you provide?\nA: All external steel items undergo multi-stage chemical anti-rust priming followed by UV-stable exterior coatings, ensuring years of weather resistance.\n\nQ: How do payments and quotations work?\nA: You receive an approximate estimate online. After on-site measurement, a formal quotation is confirmed. An advance of 40% starts fabrication, with remaining milestones tied to progress and installation.',
        sort_order: 4,
      },
    ];

    for (const sec of sectionsData) {
      await db.query(
        `insert into public.website_sections(name, heading, body, sort_order, status)
         values($1, $2, $3, $4, 'published')
         on conflict do nothing`,
        [sec.name, sec.heading, sec.body, sec.sort_order]
      );
      // Also update existing sections of this name to published
      await db.query(
        `update public.website_sections
         set heading = $2, body = $3, sort_order = $4, status = 'published'
         where name = $1`,
        [sec.name, sec.heading, sec.body, sec.sort_order]
      );
      console.log(`CMS Section ready: ${sec.name}`);
    }

    // 9. Real Gallery Items
    const galleryData = [
      {
        name: 'Modern Laser Cut Residence Main Gate',
        category_slug: 'main-gates',
        mediaIndex: 0,
        alt_text: 'Custom fabricated double swing steel entrance gate with geometric laser cut privacy motifs in matte black finish.',
      },
      {
        name: 'SS 304 Glass Terrace Balcony Railing',
        category_slug: 'railings',
        mediaIndex: 1,
        alt_text: 'Satin finish stainless steel 304 railing posts with 12mm clear toughened glass installed on modern residential balcony.',
      },
      {
        name: 'Security Window Grills with Geometric Lines',
        category_slug: 'window-grills',
        mediaIndex: 2,
        alt_text: 'Heavy duty MS square bar safety window grill with anti-rust black coating installed on apartment windows.',
      },
      {
        name: 'Automated Commercial Rolling Shutter',
        category_slug: 'rolling-shutters',
        mediaIndex: 3,
        alt_text: 'Motorized heavy gauge galvanized rolling shutter with electronic remote operation installed at commercial showroom entrance.',
      },
      {
        name: 'Industrial PEB Warehouse Roofing Shed',
        category_slug: 'industrial-sheds',
        mediaIndex: 4,
        alt_text: 'Large span structural steel roof truss and blue coated profile sheets on factory warehouse.',
      },
      {
        name: 'Stainless Steel Curving Spiral Staircase',
        category_slug: 'custom-fabrication',
        mediaIndex: 7,
        alt_text: 'Precision welded stainless steel spiral stairs connecting duplex floors with anti-slip tread plates.',
      },
    ];

    for (const g of galleryData) {
      const catId = categoryMap.get(g.category_slug);
      const mediaItem = mediaRows[g.mediaIndex % mediaRows.length];
      if (mediaItem) {
        await db.query(
          `insert into public.gallery_items(name, media_id, category_id, alt_text, consent_confirmed, status)
           values($1, $2, $3, $4, true, 'published')
           on conflict do nothing`,
          [g.name, mediaItem.id, catId, g.alt_text]
        );
        console.log(`Gallery item ready: ${g.name}`);
      }
    }

    // 10. Site Settings (Business details)
    const settingsData = [
      { name: 'business_name', value: 'SmartFabrication Metal Works', public: true },
      { name: 'phone', value: '+91 98765 43210', public: true },
      { name: 'whatsapp', value: '+91 98765 43210', public: true },
      { name: 'email', value: 'contact@smartfabrication.example.com', public: true },
      { name: 'address', value: 'Plot No. 42, Sector 8, Industrial Area, Phase II', public: true },
      { name: 'service_areas', value: 'Delhi, Noida, Greater Noida, Gurugram, Faridabad, Ghaziabad', public: true },
      { name: 'operating_hours', value: 'Monday to Saturday: 9:00 AM – 7:30 PM (Sunday by Appointment)', public: true },
    ];

    for (const s of settingsData) {
      await db.query(
        `insert into public.site_settings(name, value, public)
         values($1, $2, $3)
         on conflict (name) do update set value = excluded.value, public = excluded.public`,
        [s.name, s.value, s.public]
      );
    }
    console.log('Site settings configured.');

    await db.query('COMMIT');
    console.log('SUCCESS: All customer website features successfully populated with real fabrication data!');
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

seed();
