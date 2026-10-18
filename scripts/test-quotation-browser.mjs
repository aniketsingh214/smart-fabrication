import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { chromium, devices, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { databaseClient } from './db-client.mjs';
import { retirePublicationFixture } from './retire-publication-fixture.mjs';

const base=process.env.TEST_BASE_URL??'http://localhost:3000';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Local target required');
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,options),db=databaseClient();
const run=crypto.randomUUID(),users=[],checks=[],fixture={run},title=`TEST ONLY quotation ${run}`;
let owner,customer,stranger,browser,closed=false;
async function check(name,action){console.log('INFO: '+name);await action();checks.push(name);console.log('PASS: '+name);}
async function newUser(role){
 const email=`sf-publication-${role}-${crypto.randomUUID()}@example.invalid`,password=crypto.randomBytes(32).toString('base64url');
 const auth=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`TEST ONLY quotation ${role} ${run}`}});assert.equal(created.error,null);
 const account={id:created.data.user.id,email,password,auth};users.push(account);
 await db.query('insert into public.user_roles(user_id,role_id) values($1,$2) on conflict do nothing',[account.id,role]);
 const login=await auth.auth.signInWithPassword({email,password});assert.equal(login.error,null);return {...account,token:login.data.session.access_token};
}
async function request(path,method='GET',body,actor=owner,key){return fetch(base+'/api/v1'+path,{method,headers:{...(actor?{Authorization:'Bearer '+actor.token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(60000)});}
async function api(path,method='GET',body,actor=owner,key){const response=await request(path,method,body,actor,key),result=await response.json();assert.ok(response.ok,`${method} ${path}: ${response.status} ${result.error?.code??''}`);return result.data;}
async function login(page,account){await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/account');}
async function openQuote(page){await page.goto('/admin/quotations');await page.getByRole('textbox',{name:'Search Quotations',exact:true}).fill(title);await page.getByRole('button',{name:'Search',exact:true}).click();const row=page.getByRole('row').filter({has:page.locator(`button[aria-label="View details of ${title}"]`)});await expect(row).toHaveCount(1);await row.getByRole('button',{name:'View details of '+title,exact:true}).click();await expect(page.getByRole('region',{name:'Quotation versions'})).toBeVisible();}
async function pdf(response,version){assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/application\/pdf/);assert.match(response.headers()['cache-control'],/private, no-store/);assert.match(response.headers()['content-disposition'],new RegExp(`-v${version}\\.pdf`));const bytes=await response.body();assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>1000);}
try{
 await db.connect();owner=await newUser('owner');customer=await newUser('customer');stranger=await newUser('customer');
 const contact=await api('/admin/customers','POST',{name:title,phone:'910000'+crypto.randomInt(1000000).toString().padStart(6,'0'),email:customer.email,address:'TEST ONLY',notes:'Synthetic acceptance; no real customer'});fixture.customerId=contact.id;
 await api(`/customers/${contact.id}/link`,'POST',{email:customer.email});
 const quote=await api('/admin/quotations','POST',{name:title,customer_id:contact.id,expires_at:new Date(Date.now()+7*86400000).toISOString()});fixture.quoteId=quote.id;
 browser=await chromium.launch({channel:process.env.TEST_BROWSER_CHANNEL??'msedge',headless:true});const staffContext=await browser.newContext({baseURL:base});staffContext.setDefaultTimeout(30000);const staffPage=await staffContext.newPage();await login(staffPage,owner);
 const customerContext=await browser.newContext({...devices['iPhone 13'],baseURL:base});customerContext.setDefaultTimeout(30000);const customerPage=await customerContext.newPage();await login(customerPage,customer);
 await check('Draft quote and draft PDF remain hidden from its customer and other accounts',async()=>{
  assert.equal((await request('/quotations/'+quote.id,'GET',undefined,customer)).status,404);assert.equal((await request(`/quotations/${quote.id}/pdf`,'GET',undefined,customer)).status,404);assert.equal((await request(`/quotations/${quote.id}/pdf`,'GET',undefined,null)).status,401);
 });
 await check('Owner browser saves two immutable price versions with discount-before-tax totals',async()=>{
  await openQuote(staffPage,quote.id);await staffPage.getByRole('textbox',{name:'Item 1 description',exact:true}).fill('TEST ONLY steel gate');await staffPage.getByRole('spinbutton',{name:'Item 1 quantity',exact:true}).fill('2');await staffPage.getByRole('spinbutton',{name:'Item 1 rate in rupees',exact:true}).fill('100');await staffPage.getByLabel('Discount (INR)',{exact:true}).fill('10');await staffPage.getByLabel('Tax (%)',{exact:true}).fill('18');
  await staffPage.getByRole('button',{name:'Save version',exact:true}).click();await expect(staffPage.getByText('New immutable version saved. Previous versions remain available.',{exact:true})).toBeVisible();
  let versions=await api(`/admin/quotations/${quote.id}/versions`);assert.equal(versions.length,1);assert.equal(Number(versions[0].total_minor),22420);fixture.original=versions[0];
  await staffPage.getByRole('spinbutton',{name:'Item 1 rate in rupees',exact:true}).fill('150');const saved=staffPage.waitForResponse(r=>new URL(r.url()).pathname===`/api/v1/admin/quotations/${quote.id}/versions`&&r.request().method()==='POST');await staffPage.getByRole('button',{name:'Save version',exact:true}).click();assert.equal((await saved).status(),200);
  versions=await api(`/admin/quotations/${quote.id}/versions`);assert.equal(versions.length,2);assert.equal(Number(versions[0].total_minor),34220);assert.deepEqual(versions[1],fixture.original);
  await expect(staffPage.getByRole('link',{name:'Download version 1 PDF',exact:true})).toHaveCount(1,{timeout:20000});
  await pdf(await staffContext.request.get(`/api/v1/quotations/${quote.id}/pdf?version=1`),1);await pdf(await staffContext.request.get(`/api/v1/quotations/${quote.id}/pdf?version=2`),2);
 });
 await check('Approved quote is customer-visible with working PDF and cross-account denial',async()=>{
  const approved=staffPage.waitForResponse(r=>new URL(r.url()).pathname===`/api/v1/admin/quotations/${quote.id}/approve`);await staffPage.getByRole('button',{name:'Approve quotation',exact:true}).click();assert.equal((await approved).status(),200);
  await customerPage.goto('/account?quotation='+quote.id);await expect(customerPage.getByRole('heading',{name:title,exact:true})).toBeVisible();await expect(customerPage.getByRole('button',{name:'Accept',exact:true})).toBeVisible();
  await pdf(await customerContext.request.get(`/api/v1/quotations/${quote.id}/pdf`),2);await pdf(await customerContext.request.get(`/api/v1/quotations/${quote.id}/pdf?version=1`),1);
  assert.equal((await request(`/quotations/${quote.id}/pdf?version=999`,'GET',undefined,customer)).status,404);assert.equal((await request(`/quotations/${quote.id}/pdf?version=0`,'GET',undefined,customer)).status,422);
  assert.equal((await request(`/quotations/${quote.id}/pdf`,'GET',undefined,stranger)).status,404);assert.equal((await request(`/quotations/${quote.id}/accept`,'POST',{},stranger)).status,409);
  await customerPage.getByRole('button',{name:'Reject',exact:true}).click();await expect(customerPage.locator(`#quotation-${quote.id}`).getByText('rejected',{exact:true})).toBeVisible();
 });
 await check('Rejected quote revises once with original history preserved and separate approval',async()=>{
  const key=crypto.randomUUID(),payload={expires_at:new Date(Date.now()+8*86400000).toISOString(),reason:'TEST ONLY revised scope; no real customer order'};
  fixture.revisedId=(await api(`/admin/quotations/${quote.id}/revise`,'POST',payload,owner,key)).result;
  assert.equal((await api(`/admin/quotations/${quote.id}/revise`,'POST',payload,owner,key)).result,fixture.revisedId);
  assert.equal((await request(`/admin/quotations/${quote.id}/revise`,'POST',{...payload,reason:'Conflicting retry'},owner,key)).status,409);
  assert.equal((await request('/quotations/'+fixture.revisedId,'GET',undefined,customer)).status,404);
  const oldVersions=await api(`/admin/quotations/${quote.id}/versions`);assert.deepEqual(oldVersions[1],fixture.original);assert.equal((await api('/admin/quotations/'+quote.id)).status,'superseded');
  await api(`/admin/quotations/${fixture.revisedId}/approve`,'POST',{});
  await customerPage.goto('/account?quotation='+fixture.revisedId);await expect(customerPage.getByRole('button',{name:'Accept',exact:true})).toBeVisible();
  await customerPage.getByRole('button',{name:'Accept',exact:true}).click();await expect(customerPage.locator(`#quotation-${fixture.revisedId}`).getByText('accepted',{exact:true})).toBeVisible();
 });
 await check('Accepted quote converts once, retains price and cannot be repriced or revised',async()=>{
  const path=`/admin/quotations/${fixture.revisedId}/convert`;fixture.orderId=(await api(path,'POST',{})).result;assert.match(fixture.orderId,/^[0-9a-f-]{36}$/);assert.equal((await api(path,'POST',{})).result,fixture.orderId);
  const order=await api('/admin/orders/'+fixture.orderId);assert.equal(Number(order.total_minor),34220);
  const {rows}=await db.query('select count(*) count from public.orders o join public.quotation_versions qv on qv.id=o.quotation_version_id where qv.quotation_id=$1',[fixture.revisedId]);assert.equal(Number(rows[0].count),1);
  assert.equal((await request(`/admin/quotations/${fixture.revisedId}/versions`,'POST',{items:[{description:'Must fail',quantity:1,unit_minor:1}]})).status,409);
  assert.equal((await request(`/admin/quotations/${fixture.revisedId}/revise`,'POST',{expires_at:new Date(Date.now()+86400000).toISOString(),reason:'Must fail'},owner,crypto.randomUUID())).status,409);
  await customerPage.goto('/account');await expect(customerPage.getByRole('link',{name:'View order timeline →',exact:true})).toBeVisible();
 });
}catch(error){console.error('Quotation acceptance failed: '+error.message);process.exitCode=1;}
finally{
 try{
  if(owner){
   // Reconcile committed fixture IDs before retirement; never delete immutable quotes/orders.
   const {rows}=await db.query('select id,status,version from public.orders where customer_id=$1',[fixture.customerId??crypto.randomUUID()]);
   for(const order of rows){assert.ok(order.status==='CONFIRMED'||order.status==='CANCELLED','Test order unexpectedly advanced');if(order.status!=='CANCELLED')await api(`/admin/orders/${order.id}/transitions`,'POST',{status:'CANCELLED',version:order.version,note:'TEST ONLY acceptance completed; no payment/production/stock'});}
   // Draft/approved fixtures cannot expire through a future global scheduler run.
   const quotes=await db.query('select id,status from public.quotations where customer_id=$1',[fixture.customerId??crypto.randomUUID()]);
   for(const quote of quotes.rows){if(quote.status==='draft'){const versions=await api(`/admin/quotations/${quote.id}/versions`);if(versions.length){await api(`/admin/quotations/${quote.id}/approve`,'POST',{});await api(`/admin/quotations/${quote.id}/reject`,'POST',{});}else await api('/admin/quotations/'+quote.id,'PATCH',{expires_at:new Date(Date.now()+36500*86400000).toISOString()});}else if(quote.status==='approved')await api(`/admin/quotations/${quote.id}/reject`,'POST',{});}
  }
  closed=true;
 }catch(error){console.error('Quotation fixture closure failed: '+error.message);process.exitCode=1;}
 await browser?.close();for(const account of users)try{await retirePublicationFixture({...account,admin});}catch(error){console.error('Quotation login retirement failed: '+error.message);process.exitCode=1;}
 await db.end().catch(()=>{});await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/quotation-browser-latest.json',JSON.stringify({finishedAt:new Date().toISOString(),passed:!process.exitCode,checks,fixture,closed,scope:'Real owner/customer browsers and APIs; historical/latest PDFs, rejection/revision/acceptance/idempotent conversion. Synthetic immutable quotations/customer and cancelled unpaid order retained; generated identities retired. No payment, stock, production, external message or deployment.'},null,2));
 if(!process.exitCode)console.log(`PASS: ${checks.length} real quotation/customer/PDF workflow checks; fixtures closed and generated logins retired.`);
}
