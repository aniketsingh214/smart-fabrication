import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { chromium,devices,expect } from '@playwright/test';
import { databaseClient } from './db-client.mjs';
import { operationalBrowserChecks } from './browser-operational-checks.mjs';
import { financeBrowserChecks } from './browser-finance-checks.mjs';
import { reportBrowserChecks } from './browser-report-checks.mjs';

// Administrative credentials are restricted to fixture creation/cleanup. Browser requests use real user sessions and RLS.
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const db=databaseClient(),fixtures=[],passedChecks=[];let browser,checks=0;
const base=process.env.TEST_BASE_URL??'http://localhost:3000';
async function check(name,fn){await fn();console.log(`PASS: ${name}`);checks++;passedChecks.push(name);}
try{
 await db.connect();
 for(const role of (process.env.TEST_AUTH_ROLE?[process.env.TEST_AUTH_ROLE]:['owner','customer'])){
  const email=`sf-browser-${crypto.randomUUID()}@example.invalid`,password=crypto.randomBytes(24).toString('base64url');
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Browser fixture ${role}`}});
  if(error||!data.user)throw new Error('Could not create isolated authentication fixture');
  fixtures.push({id:data.user.id,email,password,role});
  if(role==='owner')await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner')",[data.user.id]);
 }
 browser=await chromium.launch({channel:process.env.TEST_BROWSER_CHANNEL??'chrome',headless:true});
 for(const viewport of (process.env.TEST_AUTH_VIEWPORT?[process.env.TEST_AUTH_VIEWPORT]:['desktop','mobile']))for(const fixture of fixtures){
  const context=await browser.newContext(viewport==='mobile'?{...devices['iPhone 13'],baseURL:base}:{viewport:{width:1440,height:1000},baseURL:base});
  try{
   const page=await context.newPage();await page.goto('/login');
   await page.getByLabel('Email',{exact:true}).fill(fixture.email);await page.getByLabel('Password',{exact:true}).fill(fixture.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();
   await check(`${viewport} ${fixture.role}: real login reaches account`,async()=>{await page.waitForURL('**/account',{timeout:30000});await page.getByRole('heading',{name:/Welcome,/}).waitFor();});
   await check(`${viewport} ${fixture.role}: server identity and permissions`,async()=>{const response=await context.request.get('/api/v1/me');assert.equal(response.status(),200);const {data}=await response.json();assert.equal(data.id,fixture.id);assert.equal(data.permissions.includes('users.write'),fixture.role==='owner');});
   if(fixture.role==='owner'){
    await page.goto('/admin');await page.getByRole('heading',{name:'Dashboard',exact:true}).waitFor();
    await check(`${viewport} owner: quotation workspace and privileged API accessible`,async()=>{await page.goto('/admin/quotations');await page.getByRole('heading',{name:'Quotations',exact:true}).waitFor();const response=await context.request.get('/api/v1/admin/permissions');assert.equal(response.status(),200);});
    // UI request payloads are simulated here; matching real SQL revision behavior is covered by test:db.
    const quote={id:crypto.randomUUID(),name:'Browser quotation fixture',status:'draft',customer_id:crypto.randomUUID(),expires_at:new Date(Date.now()+86400000).toISOString(),created_at:new Date().toISOString()};
    let captured,revisionPayload,revisionHeader;
    const versions=[{id:crypto.randomUUID(),version:1,created_at:new Date().toISOString(),currency:'INR',total_minor:20000,snapshot:{items:[{description:'Gate',quantity:2,unit_minor:10000}],subtotal_minor:20000,discount_minor:0,tax_bps:0,total_minor:20000}}];
    await page.route('**/api/v1/admin/quotations**',async route=>{const request=route.request(),path=new URL(request.url()).pathname;let data;
     if(path.endsWith('/versions')&&request.method()==='POST'){captured=request.postDataJSON();versions.unshift({id:crypto.randomUUID(),version:2,created_at:new Date().toISOString(),currency:'INR',total_minor:119,snapshot:{...captured,subtotal_minor:101,total_minor:119}});data={result:versions[0].id};}
     else if(path.endsWith('/versions'))data=versions;
     else if(path.endsWith('/revise')){revisionPayload=request.postDataJSON();revisionHeader=request.headers()['idempotency-key'];quote.status='superseded';data={result:crypto.randomUUID()};}
     else data=[quote];
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data,meta:{nextCursor:null},requestId:crypto.randomUUID()})});
    });
    await check(`${viewport} owner: quotation editor posts exact discount/tax fields (simulated API)`,async()=>{
     await page.reload();await page.getByRole('button',{name:'View details of Browser quotation fixture',exact:true}).click();
     await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
     const dialog=page.getByRole('dialog',{name:quote.name,exact:true});await dialog.getByLabel('Item 1 quantity',{exact:true}).fill('1.005');await dialog.getByLabel('Item 1 rate in rupees',{exact:true}).fill('1');await dialog.getByLabel('Tax (%)',{exact:true}).fill('18');
     if(process.env.TEST_AUTH_DIAGNOSTICS)console.log(JSON.stringify(await page.evaluate(()=>({width:innerWidth,client:document.documentElement.clientWidth,visual:visualViewport?.width,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,15).map(e=>({tag:e.tagName,classes:e.className,rect:e.getBoundingClientRect().toJSON(),minWidth:getComputedStyle(e).minWidth}))}))));
     await dialog.getByRole('button',{name:'Save version',exact:true}).click();await expect(dialog.locator('summary').filter({hasText:'Version 2'})).toBeVisible();assert.equal(captured.tax_bps,1800);assert.equal(captured.discount_minor,0);assert.deepEqual(captured.items,[{description:'Gate',quantity:1.005,unit_minor:100}]);
     await dialog.getByRole('button',{name:'Close dialog',exact:true}).click();
    });
    await check(`${viewport} owner: issued-quote revision form sends stable key and summary (simulated API)`,async()=>{
     quote.status='approved';await page.reload();await page.getByRole('button',{name:'View details of Browser quotation fixture',exact:true}).click();
     const dialog=page.getByRole('dialog',{name:quote.name,exact:true});await dialog.getByLabel('New expiry',{exact:true}).fill('2030-10-20T12:00');await dialog.getByLabel('Revision summary (customer-visible)',{exact:true}).fill('Dimensions updated after site visit');await dialog.getByRole('button',{name:'Create revision draft',exact:true}).click();await expect(page.getByText('Revision draft created. Open the new draft to edit prices and approve it.',{exact:true})).toBeVisible();assert.equal(revisionPayload.reason,'Dimensions updated after site visit');assert.ok(Date.parse(revisionPayload.expires_at)>Date.now());assert.match(revisionHeader,/^[a-f0-9-]{36}$/);
    });
    await page.unrouteAll({behavior:'wait'});
    await operationalBrowserChecks(page,check,viewport);
    await financeBrowserChecks(page,check,viewport);
    await reportBrowserChecks(page,context,check,viewport);
   }else{
    await check(`${viewport} customer: admin, report exports and financial controls denied`,async()=>{await page.goto('/admin');await page.waitForURL('**/account');const response=await context.request.get('/api/v1/admin/permissions');assert.equal(response.status(),403);assert.equal((await context.request.get('/api/v1/reports/trends')).status(),403);assert.equal((await context.request.get('/api/v1/reports/financial-adjustments/export')).status(),403);const headers={'Content-Type':'application/json',Origin:base,'Idempotency-Key':crypto.randomUUID()};assert.equal((await context.request.post('/api/v1/finance/adjustments',{headers,data:{kind:'supplier_refund',source_id:crypto.randomUUID(),posting_date:'2026-10-15',mode:'bank',reference:'Denied fixture',reason:'Denied refund fixture',confirmed:true,amount_minor:1}})).status(),403);assert.equal((await context.request.post('/api/v1/finance/periods/close',{headers,data:{closed_through:'2026-09-30',reason:'Denied closure fixture',confirmed:true}})).status(),403);});
   }
   await check(`${viewport} ${fixture.role}: sign-out removes access`,async()=>{await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL(base+'/');await page.goto('/account');await page.waitForURL('**/login');const response=await context.request.get('/api/v1/me');assert.equal(response.status(),401);});
  }catch(e){const activePage=context.pages()[0];if(activePage){await activePage.screenshot({path:`test-results/auth-${viewport}-failure.png`,fullPage:true}).catch(()=>{});console.error(JSON.stringify(await activePage.evaluate(()=>{const dialog=document.querySelector('dialog'),button=[...document.querySelectorAll('button')].find(b=>b.textContent==='Save version');return{viewport:{width:innerWidth,height:innerHeight},dialog:dialog?{rect:dialog.getBoundingClientRect().toJSON(),scrollTop:dialog.scrollTop,scrollHeight:dialog.scrollHeight}:null,button:button?.getBoundingClientRect().toJSON()};}).catch(()=>({}))));}throw e;}finally{await context.close();}
 }
 console.log(`PASS: ${checks} authenticated browser checks. No real owner's password or session was used.`);
}catch(e){console.error(`Authenticated browser verification failed: ${e.message}`);process.exitCode=1;}
finally{
 await browser?.close();
 for(const fixture of fixtures){try{
  // Only IDs created by this run, verified by their generated fixture email, may be removed.
  const match=await db.query('select id from auth.users where id=$1 and email=$2',[fixture.id,fixture.email]);if(match.rowCount!==1)throw new Error('Fixture identity verification failed');
  await db.query('begin');await db.query('delete from public.user_roles where user_id=$1',[fixture.id]);await db.query('delete from public.profiles where id=$1',[fixture.id]);await db.query('commit');
  const {error}=await admin.auth.admin.deleteUser(fixture.id);if(error)throw new Error('Authentication fixture deletion failed');
 }catch(e){await db.query('rollback').catch(()=>{});console.error(`Fixture cleanup failed for ${fixture.id}: ${e.message}`);process.exitCode=1;}}
 await db.end().catch(()=>{});
 if(fixtures.length)console.log('Authentication fixture cleanup finished; immutable audit history is retained.');
 await mkdir('test-results',{recursive:true});
 await writeFile('test-results/authenticated-latest.json',JSON.stringify({finishedAt:new Date().toISOString(),passed:!process.exitCode,browser:process.env.TEST_BROWSER_CHANNEL??'chrome',viewport:process.env.TEST_AUTH_VIEWPORT??'desktop/mobile',role:process.env.TEST_AUTH_ROLE??'owner/customer',checks,passedChecks,scope:'Real login/read APIs; operational writes simulated. A failure includes fixture cleanup failures.'},null,2));
}
