import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { databaseClient } from './db-client.mjs';
const db=databaseClient();let checks=0;
db.on('error',error=>{console.error('Dashboard database connection ended: '+(error.code??'CONNECTION_ERROR'));process.exitCode=1;});
const owner=crypto.randomUUID(),sales=crypto.randomUUID(),customer=crypto.randomUUID();
async function check(label,action){await action();checks++;console.log('PASS: '+label);}
async function actor(role,id){await db.query('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[id??'',JSON.stringify({sub:id,role})]);await db.query(`set local role ${role}`);}
async function snapshot(scope='business',task='all',page=1){return(await db.query('select public.workshop_dashboard($1,$2,$3) result',[scope,task,page])).rows[0].result;}
async function denied(action){await db.query('savepoint denied');let rejected=false;try{await action();}catch{rejected=true;}await db.query('rollback to savepoint denied');assert.ok(rejected);}
try{
 await db.connect();await db.query('begin');
 await db.query("set local statement_timeout='30s'");
 if(process.argv.includes('--candidate')){const sql=await fs.readFile('supabase/migrations/202610250047_workshop_dashboard.sql','utf8');await db.query(sql.replace(/^begin;\s*/,'').replace(/commit;\s*$/,''));}
 for(const id of [owner,sales,customer])await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,$2,'{}')",[id,`${id}@example.invalid`]);
 await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner'),($2,'sales')",[owner,sales]);await actor('authenticated',owner);
 const baseline=await snapshot(),demo=await snapshot('demo');
 const run=crypto.randomUUID();const {rows:leads}=await db.query("insert into public.leads(name,email,phone,city,requirement,assigned_to) values($1,'rollback-business@example.com','9876543210','Jhansi','Synthetic rollback-only dashboard business-scope probe',$3),($2,'test@example.invalid','9876543211','Jhansi','Synthetic rollback-only dashboard demo-scope probe',$3) returning id",[`Operational enquiry ${run}`,`TEST ONLY dashboard ${run}`,owner]);const lead=leads[0].id,testLead=leads[1].id;
 await check('Business and demo markers remain separate without deleting source records',async()=>{
  const business=await snapshot(),test=await snapshot('demo');assert.equal(business.metrics.new_leads,baseline.metrics.new_leads+1);assert.equal(test.metrics.new_leads,demo.metrics.new_leads+1);
  assert.equal((await db.query('select count(*)::int count from public.leads where id=any($1::uuid[])',[[lead,testLead]])).rows[0].count,2);
 });
 await check('India day bounds cover exactly one local calendar day',async()=>{const data=await snapshot();assert.equal(new Date(data.day_end)-new Date(data.day_start),86400000);assert.equal(new Date(data.day_start).toISOString().slice(11,16),'18:30');});
 const {rows:followups}=await db.query("insert into public.follow_ups(lead_id,due_at,note) values($1,now()-interval '2 days','Rollback overdue'),($1,now()+interval '2 days','Rollback future') returning id",[lead]);
 await check('Due follow-ups include overdue work and exclude future tasks',async()=>{const data=await snapshot('business','followup');assert.equal(data.metrics.overdue_followups,baseline.metrics.overdue_followups+1);assert.equal(data.task_total,data.metrics.followups_due);assert.ok(!data.tasks.some(t=>t.id===followups[1].id));});
 const contact=(await db.query("insert into public.customers(name,phone,email) values('Rollback dashboard contact','9876543212','rollback-dashboard@example.com') returning id")).rows[0].id;
 const quote=(await db.query("insert into public.quotations(name,customer_id,expires_at) values($1,$2,now()+interval '7 days') returning id",[`Operational quote ${run}`,contact])).rows[0].id;
 await check('Unpriced drafts do not count as ready-for-approval tasks',async()=>assert.equal((await snapshot()).metrics.approvals,baseline.metrics.approvals));
 await db.query("select public.make_quotation_version($1,'[{\"description\":\"Rollback item\",\"quantity\":1,\"unit_minor\":10000}]'::jsonb,0,0)",[quote]);
 await check('Priced drafts count once and drill into their exact record',async()=>{const data=await snapshot('business','approval');assert.equal(data.metrics.approvals,baseline.metrics.approvals+1);assert.equal(data.task_total,data.metrics.approvals);});
 await db.query('select public.approve_quotation($1)',[quote]);await db.query('select public.respond_quotation($1,true)',[quote]);const order=(await db.query('select public.convert_quotation($1) id',[quote])).rows[0].id;
 const delivery=(await db.query("insert into public.deliveries(name,order_id,scheduled_at,address,crew) values($1,$2,(((now() at time zone 'Asia/Kolkata')::date)::timestamp at time zone 'Asia/Kolkata')+interval '2 hours','Rollback site address','Rollback crew') returning id",[`Operational delivery ${run}`,order])).rows[0].id;
 await db.query("insert into public.installations(name,delivery_id) values('Rollback installation',$1)",[delivery]);
 await check('Delivery today and unscheduled pending installation have independent counts',async()=>{const data=await snapshot('business','delivery');assert.equal(data.metrics.deliveries_today,baseline.metrics.deliveries_today+1);assert.equal(data.metrics.pending_installations,baseline.metrics.pending_installations+1);assert.equal(data.task_total,data.metrics.deliveries_today);});
 await check('Order board exposes scoped counts, narrow rows and no cash totals',async()=>{const data=await snapshot();assert.equal(data.metrics.open_orders,baseline.metrics.open_orders+1);assert.deepEqual(data.board.map(s=>s.key),['confirmed','production','ready','delivery','completed']);for(const stage of data.board){assert.ok(stage.items.length<=3);assert.ok(stage.items.every(item=>!('total_minor'in item)));}});
 await db.query("select public.transition_lead($1,'LOST',1)",[lead]);
 await check('Closed leads disappear from active counts and daily follow-ups',async()=>{const data=await snapshot();assert.equal(data.metrics.active_leads,baseline.metrics.active_leads);assert.equal(data.metrics.followups_due,baseline.metrics.followups_due);});
 await check('Invalid page/scope filters are rejected',async()=>{await denied(()=>snapshot('unknown'));await denied(()=>snapshot('business','all',0));});
 await actor('authenticated',sales);
 await check('Assigned-other leads stay outside sales RLS and hidden metrics remain null',async()=>{const data=await snapshot('all','new');assert.ok(!data.tasks.some(t=>t.id===lead||t.id===testLead));const permission=(await db.query("select public.has_permission('delivery.read') allowed")).rows[0].allowed;if(!permission)assert.equal(data.metrics.deliveries_today,null);});
 await actor('authenticated',customer);await check('Customer sessions cannot obtain the staff dashboard',async()=>denied(()=>snapshot()));await actor('anon');await check('Anonymous RPC calls are denied',async()=>denied(()=>snapshot()));
 console.log(`PASS: ${checks} dashboard SQL/RLS checks; all users, workflow fixtures and candidate DDL rolled back.`);
}catch(error){console.error('Dashboard database checks failed: '+error.message);process.exitCode=1;}
finally{await db.query('rollback').catch(()=>{});await db.end().catch(()=>{});}
