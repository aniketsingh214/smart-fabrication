import { databaseClient } from './db-client.mjs';

const RENAMES = [
  {
    id: 'cf073452-b9d3-4cd9-8de6-0795211c1926',
    name: 'Modern Steel Balcony Safety Grill',
    alt: 'Modern minimalist steel balcony safety grill'
  },
  {
    id: '3f636fa5-0168-4310-8783-af5a1612475c',
    name: 'Architectural SS 304 Window Safety Grill',
    alt: 'Stainless steel 304 window safety grill'
  },
  {
    id: 'fcbcc814-7123-4403-86d3-6ddd91ba9240',
    name: 'Artisan Handcrafted Iron Security Front Door',
    alt: 'Handcrafted wrought iron security door'
  },
  {
    id: 'd1a9cd1d-50e6-419f-8d42-4d1874986812',
    name: 'Geometric Steel Box Window Grill',
    alt: 'Geometric modern box window grill'
  },
  {
    id: 'e868e34b-5505-4722-a151-8e300f1763df',
    name: 'Modern Heavy Duty Sliding Compound Gate',
    alt: 'Heavy duty sliding compound gate'
  },
  {
    id: 'e1b1d63e-af61-4c59-99e0-e970f8eae9e6',
    name: 'Classic Minimalist Steel Pipe Balustrade',
    alt: 'Steel pipe balustrade for terrace and stairs'
  },
  {
    id: 'd8a2051d-c354-4ced-af56-fc7c1a50cfd0',
    name: 'Diagonal Line Thermal Break Wrought Iron Door',
    alt: 'Diagonal line wrought iron security door'
  },
  {
    id: '60365a2b-905a-4c41-a690-33efbeef7053',
    name: 'Contemporary MS Steel Compound Main Gate',
    alt: 'Contemporary MS steel compound main gate'
  },
  {
    id: '31ec455e-d029-4823-9545-16aeb34ba550',
    name: 'Precision Geometric Stair Safety Grill',
    alt: 'Geometric stair safety grill'
  },
  {
    id: '4303ba66-efad-4c29-abf1-8bbe281272fb',
    name: 'Modern SS Staircase Baluster Handrail',
    alt: 'Modern stainless steel staircase handrail'
  },
  {
    id: '3ec3ca32-0c19-4a05-abfb-cf745ce0364d',
    name: 'Contemporary Balcony Steel Boundary Grill',
    alt: 'Balcony steel boundary grill'
  },
  {
    id: '5494aee7-d470-48c7-bd2c-213d9b41748b',
    name: 'CNC Laser Cut Architectural Safety Grill Door',
    alt: 'CNC laser cut decorative safety grill door'
  },
  {
    id: 'c974cab4-06cc-4a25-b03f-45a1ccae2a83',
    name: 'Modern Toughened Glass and SS Balcony Railing',
    alt: 'Toughened glass and stainless steel balcony railing'
  },
  {
    id: '2428aa5e-111d-4037-96d6-4f0fdfce9faa',
    name: 'Premium Stainless Steel Balcony Railing',
    alt: 'Premium stainless steel balcony railing'
  },
  {
    id: '0ea411e4-0fc5-4c4e-bae3-5234cddbaaf9',
    name: 'Contemporary Black and Gold Window Safety Grill',
    alt: 'Contemporary black and gold window grill'
  },
  {
    id: '10af5955-4046-4879-b4aa-e898875be524',
    name: 'Architectural Stainless Steel and Glass Railing',
    alt: 'Stainless steel and glass railing'
  },
  {
    id: '97248d02-79a4-4c1c-8ff5-b2412da03e0d',
    name: 'Custom Fabricated SS 304 Glass Balustrade',
    alt: 'Custom fabricated stainless steel glass balustrade'
  },
  {
    id: '7bb90ef7-21b3-41b0-be86-5246b08e8c57',
    name: 'High-Security Solid Wrought Iron Main Door',
    alt: 'High-security solid wrought iron main door'
  },
  {
    id: '7b114139-81c1-4250-85ea-153208f4d437',
    name: 'Modern Farmhouse Outdoor Porch Pipe Railing',
    alt: 'Modern outdoor porch pipe railing'
  },
  {
    id: '0f558bd7-190a-4dae-be36-aa313a7c0cd7',
    name: 'Sleek Frameless Glass Balustrade with SS Top Rail',
    alt: 'Frameless glass balustrade with stainless steel top rail'
  },
  {
    id: 'a9f35175-ff75-4c76-874e-ee1a324b4fb7',
    name: 'Scrollwork Matte-Black Security Entry Door',
    alt: 'Scrollwork matte-black security front door'
  },
  {
    id: 'fe95d259-919c-4f30-b144-1eecf54bc501',
    name: 'Dual Casement Heavy Duty Compound Gate',
    alt: 'Dual casement compound entrance gate'
  },
  {
    id: 'a38d9f70-5ee8-4f36-8733-74b4610e8d97',
    name: 'Premium Grade SS 304 Glass Terrace Railing',
    alt: 'Grade SS 304 glass terrace railing'
  },
  {
    id: '620d05ce-6045-4936-bbd2-11f3c8ca48d6',
    name: 'Heavy-Duty SS 304 External Staircase Handrail',
    alt: 'Heavy-duty stainless steel staircase handrail'
  },
  {
    id: '19f0b4d8-8586-4cea-a36d-f5cd6c7b4f33',
    name: 'Modern Curved SS Staircase Balustrade',
    alt: 'Modern curved stainless steel staircase balustrade'
  },
  {
    id: 'a54fb014-4049-451a-b684-f2ef9924c50a',
    name: 'Architectural SS Railing with Ceramic Frit Glass',
    alt: 'Architectural stainless steel railing with frit glass'
  },
  {
    id: 'ffc67f26-dba8-47cc-bb51-9fd44b7a22de',
    name: 'Contemporary Staircase Safety Balustrade System',
    alt: 'Contemporary staircase safety balustrade'
  },
  {
    id: '19129325-bd5f-4da4-a192-0fae4d7bb8fa',
    name: 'Industrial Minimalist Iron Staircase Handrail',
    alt: 'Minimalist iron staircase handrail'
  },
  {
    id: '69bea82a-110a-4276-ab1e-fde51b1ba57b',
    name: 'High-Strength Modern Window Safety Grill',
    alt: 'High-strength modern window safety grill'
  },
  {
    id: 'ad230298-a741-42c1-b9ad-31ee1234fdd1',
    name: 'Heavy Gauge Wrought Iron Window Safety Grill',
    alt: 'Heavy gauge wrought iron window safety grill'
  },
  {
    id: 'e424e320-ba4a-4971-82cc-c51a3ff4dbf5',
    name: 'Artisan Black Wrought Iron Security Entry Door',
    alt: 'Artisan black wrought iron security door'
  }
];

async function main() {
  const db = databaseClient();
  await db.connect();

  console.log(`Renaming ${RENAMES.length} items with clean workshop titles...`);
  for (const item of RENAMES) {
    await db.query(`
      UPDATE public.gallery_items
      SET name = $1, alt_text = $2
      WHERE id = $3
    `, [item.name, item.alt, item.id]);
  }

  console.log('All 31 items renamed successfully.');

  const checkRes = await db.query('SELECT count(*) FROM public.gallery_items');
  console.log(`Total items in public.gallery_items: ${checkRes.rows[0].count}`);

  await db.end();
}

main().catch(console.error);
