import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`select id, name, sku, slug from public.products`);
  console.log(`Checking ${res.rows.length} products across database...`);

  let cleaned = 0;
  for (const row of res.rows) {
    const name = (row.name || '').trim();

    // Check if name contains non-Latin and non-Devanagari scripts (e.g. Arabic, Malayalam, Vietnamese, Thai, Hebrew) or starts with #
    const hasWeirdScript = /[\u0600-\u06FF\u0D00-\u0D7F\u0E00-\u0E7F\u1100-\u11FF\u3040-\u30FF\u4E00-\u9FFF]/.test(name);
    const hasSpam = /cakhia|tv|trực tiếp|bóng đá|toilet|shittin|shitler|outhouse|slayed|yes guys|dbr 24|sandtraps/i.test(name);
    const hasOddPrefix = name.startsWith('#');

    if (hasWeirdScript || hasSpam || hasOddPrefix || name.length < 4) {
      let replacement = '';
      if (row.sku.startsWith('GATE')) {
        replacement = `Architectural Royal Steel Main Gate ${row.sku.slice(-3)}`;
      } else if (row.sku.startsWith('RLG')) {
        replacement = `Modern Minimalist SS 304 Architectural Railing ${row.sku.slice(-3)}`;
      } else if (row.sku.startsWith('GRL')) {
        replacement = `Modern Stainless Steel Safety Window Grill ${row.sku.slice(-3)}`;
      } else if (row.sku.startsWith('SHT')) {
        replacement = `Commercial High-Security Rolling Shutter ${row.sku.slice(-3)}`;
      } else {
        replacement = `Custom Architectural Metal Fabrication ${row.sku.slice(-3)}`;
      }

      const cleanSlug = replacement.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const newSlug = `${row.slug.split('-')[0]}-${cleanSlug.slice(0, 36)}-${row.sku.slice(-3)}`;

      await db.query(`update public.products set name = $1, slug = $2 where id = $3`, [replacement, newSlug, row.id]);
      console.log(`Cleaned [${row.sku}]: "${name}" -> "${replacement}"`);
      cleaned++;
    }
  }

  console.log(`Total non-standard titles cleaned across database: ${cleaned}`);
  await db.end();
}

main().catch(console.error);
