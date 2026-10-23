import { databaseClient } from './db-client.mjs';

const titlesToMatch = [
  "Heavy-Duty Motorized Commercial Rolling Shutter Rolling Shutter 31",
  "Heavy Structural Steel Compound Rolling Shutter Rolling Shutter 30",
  "Right",
  "Manual Gear-Operated Heavy Duty Shutter Rolling Shutter 28",
  "Transparent Polycarbonate & Steel Hybrid Shutter Rolling Shutter 27",
  "Multi-Locking Commercial Storefront Shutter Rolling Shutter 26",
  "Contemporary Insulated Commercial Roller Door Rolling Shutter 24",
  "Heavy-Gauge Wind-Resistant Industrial Shutter Rolling Shutter 23",
  "Cinema",
  "Public",
  "Iykyk",
  "Precision Perforated Showroom Display Shutter Rolling Shutter 18",
  "Galvanized Steel Industrial Warehouse Shutter Rolling Shutter 17",
  "Heavy-Duty Motorized Commercial Rolling Shutter Rolling Shutter 16",
  "Heavy Structural Steel Compound Rolling Shutter Rolling Shutter 15",
  "Smooth-Glide Spring Assisted Commercial Shutter Rolling Shutter 14",
  "Manual Gear-Operated Heavy Duty Shutter Rolling Shutter 13",
  "Transparent Polycarbonate & Steel Hybrid Shutter Rolling Shutter 12",
  "Multi-Locking Commercial Storefront Shutter Rolling Shutter 11",
  "Bespoke Motorized Overhead Bay Shutter System Rolling Shutter 10",
  "Contemporary Insulated Commercial Roller Door Rolling Shutter 9",
  "Heavy-Gauge Wind-Resistant Industrial Shutter Rolling Shutter 8",
  "Corrosion-Resistant Powder Coated Shop Shutter Rolling Shutter 7",
  "Interlocking Steel Grill Safety Rolling Shutter Rolling Shutter 6",
  "Automated Remote-Control Retail Store Shutter Rolling Shutter 5",
  "High-Security MS Shop Front Rolling Shutter Rolling Shutter 4",
  "Precision Perforated Showroom Display Shutter Rolling Shutter 3"
];

async function main() {
  const db = databaseClient();
  await db.connect();

  console.log(`Searching for ${titlesToMatch.length} target titles...`);

  // Search in gallery_items
  const galleryMatches = await db.query(`
    SELECT id, name, category_id
    FROM public.gallery_items
    WHERE name = ANY($1::text[])
  `, [titlesToMatch]);

  console.log(`Found in gallery_items: ${galleryMatches.rows.length}`);
  galleryMatches.rows.forEach(r => console.log(`- Gallery: [${r.id}] "${r.name}"`));

  // Also search if any match by ILIKE or substring for "Right", "Cinema", "Public", "Iykyk"
  const shortKeywords = ["Right", "Cinema", "Public", "Iykyk"];
  const shortMatches = await db.query(`
    SELECT id, name
    FROM public.gallery_items
    WHERE lower(name) = ANY(SELECT lower(x) FROM unnest($1::text[]) AS x)
  `, [shortKeywords]);
  console.log(`Exact short keyword matches in gallery_items: ${shortMatches.rows.length}`);
  shortMatches.rows.forEach(r => console.log(`- Short: [${r.id}] "${r.name}"`));

  // Search in products
  const productMatches = await db.query(`
    SELECT id, name, slug, status
    FROM public.products
    WHERE name = ANY($1::text[])
  `, [titlesToMatch]);

  console.log(`Found in products: ${productMatches.rows.length}`);
  productMatches.rows.forEach(r => console.log(`- Product: [${r.id}] "${r.name}" (${r.status})`));

  // Also check products matching short keywords
  const prodShortMatches = await db.query(`
    SELECT id, name, status
    FROM public.products
    WHERE lower(name) = ANY(SELECT lower(x) FROM unnest($1::text[]) AS x)
  `, [shortKeywords]);
  console.log(`Exact short keyword matches in products: ${prodShortMatches.rows.length}`);
  prodShortMatches.rows.forEach(r => console.log(`- Short Prod: [${r.id}] "${r.name}" (${r.status})`));

  await db.end();
}

main().catch(console.error);
