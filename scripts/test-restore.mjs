import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import tls from 'node:tls';
import { execFile,spawn } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';
import { databaseClient } from './db-client.mjs';
import { verifyConcurrentCommits } from './verify-concurrent-commits.mjs';

const execute=promisify(execFile),id=crypto.randomUUID().replaceAll('-','');
const root=path.resolve('test-results',`restore-${id}`),dataDir=path.join(root,'cluster');
const binaries=process.env.SF_POSTGRES_BIN??'C:\\Program Files\\PostgreSQL\\18\\bin';
const sourceName=`sf_restore_${id}_a`,targetName=`sf_restore_${id}_b`;
let started=false,local,source,target,checks=0;const remote=databaseClient();
const command=async(name,args,env={})=>{
 const executable=path.join(binaries,`${name}.exe`),environment={...process.env,...env};
 // PostgreSQL is a persistent descendant; inherited pipe handles can keep
 // execFile's callback waiting even after pg_ctl itself exits on Windows.
 if(name==='pg_ctl')return new Promise((resolve,reject)=>{const child=spawn(executable,['-t','20',...args],{windowsHide:true,env:environment,stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code===0?resolve({stdout:'',stderr:''}):reject(new Error('pg_ctl failed; inspect the disposable server log')));});
 return execute(executable,args,{windowsHide:true,env:environment,timeout:name==='pg_dump'?300000:120000,maxBuffer:10*1024*1024});
};
function localClient(database,port){assert.match(database,/^(postgres|sf_restore_[a-f0-9_]+)$/);return new pg.Client({host:'127.0.0.1',port,user:'postgres',database,ssl:false});}
async function fingerprint(client){const {rows:tables}=await client.query("select schemaname,tablename from pg_tables where schemaname in('public','auth') order by schemaname,tablename");const result={};for(const table of tables){const quote=value=>'"'+value.replaceAll('"','""')+'"';const {rows}=await client.query(`select row_to_json(t)::text value from ${quote(table.schemaname)}.${quote(table.tablename)} t order by row_to_json(t)::text`);result[`${table.schemaname}.${table.tablename}`]={rows:rows.length,sha256:crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex')};}return result;}
try{
 for(const name of ['initdb','pg_ctl','pg_dump','pg_restore','psql'])assert.ok(fs.existsSync(path.join(binaries,`${name}.exe`)),`PostgreSQL binary missing: ${name}`);
 fs.mkdirSync(root,{recursive:true});
 const port=await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const selected=server.address().port;server.close(()=>resolve(selected));});});
 assert.notEqual(port,5432);fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({host:'127.0.0.1',port,dataDir,sourceName,targetName,scope:'Synthetic local restore drill; remote schema/configuration only'},null,2));
 await command('initdb',['-D',dataDir,'-U','postgres','--encoding=UTF8','--no-locale','--auth=trust']);
 await command('pg_ctl',['-D',dataDir,'-l',path.join(root,'server.log'),'-o',`-h 127.0.0.1 -p ${port} -c timezone=UTC`,'-w','start']);started=true;
 await remote.connect();
 const {rows:roleNames}=await remote.query("select rolname from pg_roles where rolname !~ '^pg_' and rolname<>'postgres'");
 const {rows:roles}=await remote.query('select id from public.roles order by id');const {rows:permissions}=await remote.query('select id from public.permissions order by id');const {rows:grants}=await remote.query('select role_id,permission_id from public.role_permissions order by role_id,permission_id');
 const connection=new URL(process.env.POSTGRES_URL_NON_POOLING);const certificate=path.join(root,'root-ca.pem');fs.writeFileSync(certificate,[...tls.rootCertificates,fs.readFileSync('scripts/certs/supabase-root.crt','utf8')].join('\n'));
 const schemaFile=path.join(root,'public-schema.sql');
 await command('pg_dump',['--schema-only','--schema=public','--no-owner','--file',schemaFile],{PGHOST:connection.hostname,PGPORT:connection.port||'5432',PGDATABASE:connection.pathname.slice(1),PGUSER:decodeURIComponent(connection.username),PGPASSWORD:decodeURIComponent(connection.password),PGSSLMODE:'verify-full',PGSSLROOTCERT:certificate,PGCONNECT_TIMEOUT:'15'});
 checks++;console.log('PASS: Native schema-only export uses verified TLS; no remote business rows copied');
 local=localClient('postgres',port);await local.connect();
 const quote=value=>'"'+value.replaceAll('"','""')+'"';
 for(const role of roleNames)await local.query(`create role ${quote(role.rolname)} nologin ${role.rolname==='service_role'?'bypassrls':''}`);
 await local.query(`create database ${quote(sourceName)}`);source=localClient(sourceName,port);await source.connect();
 assert.equal((await source.query("select count(*)::integer count from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'")).rows[0].count,0);await source.query('drop schema public');
 await source.query("create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;");
 const localEnv={PGHOST:'127.0.0.1',PGPORT:String(port),PGUSER:'postgres',PGPASSWORD:'',PGSSLMODE:'disable',PGDATABASE:sourceName};
 await command('psql',['--set','ON_ERROR_STOP=1','--file',schemaFile],localEnv);
 await source.query('create trigger smartfabrication_new_user after insert on auth.users for each row execute function public.handle_new_user()');
 for(const row of roles)await source.query('insert into public.roles(id) values($1)',[row.id]);for(const row of permissions)await source.query('insert into public.permissions(id) values($1)',[row.id]);for(const row of grants)await source.query('insert into public.role_permissions(role_id,permission_id) values($1,$2)',[row.role_id,row.permission_id]);
 const owner=crypto.randomUUID(),material=crypto.randomUUID();await source.query("insert into auth.users(id,email) values($1,$2)",[owner,`restore-${id}@example.invalid`]);await source.query("insert into public.user_roles(user_id,role_id) values($1,'owner')",[owner]);await source.query("insert into public.materials(id,name,code,type,size,thickness_mm,unit,weight_kg_per_unit) values($1,'Synthetic restore stock',$2,'square_pipe','25mm',2,'kg',1)",[material,id]);
 await source.query('begin');await source.query("select set_config('request.jwt.claim.sub',$1,true)",[owner]);await source.query('set local role authenticated');await source.query('select public.post_stock($1::jsonb)',[JSON.stringify({material_id:material,quantity:10,unit_cost_minor:101,kind:'adjustment',note:'Synthetic restore baseline',idempotency_key:crypto.randomUUID()})]);await source.query('commit');
 const before=await fingerprint(source),backup=path.join(root,'synthetic-backup.dump');await command('pg_dump',['--format=custom','--no-owner','--file',backup],localEnv);
 // A full native archive treats public as initdb-owned and expects it to exist;
 // the upstream schema-only export explicitly creates it on the source instead.
 await local.query(`create database ${quote(targetName)}`);target=localClient(targetName,port);await target.connect();assert.equal((await target.query("select count(*)::integer count from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'")).rows[0].count,0);await command('pg_restore',['--exit-on-error','--no-owner','--dbname',targetName,backup],{...localEnv,PGDATABASE:targetName});
 assert.deepEqual(await fingerprint(target),before);checks++;console.log('PASS: Native custom-format backup restores identical synthetic rows across public/auth tables');
 const metrics=async client=>(await client.query("select (select count(*)::integer from pg_tables where schemaname='public') tables,(select count(*)::integer from pg_policies where schemaname='public') policies,(select count(*)::integer from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity) rls_tables")).rows[0];
 assert.deepEqual(await metrics(target),await metrics(source));checks++;console.log('PASS: Table, RLS and policy counts survive restore');
 await target.query('begin');await target.query("select set_config('request.jwt.claim.sub',$1,true)",[owner]);await target.query('set local role authenticated');assert.equal((await target.query("select public.has_permission('inventory.read') allowed")).rows[0].allowed,true);assert.equal((await target.query('select sum(quantity)::text quantity from public.stock_movements')).rows[0].quantity,'10');await target.query('rollback');
 await target.query('begin');await target.query('set local role anon');assert.equal((await target.query('select count(*)::integer count from public.stock_movements')).rows[0].count,0);await target.query('rollback');checks++;console.log('PASS: Restored owner/anonymous access follows RLS');
 const testUrl=`postgres://postgres@127.0.0.1:${port}/${targetName}`;
 const regression=await execute(process.execPath,['--env-file=.env.local','scripts/test-database.mjs'],{windowsHide:true,env:{...process.env,SF_DISPOSABLE_DATABASE_URL:testUrl},timeout:120000,maxBuffer:4*1024*1024});
 assert.match(regression.stdout,/PASS: \d+ live database checks; test users and fixtures rolled back/);console.log(regression.stdout.trim().split('\n').at(-1));checks++;
 const concurrency=await verifyConcurrentCommits(testUrl,owner);checks+=concurrency;
 fs.writeFileSync(path.join(root,'result.json'),JSON.stringify({passed:true,checks,metadata:await metrics(target),rowFingerprintsMatch:true,remote_business_rows_copied:0,synthetic_only:true,concurrency_assertions:concurrency,recorded_at:new Date().toISOString()},null,2));
 console.log(`PASS: ${checks} native local restore/concurrent-commit checks. Remote business data was neither copied nor changed.`);
}catch(error){console.error(`Restore verification failed: ${error.code??''} ${error.message?.split('\n')[0]??'Native command failed'}`);if(error.stderr){const diagnostic=String(error.stderr).split('\n').filter(line=>!/password|postgres:\/\//i.test(line));fs.writeFileSync(path.join(root,'failure.log'),diagnostic.join('\n'));console.error(diagnostic.filter(line=>/error|detail|hint|failed/i.test(line)).slice(0,8).join('\n'));}process.exitCode=1;}
finally{
 await Promise.allSettled([source?.end(),target?.end(),local?.end(),remote.end()]);
 if(started||fs.existsSync(path.join(dataDir,'postmaster.pid'))){try{await command('pg_ctl',['-D',dataDir,'-m','fast','-w','stop']);console.log('Disposable PostgreSQL cluster stopped; ignored synthetic artifacts retained for review.');}catch{console.error(`Stop failed; inspect local cluster manifest in ${root}`);process.exitCode=1;}}
}
