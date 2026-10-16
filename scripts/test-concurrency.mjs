import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { databaseClient } from './db-client.mjs';

// Only a generated owner/material fixture is committed for cross-session visibility.
// Every stock posting/period-close attempt is rolled back; no financial ledger
// fixture is committed and no real workshop record is selected or modified.
const setup=databaseClient(), first=databaseClient(), second=databaseClient();
const owner=crypto.randomUUID(), material=crypto.randomUUID(), email=`sf-lock-${owner}@example.invalid`;
let checks=0,created=false;
async function begin(client){await client.query('begin');await client.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[owner,JSON.stringify({sub:owner,role:'authenticated'})]);await client.query('set local role authenticated');await client.query("set local statement_timeout='5s'");}
async function stock(client,key=crypto.randomUUID()){const {rows}=await client.query('select public.post_stock($1::jsonb) result',[JSON.stringify({material_id:material,quantity:10,unit_cost_minor:101,kind:'adjustment',note:'Rollback-only contention fixture',idempotency_key:key})]);return rows[0].result;}
async function blocked(name,operation){await begin(second);await second.query("set local lock_timeout='750ms'");try{await assert.rejects(operation,error=>error.code==='55P03','Expected a real competing lock timeout');checks++;console.log(`PASS: ${name}`);}finally{await second.query('rollback');}}
try{
 await Promise.all([setup.connect(),first.connect(),second.connect()]);
 await setup.query('begin');
 await setup.query("insert into auth.users(id,email,raw_user_meta_data) values($1,$2,'{}')",[owner,email]);
 await setup.query("insert into public.user_roles(user_id,role_id) values($1,'owner')",[owner]);
 await setup.query("insert into public.materials(id,name,code,type,size,thickness_mm,unit,weight_kg_per_unit) values($1,'Rollback contention fixture',$2,'square_pipe','25mm',2,'kg',1)",[material,`sf-lock-${material}`]);
 await setup.query('commit');created=true;
 await begin(first);const key=crypto.randomUUID();await stock(first,key);
 await blocked('Competing material postings serialize on the same material',()=>stock(second));
 await blocked('Concurrent reuse of an idempotency key waits for its first transaction',()=>stock(second,key));
 await blocked('Period closure waits while a financial posting holds its shared guard',()=>second.query("select public.close_finance_period(jsonb_build_object('closed_through',((now() at time zone 'Asia/Kolkata')::date-1)::text,'reason','Rollback-only closure contention','confirmed',true,'idempotency_key',$1::text))",[crypto.randomUUID()]));
 await first.query('rollback');
 await begin(second);await stock(second,key);await second.query('rollback');checks++;console.log('PASS: Waiting operation can retry after the original transaction rolls back');
 const {rows}=await setup.query('select count(*)::integer count from public.stock_movements where material_id=$1',[material]);assert.equal(rows[0].count,0);checks++;console.log('PASS: All contention ledger writes rolled back');
 console.log(`PASS: ${checks} two-session contention checks. This is a bounded locking test, not a load or concurrent-commit certification.`);
}catch(error){console.error(`Concurrency verification failed: ${error.code??''} ${error.message}`);process.exitCode=1;}
finally{
 await Promise.allSettled([first.query('rollback'),second.query('rollback'),setup.query('rollback')]);
 if(created){try{
  const match=await setup.query('select id from auth.users where id=$1 and email=$2',[owner,email]);assert.equal(match.rowCount,1);
  await setup.query('begin');
  await setup.query('delete from public.materials where id=$1 and code=$2',[material,`sf-lock-${material}`]);
  await setup.query('delete from public.user_roles where user_id=$1',[owner]);
  await setup.query('delete from public.profiles where id=$1',[owner]);
  await setup.query('delete from auth.users where id=$1 and email=$2',[owner,email]);
  await setup.query('commit');console.log('Generated contention fixtures removed; audit history retained.');
 }catch(error){await setup.query('rollback').catch(()=>{});console.error(`Contention fixture cleanup failed: ${error.message}`);process.exitCode=1;}}
 await Promise.allSettled([setup.end(),first.end(),second.end()]);
}
