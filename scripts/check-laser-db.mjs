import { databaseClient } from './db-client.mjs';

async function main() {
  const c = databaseClient();
  await c.connect();
  const prods = await c.query("SELECT count(*) FROM public.products WHERE status = 'published'");
  console.log('Total Published Products:', prods.rows[0].count);

  const laserProds = await c.query(`
    SELECT count(*) FROM public.products
    WHERE category_id IN (
      SELECT id FROM public.categories
      WHERE slug = 'laser-cutting-gates' OR parent_id IN (SELECT id FROM public.categories WHERE slug = 'laser-cutting-gates')
    )
  `);
  console.log('Laser Cutting Gates Products:', laserProds.rows[0].count);

  const gal = await c.query("SELECT count(*) FROM public.gallery_items WHERE status = 'published'");
  console.log('Total Published Gallery Items:', gal.rows[0].count);

  const topCats = await c.query("SELECT name, slug, sort_order FROM public.categories WHERE parent_id IS NULL AND active = true ORDER BY sort_order");
  console.log('Top-Level Categories:', topCats.rows);

  await c.end();
}

main().catch(console.error);
