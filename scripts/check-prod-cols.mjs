import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();
  const res = await db.query(`select column_name from information_schema.columns where table_name = 'products'`);
  console.log('Product columns:', res.rows.map(r => r.column_name));
  await db.end();
}

main().catch(console.error);
