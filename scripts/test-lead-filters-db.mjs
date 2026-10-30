import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {databaseClient} from './db-client.mjs';
const db=databaseClient();let count=0;
async function check(name,fn){await fn();console.log('PASS: '+name);count++;}
async function actor(id,role='authenticated'){await db.query('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[id,JSON.stringify({sub:id,role})]);await db.query('set local role '+role);}
try{
 await db.connect();await db.query('begin');const owner=crypto.randomUUID(),sales=crypto.randomUUID(),customer=crypto.randomUUID(),tag=crypto.randomUUID();
 for(const id of [owner,sales,customer])await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,$2,'{}')",[id,id+'@example.invalid']);
 await db.query("insert into user_roles(user_id,role_id) values($1,'owner'),($2,'sales')",[owner,sales]);await actor(owner);
 const {rows:[day]}=await db.query("select date_trunc('day',now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata' start");const start=day.start.toISOString(),end=new Date(day.start.getTime()+86400000).toISOString();
 const {rows}=await db.query("insert into leads(name,phone,city,requirement,source,assigned_to,created_at) values($1,'+919410000001','Test','Test','whatsapp',$2,$4),($1,'+919410000002','Test','Test','direct',null,$5::timestamptz-interval '1 millisecond'),($1,'+919410000003','Test','Test','whatsapp',$3,$4::timestamptz-interval '1 millisecond'),($1,'+919410000004','Test','Test','direct',$3,$5) returning id",[tag,sales,owner,start,end]);
 const [a,b,c,d]=rows.map(row=>row.id);
 await db.query("insert into follow_ups(lead_id,due_at,status) values($1,$4,'pending'),($1,$4,'pending'),($2,$4,'completed'),($3,now()-interval '1 hour','pending')",[a,b,c,start]);
 const ids=async(params={})=>{const args={search_term:tag,india_day_start:start,india_day_end:end,...params};const keys=Object.keys(args);return(await db.query('select id from filtered_sales_leads('+keys.map((key,i)=>key+'=> $'+(i+1)).join(',')+') order by id',Object.values(args))).rows.map(row=>row.id);};
 await check('India day uses inclusive start/exclusive end before paging',async()=>assert.deepEqual(await ids({created_from:start,created_until:end}),[a,b].sort()));
 await check('Source, assignment and search intersect without duplicates',async()=>{assert.deepEqual(await ids({created_from:start,created_until:end,lead_source:'whatsapp',assignment:sales}),[a]);assert.deepEqual(await ids({assignment:'unassigned'}),[b]);assert.deepEqual(await ids({assignment:'me'}),[c,d].sort());assert.deepEqual(await ids({search_term:a}),[a]);});
 await check('Pending follow-ups filter actual lead IDs, exclude completed and do not duplicate leads',async()=>{assert.deepEqual(await ids({followup_filter:'today'}),[a,...(new Date(Date.now()-3600000)>=day.start?[c]:[])].sort());assert.ok(!(await ids({followup_filter:'today'})).includes(b));assert.ok((await ids({followup_filter:'overdue'})).includes(c));});
 await check('Assigned sales RLS intersects all filters',async()=>{await actor(sales);assert.deepEqual(await ids({assignment:'me'}),[a]);assert.deepEqual(await ids({assignment:owner}),[]);await actor(owner);});
 await check('Non-staff callers cannot execute lead filters',async()=>{await actor(customer);await db.query('savepoint denied');let rejected=false;try{await ids();}catch{rejected=true;}await db.query('rollback to savepoint denied');assert.ok(rejected);await actor('', 'anon');await db.query('savepoint denied_anon');rejected=false;try{await ids();}catch{rejected=true;}await db.query('rollback to savepoint denied_anon');assert.ok(rejected);});
 console.log('PASS: '+count+' lead filter database groups; all fixtures rolled back');
}catch(error){console.error(error.stack);process.exitCode=1;}finally{await db.query('rollback').catch(()=>{});await db.end();}
