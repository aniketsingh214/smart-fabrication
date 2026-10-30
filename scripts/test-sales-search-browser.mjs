import {salesExample as repair} from './sales-search-example.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {chromium,expect as baseExpect} from '@playwright/test';
const expect=baseExpect.configure({timeout:45000});
import {createClient} from '@supabase/supabase-js';
import {databaseClient} from './db-client.mjs';
import {retirePublicationFixture} from './retire-publication-fixture.mjs';
const base=process.env.TEST_BASE_URL??'http://localhost:3000';
assert.ok(['localhost','127.0.0.1','smartfabrication.vercel.app'].includes(new URL(base).hostname));

const slugs=['leads','customers','quotations','follow-ups','measurements'],checks=[],errors=[];
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,options);
const auth=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);
let user,browser,token,page;const baseline=new Map();
async function check(name,fn){if(process.env.SF_SALES_GROUP&&!new RegExp(process.env.SF_SALES_GROUP).test(name))return;console.log('INFO: '+name);await fn();checks.push(name);console.log('PASS: '+name);}
async function api(slug,params={}){for(let attempt=0;;attempt++){try{const response=await fetch(base+'/api/v1/admin/'+slug+'?'+new URLSearchParams(params),{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(60000)});const body=await response.json();assert.ok(response.ok,slug+': '+JSON.stringify(body.error));return body;}catch(error){if(attempt>=2||!['TimeoutError','AbortError','TypeError'].includes(error.name))throw error;console.log('INFO: Retrying read-only '+slug+' request after network timeout');}}}
async function navigate(url){for(let attempt=0;;attempt++){try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});return;}catch(error){if(attempt>=1||!/Timeout|ERR_ABORTED/i.test(error.message))throw error;console.log('INFO: Retrying interrupted page navigation');}}}
async function preserved(){const db=databaseClient();try{await db.connect();for(const [table,id] of [['leads',repair.leadId],['customers',repair.oldCustomerId,repair.oldCustomerHash],['quotations',repair.oldQuoteId,repair.oldQuoteHash]]){const row=(await db.query('select md5(row_to_json(r)::text) hash from public.'+table+' r where id=$1',[id])).rows[0];if(!baseline.has(table))baseline.set(table,row.hash);else assert.equal(row.hash,baseline.get(table),table+' changed during browser acceptance');}}finally{await db.end();}}
try{
 await preserved();
 const email='sf-publication-owner-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomBytes(32).toString('base64url');
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);user={id:created.data.user.id,email,password,auth};
 const db=databaseClient();try{await db.connect();await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner')",[user.id]);}finally{await db.end();}
 const signed=await auth.auth.signInWithPassword({email,password});assert.equal(signed.error,null);token=signed.data.session.access_token;
 browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});context.setDefaultTimeout(45000);await context.addCookies([{name:'sf_locale',value:'en',url:base}]);page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('console',message=>{if(message.type()==='error'&&/hydration|hydrated|didn't match/i.test(message.text()))errors.push(message.text());});
 await navigate(base+'/login');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/admin',{timeout:90000,waitUntil:'domcontentloaded'});await expect(page.locator('main#main-content')).toBeVisible();
 if(new URL(base).hostname==='smartfabrication.vercel.app'){console.log('INFO: Waiting for deployed Sales search UI');await expect(async()=>{await navigate(base+'/admin/workspaces/sales');await expect(page.getByRole('textbox',{name:'Search Sales and Customers',exact:true})).toBeVisible({timeout:5000});}).toPass({timeout:180000,intervals:[10000]});}
 const example=(await api('leads',{q:repair.leadId})).data.find(row=>row.id===repair.leadId);assert.ok(example);assert.equal(example.customer_id,repair.newCustomerId);
 await check('Backend search matches the repaired example by IDs, contacts and phone formats across five collections',async()=>{
  for(const term of [repair.leadId,repair.leadId.slice(0,12),repair.newCustomerId,repair.productId,example.name,example.name.slice(0,6),example.phone,example.phone.replace(/\D/g,''),example.email]){
   console.log('INFO: Search matrix next identifier; five collections');await Promise.all(slugs.map(async slug=>{const rows=(await api(slug,{q:term,limit:'100'})).data;if(slug==='leads')assert.ok(rows.some(row=>row.id===repair.leadId));if(slug==='customers')assert.ok(rows.some(row=>row.id===repair.newCustomerId));if(['quotations','follow-ups','measurements'].includes(slug))assert.ok(!rows.some(row=>row.id===repair.oldQuoteId));}));
  }
  for(const slug of ['quotations','follow-ups','measurements'])assert.deepEqual((await api(slug,{q:repair.leadId})).data,[]);
  assert.ok((await api('quotations',{q:repair.oldCustomerId})).data.some(row=>row.id===repair.oldQuoteId));
 });
 await check('Search intersects filters, context and keyset pagination without repeating rows',async()=>{
  assert.ok((await api('leads',{q:repair.leadId,status:example.status})).data.some(row=>row.id===repair.leadId));assert.deepEqual((await api('leads',{q:repair.leadId,status:'NEW'})).data,[]);
  for(const slug of ['leads','quotations','follow-ups','measurements']){const rows=(await api(slug,{q:repair.leadId,context:'customers',context_id:repair.oldCustomerId})).data;assert.deepEqual(rows,[]);}
  const seen=new Set();let cursor;for(let n=0;n<3;n++){const body=await api('customers',{q:'a',limit:'1',...(cursor?{cursor}:{})});for(const row of body.data){assert.ok(!seen.has(row.id));seen.add(row.id);}cursor=body.meta?.nextCursor;if(!cursor)break;}assert.ok(seen.size>0);
 });
 async function open(slug,record){await navigate(base+'/admin/'+slug+(record?'?record='+record:''));await expect(page.locator('main#main-content')).toBeVisible();if(record)await expect(page.getByRole('tab',{name:'Details',exact:true})).toBeVisible();else{await expect(page.locator('.admin-data-table')).toBeVisible();await expect(page.locator('.admin-data-table > p[role=status]')).toHaveCount(0);await expect(page.getByRole('textbox',{name:'Search '+({leads:'Leads',customers:'Customers',quotations:'Quotations','follow-ups':'Follow-ups',measurements:'Measurements'}[slug]),exact:true})).toBeVisible();}}
 await check('All collection search boxes submit, show no matches and clear query/status without stale results',async()=>{
  for(const slug of slugs){console.log('INFO: Browser collection '+slug);await open(slug);const search=page.getByRole('textbox',{name:/^Search /}).filter({visible:true}).last();await search.fill('no-crm-match-'+crypto.randomUUID());await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page.getByText('No matching records. Try another ID, contact or name, or clear the filters.',{exact:true})).toBeVisible();await page.getByRole('button',{name:slug==='leads'?'Clear all':'Clear filters',exact:true}).click();await expect(search).toHaveValue('');await expect(page).toHaveURL(base+'/admin/'+slug);}
  await navigate(base+'/admin/leads?'+new URLSearchParams({q:repair.leadId,status:example.status}));await expect(page.getByRole('button',{name:'Remove '+example.status.replaceAll('_',' '),exact:true})).toBeVisible();await page.getByRole('button',{name:/View details of/}).click();await expect(page.getByRole('tab',{name:'Details',exact:true})).toBeVisible();await page.getByRole('button',{name:'Back to list',exact:true}).first().click();await expect(page.getByRole('textbox',{name:'Search Leads',exact:true})).toHaveValue(repair.leadId);await expect(page.getByRole('combobox',{name:'Filter by status'})).toHaveValue(example.status);
 });
 await check('Lead tabs request the exact lead; related creation defaults remain locked to the correct IDs',async()=>{
  await open('leads',repair.leadId);await page.getByRole('tab',{name:'Notes',exact:true}).click();await expect(page.getByLabel('Internal note',{exact:true})).toBeVisible();
  for(const [slug,label] of [['follow-ups','Follow-ups'],['measurements','Measurements'],['quotations','Quotations']]){
   const response=page.waitForResponse(r=>{const u=new URL(r.url());return u.pathname==='/api/v1/admin/'+slug&&u.searchParams.get('context_id')===repair.leadId;});await page.getByRole('tab',{name:label,exact:true}).click();assert.equal((await response).status(),200);await expect(page.getByText('No '+label.toLowerCase()+' yet',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Add a record',exact:true}).click();await expect(page.locator('input[type=hidden][name=lead_id]')).toHaveValue(repair.leadId);if(slug==='quotations')await expect(page.locator('input[type=hidden][name=customer_id]')).toHaveValue(repair.newCustomerId);let submitted;const pattern='**/api/v1/admin/'+slug;await page.route(pattern,async route=>{if(route.request().method()!=='POST'){await route.continue();return;}submitted=route.request().postDataJSON();await route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({error:{code:'VALIDATION_ERROR',message:'Acceptance intercepted: no business record saved'},requestId:crypto.randomUUID()})});});
   if(slug==='follow-ups')await page.locator('dialog [name=due_at]').fill('2026-11-06T10:00');
   if(slug==='measurements'){await page.locator('dialog [name=width_mm]').fill('1000');await page.locator('dialog [name=height_mm]').fill('2000');}
   if(slug==='quotations'){await page.locator('dialog [name=name]').fill('Acceptance intercepted');await page.locator('dialog [name=expires_at]').fill('2026-11-07T10:00');}
   await page.getByRole('button',{name:'Save record',exact:true}).click();await expect(page.getByRole('dialog').getByText('Acceptance intercepted: no business record saved',{exact:true})).toBeVisible();assert.equal(submitted.lead_id,repair.leadId);if(slug==='quotations')assert.equal(submitted.customer_id,repair.newCustomerId);await page.unroute(pattern);await page.getByRole('button',{name:'Cancel',exact:true}).click();
  }
 });
 await check('Customer tabs and related record links use the repaired customer, preserving the old customer quotation',async()=>{
  await open('leads',repair.leadId);await page.locator('main a[href*="record='+repair.newCustomerId+'"]').click();await expect(page).toHaveURL(new RegExp('/admin/customers\\?record='+repair.newCustomerId));await expect(page.getByRole('tab',{name:'Enquiries',exact:true})).toBeVisible();
  for(const label of ['Enquiries','Quotations','Follow-ups','Measurements']){await page.getByRole('tab',{name:label,exact:true}).click();await expect(page.locator('[role=tabpanel]')).toBeVisible();}
  await open('customers',repair.oldCustomerId);await page.getByRole('tab',{name:'Quotations',exact:true}).click();await expect(page.getByRole('table',{name:'Quotations records',exact:true})).toContainText('Inventory Test Quote');
 });
 await check('Overview search opens the correct linked record and clears results',async()=>{
  await navigate(base+'/admin/workspaces/sales');await page.waitForLoadState('load');await page.waitForTimeout(500);const search=page.getByRole('textbox',{name:'Search Sales and Customers',exact:true});await search.fill(repair.leadId);await page.getByRole('button',{name:'Search workspace',exact:true}).click();const preview=page.getByRole('region',{name:'Search Sales and Customers'});await expect(preview.getByText('Searching permitted records...',{exact:true})).toHaveCount(0);await expect(preview.locator('a[href*="record='+repair.newCustomerId+'"]').first()).toBeVisible();await preview.locator('a[href*="record='+repair.newCustomerId+'"]').first().click();await expect(page).toHaveURL(new RegExp('/admin/customers\\?record='+repair.newCustomerId));await navigate(base+'/admin/workspaces/sales?q='+repair.leadId);await page.getByRole('button',{name:'Clear',exact:true}).click();await expect(search).toHaveValue('');await expect(page.getByRole('region',{name:'Search Sales and Customers'}).locator('a')).toHaveCount(0);
 });
 await check('Six Sales screens and searched results fit mobile, tablet, laptop and desktop widths',async()=>{
  for(const path of ['/admin/workspaces/sales',...slugs.map(slug=>'/admin/'+slug)]){await navigate(base+path+'?q='+repair.leadId);await expect(page.locator('main#main-content')).toBeVisible();for(const width of [320,390,768,1024,1440,1920]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(120);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path+' overflow at '+width);}}
  await page.setViewportSize({width:390,height:844});await navigate(base+'/admin/workspaces/sales?q='+repair.leadId);await expect(page.getByRole('region',{name:'Search Sales and Customers'}).locator('a').first()).toBeVisible();const searchBox=await page.getByRole('textbox',{name:'Search Sales and Customers',exact:true}).boundingBox();assert.ok(searchBox.width>300,'Mobile workspace search gets a full input row');await page.screenshot({path:'test-results/sales-search-mobile.png',fullPage:true});
 });
 await preserved();assert.deepEqual(errors,[]);await fs.writeFile('test-results/sales-search-browser-latest.json',JSON.stringify({base,checks,errors,completedAt:new Date().toISOString()},null,2));
}catch(error){console.error(error.stack);if(page){console.error('Browser URL: '+page.url());console.error('Visible alerts: '+await page.getByRole('alert').allTextContents().catch(()=>[]));await page.screenshot({path:'test-results/sales-search-failure.png'}).catch(()=>{});}process.exitCode=1;}finally{await browser?.close();if(user)try{for(let attempt=0;;attempt++){try{await retirePublicationFixture({...user,admin});break;}catch(error){if(attempt>=2)throw error;}}console.log('Generated test identity retired');}catch(error){console.error('Fixture retirement failed: '+error.message);process.exitCode=1;}}
