import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();
  const res = await db.query(`
    select conname, pg_get_constraintdef(c.oid)
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'product_variants'
  `);
  console.log('product_variants constraints:', res.rows);
  await db.end();
}

main().catch(console.error);
