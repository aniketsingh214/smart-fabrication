import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    select pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'products' and c.conname like '%status%'
  `);
  console.log('Product status constraints:', res.rows);

  const bomTriggers = await db.query(`
    select tgname, proname, prosrc
    from pg_trigger tg
    join pg_proc p on p.oid = tg.tgfoid
    join pg_class c on c.oid = tg.tgrelid
    where c.relname in ('bom_items', 'bom_versions', 'products')
  `);
  console.log('Triggers:', bomTriggers.rows.map(t => ({ name: t.tgname, fn: t.proname })));

  await db.end();
}

main().catch(console.error);
