import { databaseClient } from './db-client.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
const client=databaseClient();
try{
  await client.connect();
  await client.query('create schema if not exists smartfabrication_migrations');
  await client.query('create table if not exists smartfabrication_migrations.applied(name text primary key,sha256 text not null,applied_at timestamptz not null default now())');
  const {rows}=await client.query('select name,sha256 from smartfabrication_migrations.applied');
  for(const name of fs.readdirSync('supabase/migrations').filter(n=>n.endsWith('.sql')).sort()){
    const sql=fs.readFileSync(`supabase/migrations/${name}`,'utf8'),sha=crypto.createHash('sha256').update(sql).digest('hex');
    const prior=rows.find(r=>r.name===name);if(prior){if(prior.sha256!==sha)throw new Error('Applied migration changed');console.log(`Already applied: ${name}`);continue;}
    if(name.includes('foundation')){const {rows:tables}=await client.query("select tablename from pg_tables where schemaname='public'");if(tables.length)throw new Error('Target contains existing public tables; review before applying foundation');}
    const body=sql.replace(/^\s*(?:--[^\n]*\n\s*)*begin;\s*/i,'').replace(/commit;\s*$/i,'');
    await client.query('begin');
    try{await client.query(body);await client.query('insert into smartfabrication_migrations.applied(name,sha256) values($1,$2)',[name,sha]);await client.query('commit');}
    catch(error){await client.query('rollback');throw error;}
    console.log(`Applied: ${name}`);
  }
}catch(e){console.error(JSON.stringify({code:e.code??'MIGRATION_FAILED',message:e.message.replace(/postgres:\/\/[^\s]+/g,'[redacted]')}));process.exitCode=1;}
finally{await client.end().catch(()=>{});}
