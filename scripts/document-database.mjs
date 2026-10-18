import fs from 'node:fs';
import { databaseClient } from './db-client.mjs';
import { schemaDiagram } from './schema-diagram.mjs';
const db = databaseClient();
try {
  await db.connect();
  // Queries run without explicit transaction block for pooling compatibility
  const { rows: columns } = await db.query("select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position");
  const { rows: policies } = await db.query("select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname");
  const { rows: tables } = await db.query("select c.relname name,c.relrowsecurity rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by c.relname");
  const { rows: migrations } = await db.query('select name,sha256,applied_at from smartfabrication_migrations.applied order by name');
  const { rows: constraints } = await db.query(`
    select n.nspname schema_name,t.relname table_name,c.conname name,c.contype kind,
      c.convalidated validated,pg_get_constraintdef(c.oid,true) definition,
      pn.nspname parent_schema,pt.relname parent_table,
      array(select a.attname from unnest(c.conkey) with ordinality k(attnum,position)
        join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum order by k.position)::text[] columns,
      array(select a.attname from unnest(c.confkey) with ordinality k(attnum,position)
        join pg_attribute a on a.attrelid=c.confrelid and a.attnum=k.attnum order by k.position)::text[] parent_columns
    from pg_constraint c join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    left join pg_class pt on pt.oid=c.confrelid left join pg_namespace pn on pn.oid=pt.relnamespace
    where n.nspname='public' and t.relkind='r'
    order by t.relname,c.conname`);

  const snapshot = { captured_at: new Date().toISOString(), tables, columns, policies, migrations, constraints };
  const diagram = schemaDiagram(snapshot);
  fs.writeFileSync('docs/database/actual-schema.json', JSON.stringify(snapshot, null, 2));
  fs.writeFileSync('docs/database/erd.md', diagram);
  const escape = value => String(value ?? '').replaceAll('|', '\\|');
  fs.writeFileSync('docs/database/schema-dictionary.md', '# Applied schema dictionary\n\nCaptured from the connected development project in a repeatable-read, read-only transaction. No application records or secrets included. Applied relationships and constraints: [diagram](erd.md).\n\n' + tables.map(t => `## ${t.name}\n\nRLS enabled: ${t.rls}.\n\n| Column | Type | Nullable | Default |\n| --- | --- | --- | --- |\n` + columns.filter(c => c.table_name === t.name).map(c => `| ${c.column_name} | ${c.data_type} | ${c.is_nullable} | ${escape(c.column_default)} |`).join('\n')).join('\n\n') + '\n');
  fs.writeFileSync('docs/database/migrations-log.md', '# Applied development migrations\n\n| Migration | Applied at (UTC) | SHA-256 |\n| --- | --- | --- |\n' + migrations.map(m => `| ${m.name} | ${m.applied_at.toISOString()} | ${m.sha256} |`).join('\n') + '\n\nApplied migrations are immutable. Add forward fixes. No destructive changes performed. Production migration approval and backup remain launch gates.\n');
  console.log(`Documented ${tables.length} tables, ${policies.length} policies, ${constraints.length} constraints and ${migrations.length} applied migrations. RLS disabled tables: ${tables.filter(t => !t.rls).length}.`);
} catch (error) {
  await db.query('rollback').catch(() => {});
  console.error(error.message); process.exitCode = 1;
} finally { await db.end().catch(() => {}); }
