import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`select id, name, sku from public.products where sku like 'SHT-%'`);
  console.log(`Found ${res.rows.length} shutter products.`);

  const fallbackShutterNames = [
    'Heavy-Duty Motorized Commercial Rolling Shutter',
    'Galvanized Steel Industrial Warehouse Shutter',
    'Precision Perforated Showroom Display Shutter',
    'High-Security MS Shop Front Rolling Shutter',
    'Automated Remote-Control Retail Store Shutter',
    'Interlocking Steel Grill Safety Rolling Shutter',
    'Corrosion-Resistant Powder Coated Shop Shutter',
    'Heavy-Gauge Wind-Resistant Industrial Shutter',
    'Contemporary Insulated Commercial Roller Door',
    'Bespoke Motorized Overhead Bay Shutter System',
    'Multi-Locking Commercial Storefront Shutter',
    'Transparent Polycarbonate & Steel Hybrid Shutter',
    'Manual Gear-Operated Heavy Duty Shutter',
    'Smooth-Glide Spring Assisted Commercial Shutter',
    'Commercial Warehouse Bay Rolling Shutter',
    'Galvanized Steel Cold-Rolled Shop Shutter',
    'Motorized Remote Rolling Shutter with Sensor',
    'Industrial High-Clearance Sliding Shutter',
    'Heavy Security Shop Shutter with Interlocking Slats'
  ];

  let cleaned = 0;
  for (let i = 0; i < res.rows.length; i++) {
    const row = res.rows[i];
    const name = row.name.trim();

    // Check if name has non-ascii, spam, or inappropriate terms
    const isBad =
      /[\u0600-\u06FF\u0590-\u05FF\u0E00-\u0E7F\u1100-\u11FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(name) ||
      /cakhia|tv|trực tiếp|bóng đá|toilet|shittin|shitler|outhouse|kitchen cabinet|slayed|yes guys|dbr 24|sandtraps/i.test(name) ||
      name.length < 5 ||
      name.startsWith('#');

    if (isBad) {
      const fallback = fallbackShutterNames[i % fallbackShutterNames.length] + ' ' + (i + 1);
      const cleanSlug = fallback.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const hash = row.sku.replace('SHT-COM-', '');
      const newSlug = `shutter-${cleanSlug.slice(0, 40)}-${hash}`;

      await db.query(`update public.products set name = $1, slug = $2 where id = $3`, [fallback, newSlug, row.id]);
      console.log(`Cleaned [${row.sku}]: "${name}" -> "${fallback}"`);
      cleaned++;
    }
  }

  console.log(`Cleaned up ${cleaned} shutter titles.`);
  await db.end();
}

main().catch(console.error);
