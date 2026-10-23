import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const unrelatedMedia = [
    'smart-fabrication/development/commercial-shutters/item-be9641',
    'smart-fabrication/development/commercial-shutters/item-19470b',
    'smart-fabrication/development/commercial-shutters/item-524b4d',
    'smart-fabrication/development/commercial-shutters/item-cab533',
    'smart-fabrication/development/commercial-shutters/item-d91e06',
    'smart-fabrication/development/commercial-shutters/item-f65872',
    'smart-fabrication/development/commercial-shutters/item-314de8',
    'smart-fabrication/development/commercial-shutters/item-7aa09c',
    'smart-fabrication/development/commercial-shutters/item-ea640b',
    'smart-fabrication/development/commercial-shutters/item-b5ec4a',
    'smart-fabrication/development/commercial-shutters/item-74365d',
    'smart-fabrication/development/commercial-shutters/item-8da666',
    'smart-fabrication/development/commercial-shutters/item-f5bbae',
    'smart-fabrication/development/commercial-shutters/item-a0ddf7',
    'smart-fabrication/development/commercial-shutters/item-221a37',
    'smart-fabrication/development/commercial-shutters/item-e8d8b4'
  ];

  const res = await db.query(`
    select p.id, p.name, p.sku, ma.public_id
    from public.products p
    join public.product_media pm on pm.product_id = p.id
    join public.media_assets ma on ma.id = pm.media_id
    where ma.public_id = any($1)
  `, [unrelatedMedia]);

  console.log('Matching products for unrelated media:', res.rows.length);
  res.rows.forEach(r => console.log(`[${r.sku}] ${r.name} -> ${r.public_id}`));

  await db.end();
}

main().catch(console.error);
