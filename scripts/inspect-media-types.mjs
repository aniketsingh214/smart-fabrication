import { databaseClient } from './db-client.mjs';

async function main() {
  const client = databaseClient();
  await client.connect();
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'media_assets'");
  console.log('Columns:', cols.rows.map(r => r.column_name));

  const gates = await client.query("SELECT public_id, width, height, format FROM media_assets WHERE public_id ILIKE '%gate%' LIMIT 10");
  console.log('Gates:', gates.rows);

  const albums = await client.query("SELECT public_id FROM media_assets WHERE public_id ILIKE '%album%' LIMIT 10");
  console.log('Albums:', albums.rows);

  await client.end();
}

main().catch(console.error);
