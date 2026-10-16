import { databaseClient } from './db-client.mjs';
const client = databaseClient();
try {
  await client.connect();
  if(process.argv.includes('--fixture-summary')){const {rows}=await client.query("select id,email,created_at from auth.users where email ~ '^sf-media-browser-[0-9a-f-]{36}@example.invalid$' order by created_at");console.log(JSON.stringify({mediaFixtures:rows}));}
  const {rows} = await client.query("select table_name from information_schema.tables where table_schema='public' order by table_name");
  const {rows:migrations}=await client.query('select name from smartfabrication_migrations.applied order by name');
  const {rows:owners}=await client.query("select count(*)::int as count from public.user_roles where role_id='owner'");
  const {rows:rls}=await client.query("select count(*)::int as total,count(*) filter(where c.relrowsecurity)::int as protected from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'");
  console.log(JSON.stringify({connected:true,publicTableCount:rows.length,appliedMigrations:migrations.map(r=>r.name),ownerAccountCount:owners[0].count,rls:rls[0]},null,2));
} catch(e) { console.error(JSON.stringify({connected:false,code:e.code??'CONNECTION_FAILED',message:e.message.replace(/postgres:\/\/[^\s]+/g,'[redacted]')}));process.exitCode=1; }
finally { await client.end().catch(()=>{}); }
