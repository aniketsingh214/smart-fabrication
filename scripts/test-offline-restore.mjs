import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFile,spawn } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';
import { verifyConcurrentCommits } from './verify-concurrent-commits.mjs';
const execute=promisify(execFile),testRoot=fs.realpathSync('test-results'),runId=crypto.randomUUID().replaceAll('-','');
const candidates=fs.readdirSync(testRoot,{withFileTypes:true}).filter(entry=>entry.isDirectory()&&/^restore-[a-f0-9]{32}$/.test(entry.name)).map(entry=>path.join(testRoot,entry.name)).filter(folder=>fs.existsSync(path.join(folder,'result.json'))&&fs.existsSync(path.join(folder,'cluster'))&&!fs.existsSync(path.join(folder,'cluster','postmaster.pid'))).sort((a,b)=>fs.statSync(path.join(b,'result.json')).mtimeMs-fs.statSync(path.join(a,'result.json')).mtimeMs);
assert.ok(candidates.length,'Run the online synthetic restore drill once to create a reusable local backup');
const root=fs.realpathSync(candidates[0]),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')),baseline=JSON.parse(fs.readFileSync(path.join(root,'result.json'),'utf8'));
assert.equal(path.dirname(root),testRoot);assert.equal(baseline.passed,true);assert.equal(baseline.synthetic_only,true);assert.equal(baseline.remote_business_rows_copied,0);assert.equal(manifest.host,'127.0.0.1');
const dataDir=fs.realpathSync(path.join(root,'cluster'));assert.equal(dataDir,path.resolve(manifest.dataDir));assert.ok(dataDir.startsWith(root+path.sep));assert.match(manifest.sourceName,/^sf_restore_[a-f0-9_]+$/);
const binary=process.env.SF_POSTGRES_BIN??'C:\\Program Files\\PostgreSQL\\18\\bin',backup=path.join(root,'synthetic-backup.dump'),targetName=`sf_restore_${runId}_c`;
let started=false,attempted=false,control,source,target;
async function pgctl(action){return new Promise((resolve,reject)=>{const child=spawn(path.join(binary,'pg_ctl.exe'),['-t','20','-D',dataDir,...action],{windowsHide:true,stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('Disposable pg_ctl operation failed')));});}
async function fingerprint(client){const {rows:tables}=await client.query("select schemaname,tablename from pg_tables where schemaname in('public','auth') order by schemaname,tablename");const result={};for(const table of tables){const quote=value=>'"'+value.replaceAll('"','""')+'"';const {rows}=await client.query(`select row_to_json(t)::text value from ${quote(table.schemaname)}.${quote(table.tablename)} t order by row_to_json(t)::text`);result[`${table.schemaname}.${table.tablename}`]=crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex');}return result;}
try{
 assert.equal(fs.existsSync(path.join(dataDir,'postmaster.pid')),false,'Do not reuse an active cluster');
 const port=await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const selected=server.address().port;server.close(()=>resolve(selected));});});assert.notEqual(port,5432);
 attempted=true;await pgctl(['-l',path.join(root,`offline-${runId}.log`),'-o',`-h 127.0.0.1 -p ${port} -c timezone=UTC`,'-w','start']);started=true;
 const client=database=>new pg.Client({host:'127.0.0.1',port,user:'postgres',database,ssl:false});control=client('postgres');await control.connect();source=client(manifest.sourceName);await source.connect();
 await control.query(`create database "${targetName}"`);
 await execute(path.join(binary,'pg_restore.exe'),['--exit-on-error','--no-owner','--dbname',targetName,backup],{windowsHide:true,env:{...process.env,PGHOST:'127.0.0.1',PGPORT:String(port),PGUSER:'postgres',PGPASSWORD:'',PGSSLMODE:'disable'},timeout:120000,maxBuffer:4*1024*1024});
 target=client(targetName);await target.connect();assert.deepEqual(await fingerprint(target),await fingerprint(source));console.log('PASS: Offline native archive restores identical synthetic data without contacting Supabase');
 const applied=[];
 for(const name of process.argv.slice(2)){
  assert.match(name,/^\d{12}_[a-z0-9_]+\.sql$/);const file=path.resolve('supabase/migrations',name);assert.equal(path.dirname(file),path.resolve('supabase/migrations'));const sql=fs.readFileSync(file,'utf8');await target.query(sql.replace(/^\uFEFF/,""));applied.push({name,sha256:crypto.createHash('sha256').update(sql).digest('hex')});
 }
 const regression=await execute(process.execPath,['scripts/test-database.mjs'],{windowsHide:true,env:{...process.env,SF_DISPOSABLE_DATABASE_URL:`postgres://postgres@127.0.0.1:${port}/${targetName}`},timeout:120000,maxBuffer:4*1024*1024});const match=regression.stdout.match(/PASS: (\d+) live database checks; test users and fixtures rolled back/);assert.ok(match,regression.stdout.slice(-800));console.log(`PASS: ${match[1]} restored-local workflow checks after forward migrations`);
 const {rows:owners}=await source.query("select user_id from public.user_roles where role_id='owner'");assert.equal(owners.length,1);const concurrent=await verifyConcurrentCommits(`postgres://postgres@127.0.0.1:${port}/${targetName}`,owners[0].user_id);
 fs.writeFileSync(path.join(root,`offline-${runId}.json`),JSON.stringify({passed:true,synthetic_only:true,remote_contact:false,forward_migrations:applied,workflow_checks:Number(match[1]),concurrent_assertions:concurrent,recorded_at:new Date().toISOString()},null,2));
 console.log('PASS: Offline restore, forward migration and concurrent-commit rehearsal complete');
}catch(error){console.error(`Offline restore failed: ${error.message?.split('\n')[0]}`);if(error.stderr)console.error(String(error.stderr).split('\n').filter(line=>/ERROR|error:|Assertion|checksPassed/.test(line)).slice(0,5).join('\n'));process.exitCode=1;}
finally{await Promise.allSettled([control?.end(),source?.end(),target?.end()]);if(started||(attempted&&fs.existsSync(path.join(dataDir,'postmaster.pid')))){await pgctl(['-m','fast','-w','stop']).then(()=>console.log('Reusable synthetic cluster stopped.')).catch(()=>{console.error('Disposable cluster stop failed; inspect its manifest.');process.exitCode=1;});}}

