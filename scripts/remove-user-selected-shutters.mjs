import { databaseClient } from './db-client.mjs';

const targetTitles = [
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

  console.log(`Starting removal of ${targetTitles.length} items requested by user...`);

  // 1. Delete from gallery_items
  const delGallery = await db.query(`
    DELETE FROM public.gallery_items
    WHERE name = ANY($1::text[])
    RETURNING id, name
  `, [targetTitles]);

  console.log(`Successfully deleted ${delGallery.rowCount} items from public.gallery_items:`);
  delGallery.rows.forEach((r, i) => console.log(` ${i + 1}. [Gallery ID: ${r.id}] ${r.name}`));

  // 2. Archive corresponding products in public.products
  const archiveProducts = await db.query(`
    UPDATE public.products
    SET status = 'archived', featured = false
    WHERE name = ANY($1::text[])
    RETURNING id, name, status
  `, [targetTitles]);

  console.log(`\nSuccessfully archived ${archiveProducts.rowCount} items in public.products:`);
  archiveProducts.rows.forEach((r, i) => console.log(` ${i + 1}. [Product ID: ${r.id}] ${r.name} -> status: ${r.status}`));

  // 3. Count remaining
  const gCount = await db.query('SELECT count(*) FROM public.gallery_items');
  const pCount = await db.query("SELECT count(*) FROM public.products WHERE status = 'published'");

  console.log(`\nFinal counts:`);
  console.log(`- Gallery Items: ${gCount.rows[0].count}`);
  console.log(`- Published Products: ${pCount.rows[0].count}`);

  await db.end();
}

main().catch(console.error);
