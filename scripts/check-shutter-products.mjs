import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    SELECT p.id, p.name, p.status, c.name as category_name, c.slug as category_slug
    FROM public.products p
    JOIN public.categories c ON c.id = p.category_id
    WHERE c.slug ILIKE '%shutter%'
    ORDER BY p.name ASC
  `);

  console.log(`Total products in shutter category: ${res.rows.length}`);
  const published = res.rows.filter(r => r.status === 'published');
  console.log(`Published products in shutter category: ${published.length}`);

  published.forEach((p, i) => {
    console.log(`${i + 1}. [${p.id}] "${p.name}" (${p.category_name})`);
  });

  await db.end();
}

main().catch(console.error);
