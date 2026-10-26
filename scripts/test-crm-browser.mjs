import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { chromium, devices, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { databaseClient } from './db-client.mjs';
import { retirePublicationFixture } from './retire-publication-fixture.mjs';

const base=process.env.TEST_BASE_URL??'http://localhost:3000';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Local target required');
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,options);
const db=databaseClient(),run=crypto.randomUUID(),users=[],checks=[],fixture={run};
let browser,owner,sales,cleaned=false;
async function check(name,action){console.log('INFO: '+name);await action();checks.push(name);console.log('PASS: '+name);}
async function user(role){
 const email=`sf-publication-${role}-${run}@example.invalid`,password=crypto.randomBytes(32).toString('base64url');
 const auth=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`TEST ONLY CRM ${role} ${run}`}});
 assert.equal(created.error,null,'Generated account creation failed');
 const record={id:created.data.user.id,email,password,auth};users.push(record);
 await db.query('insert into public.user_roles(user_id,role_id) values($1,$2)',[record.id,role]);
 const login=await auth.auth.signInWithPassword({email,password});assert.equal(login.error,null,'Generated login failed');
 return {...record,token:login.data.session.access_token};
}
async function request(path,method='GET',body,actor=owner){
 return fetch(base+path,{method,headers:{...(actor?{Authorization:'Bearer '+actor.token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
}
async function api(path,method='GET',body,actor=owner){const response=await request('/api/v1'+path,method,body,actor),result=await response.json();assert.ok(response.ok,`${method} ${path}: ${response.status} ${result.error?.code??''}`);return result.data;}
async function login(page,account){await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/account');}
async function openLead(page){await page.goto('/admin/leads');await page.getByRole('textbox',{name:'Search Leads',exact:true}).fill(`TEST ONLY CRM ${run}`);await page.getByRole('button',{name:'Search',exact:true}).click();const row=page.getByRole('row').filter({hasText:`TEST ONLY CRM ${run}`});await expect(row).toHaveCount(1);await row.getByRole('button',{name:/View details of/}).click();}
try{
 await db.connect();owner=await user('owner');sales=await user('sales');
 browser=await chromium.launch({channel:process.env.TEST_BROWSER_CHANNEL??'msedge',headless:true});
 const guest=await browser.newContext({...devices['iPhone 13'],baseURL:base});guest.setDefaultTimeout(30000);await guest.addInitScript(()=>sessionStorage.setItem('sf:visitor-dismissed','1'));const publicPage=await guest.newPage();
 await check('Guest browser creates enquiry and privately uploads a real reference image',async()=>{
  await publicPage.goto('/contact');
  await expect(publicPage.getByRole('heading',{name:'Request a quotation',exact:true})).toBeVisible({timeout:30000});
  await expect(publicPage.getByRole('button',{name:'Send enquiry',exact:true})).toBeEnabled({timeout:30000});
  await publicPage.getByLabel('Your name').fill(`TEST ONLY CRM ${run}`);
  await publicPage.getByLabel('Mobile / WhatsApp').fill('910000'+crypto.randomInt(1000000).toString().padStart(6,'0'));
  await publicPage.getByLabel('Email (optional)').fill(`sf-crm-lead-${run}@example.invalid`);await publicPage.getByLabel('City / area').fill('Test area');
  await publicPage.getByLabel('Tell us about your requirement').fill('TEST ONLY CRM private reference acceptance; no real customer contact.');
  const image=await sharp({create:{width:12,height:12,channels:3,background:'#ea580c'}}).png().toBuffer();
  await publicPage.getByLabel('Reference design (optional)').setInputFiles({name:'test-only-reference.png',mimeType:'image/png',buffer:image});
  const created=publicPage.waitForResponse(r=>new URL(r.url()).pathname==='/api/v1/leads'&&r.request().method()==='POST');
  const confirmed=publicPage.waitForResponse(r=>new URL(r.url()).pathname==='/api/v1/uploads/guest/confirm'&&r.request().method()==='POST',{timeout:90000});
  await publicPage.getByRole('button',{name:'Send enquiry',exact:true}).click();const lead=await created;assert.equal(lead.status(),201);fixture.leadId=(await lead.json()).data.id;
  assert.equal((await confirmed).status(),200);await expect(publicPage.getByText('Attaching your reference image…',{exact:true})).toHaveCount(0);
  await expect(publicPage.getByRole('heading',{name:'Your enquiry has been received.',exact:true})).toBeVisible();await expect(publicPage.getByRole('status').filter({has:publicPage.getByRole('heading',{name:'Your enquiry has been received.',exact:true})}).getByRole('alert')).toHaveCount(0);
  const attachments=await api(`/leads/${fixture.leadId}/attachments`);assert.equal(attachments.length,1);fixture.mediaId=attachments[0].media_id;
  const {rows}=await db.query('select m.visibility,m.context,i.confirmed_at from public.media_assets m join public.upload_intents i on i.public_id=m.public_id where m.id=$1',[fixture.mediaId]);
  assert.equal(rows[0].visibility,'private');assert.equal(rows[0].context,'customer_design');assert.ok(rows[0].confirmed_at);
 });
 await check('Other-assigned sales and anonymous callers cannot read the private reference',async()=>{
  await api(`/leads/${fixture.leadId}/assign`,'POST',{staff_user:owner.id});
  assert.deepEqual(await api(`/leads/${fixture.leadId}/attachments`,'GET',undefined,sales),[]);
  assert.equal((await request('/api/v1/uploads/'+fixture.mediaId,'GET',undefined,sales)).status,404);
  assert.equal((await request('/api/v1/uploads/'+fixture.mediaId,'GET',undefined,null)).status,401);
 });
 const ownerContext=await browser.newContext({baseURL:base});ownerContext.setDefaultTimeout(30000);const ownerPage=await ownerContext.newPage();await login(ownerPage,owner);
 await check('Owner assigns the guest enquiry to generated sales staff through the browser',async()=>{
  await openLead(ownerPage);const staff=ownerPage.getByRole('combobox',{name:'Assign to staff',exact:true});
  await expect(async()=>{
   if(await staff.locator(`option[value="${sales.id}"]`).count())return;
   const more=ownerPage.getByRole('button',{name:'More staff',exact:true});
   if(await more.isVisible()){await more.click();await expect(more).toBeEnabled();}
   expect(await staff.locator(`option[value="${sales.id}"]`).count()).toBeGreaterThan(0);
  }).toPass({timeout:20000});
  await staff.selectOption(sales.id);const assigned=ownerPage.waitForResponse(r=>new URL(r.url()).pathname===`/api/v1/leads/${fixture.leadId}/assign`);await ownerPage.getByRole('button',{name:'Assign',exact:true}).click();assert.equal((await assigned).status(),200);
  assert.equal((await api('/admin/leads/'+fixture.leadId)).assigned_to,sales.id);
 });
 const salesContext=await browser.newContext({...devices['iPhone 13'],baseURL:base});salesContext.setDefaultTimeout(30000);const salesPage=await salesContext.newPage();await login(salesPage,sales);
 await check('Assigned sales browser adds an internal note and opens the verified private reference',async()=>{
  await openLead(salesPage);await salesPage.getByRole('tab',{name:'Notes',exact:true}).click();await salesPage.getByLabel('Internal note',{exact:true}).fill('TEST ONLY CRM contacted; follow-up scheduled.');await salesPage.getByRole('button',{name:'Add note',exact:true}).click();await expect(salesPage.getByText('Internal note added.',{exact:true})).toBeVisible();
  await expect(salesPage.getByRole('button',{name:'View private image 1',exact:true})).toBeVisible();const delivery=await api('/uploads/'+fixture.mediaId,'GET',undefined,sales);assert.equal(delivery.expiresIn,300);const image=await salesContext.request.get(delivery.url);assert.equal(image.status(),200);assert.ok((await image.body()).length>0);
  const lead=await api('/admin/leads/'+fixture.leadId,'GET',undefined,sales);await api(`/admin/leads/${fixture.leadId}/transitions`,'POST',{status:'CONTACTED',version:lead.version},sales);
  assert.ok((await api(`/leads/${fixture.leadId}/notes`,'GET',undefined,sales)).some(n=>n.note==='TEST ONLY CRM contacted; follow-up scheduled.'));
 });
 await check('Due/future/completed follow-ups and authenticated scheduler retry remain correctly scoped',async()=>{
  const due=await api('/admin/follow-ups','POST',{lead_id:fixture.leadId,due_at:new Date(Date.now()-60000).toISOString(),note:'TEST ONLY CRM due',status:'pending'},sales);fixture.followUps=[due.id];
  const future=await api('/admin/follow-ups','POST',{lead_id:fixture.leadId,due_at:new Date(Date.now()+86400000).toISOString(),note:'TEST ONLY CRM future',status:'pending'},sales);fixture.followUps.push(future.id);
  const completed=await api('/admin/follow-ups','POST',{lead_id:fixture.leadId,due_at:new Date(Date.now()-60000).toISOString(),note:'TEST ONLY CRM completed',status:'completed'},sales);fixture.followUps.push(completed.id);
  assert.ok(process.env.CRON_SECRET,'Scheduler secret must be configured');
  assert.equal((await request('/api/internal/reminders','GET',undefined,null)).status,401);assert.equal((await request('/api/internal/reminders','GET',undefined,sales)).status,401);
  // The real dispatcher is global: refuse to process unrelated development work.
  const {rows}=await db.query("select (select count(*) from public.follow_ups where status='pending' and due_at<=now() and id<>all($1::uuid[]))+(select count(*) from public.quotations where status in('draft','approved') and expires_at<=now()) count",[fixture.followUps]);assert.equal(Number(rows[0].count),0,'Unrelated due work exists; global dispatch intentionally not invoked');
  const dispatch=()=>fetch(base+'/api/internal/reminders',{headers:{Authorization:'Bearer '+process.env.CRON_SECRET},signal:AbortSignal.timeout(60000)});
  const first=await dispatch();assert.equal(first.status,200);assert.equal((await first.json()).processed,1);
  const retries=await Promise.all([dispatch(),dispatch()]);for(const response of retries){assert.equal(response.status,200);assert.equal((await response.json()).processed,0);}
  const notifications=await db.query("select id,user_id,entity_id from public.notifications where entity_type='follow_ups' and entity_id=any($1::uuid[])",[fixture.followUps]);assert.equal(notifications.rows.length,1);assert.equal(notifications.rows[0].user_id,sales.id);assert.equal(notifications.rows[0].entity_id,due.id);fixture.notificationId=notifications.rows[0].id;
  await salesPage.goto('/admin/notifications');await expect(salesPage.getByText('A scheduled follow-up is ready for action.',{exact:true})).toBeVisible();
  await api('/admin/follow-ups/'+due.id,'PATCH',{status:'completed'},sales);
 });
}catch(error){console.error('CRM acceptance failed: '+error.message);process.exitCode=1;}
finally{
 try{
  if(owner){
   // Reconcile a guest response lost after commit by this exact generated marker.
   const {rows}=await db.query('select id from public.leads where name=$1',[`TEST ONLY CRM ${run}`]);assert.ok(rows.length<=1);fixture.leadId??=rows[0]?.id;
   if(fixture.leadId){const followUps=await db.query('select id from public.follow_ups where lead_id=$1',[fixture.leadId]);for(const item of followUps.rows)await api('/admin/follow-ups/'+item.id,'PATCH',{status:'completed'});const lead=await api('/admin/leads/'+fixture.leadId);if(lead.status!=='LOST')await api(`/admin/leads/${fixture.leadId}/transitions`,'POST',{status:'LOST',version:lead.version});}
  }
  cleaned=true;
 }catch(error){console.error('CRM fixture closure failed: '+error.message);process.exitCode=1;}
 await browser?.close();
 for(const account of users)try{await retirePublicationFixture({...account,admin});}catch(error){console.error('CRM generated login retirement failed: '+error.message);process.exitCode=1;}
 await db.end().catch(()=>{});await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/crm-browser-latest.json',JSON.stringify({finishedAt:new Date().toISOString(),passed:!process.exitCode,checks,fixture,closed:cleaned,scope:'Real guest browser/Cloudinary/DB, browser assignment/sales note/private delivery, real scheduler/retries. No external messages or financial/stock posting. Closed-lost lead, completed follow-ups, private synthetic media and immutable audit retained; generated staff retired.'},null,2));
 if(!process.exitCode)console.log(`PASS: ${checks.length} real CRM workflow checks; labeled records closed and generated staff retired.`);
}
