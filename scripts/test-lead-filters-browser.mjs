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

const checks=[],errors=[];
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
 if(new URL(base).hostname==='smartfabrication.vercel.app'){console.log('INFO: Waiting for deployed Sales search UI');await expect(async()=>{await navigate(base+'/admin/leads');await expect(page.getByRole('button',{name:'Apply dates',exact:true})).toBeVisible({timeout:5000});}).toPass({timeout:180000,intervals:[10000]});}
 const example=(await api('leads',{q:repair.leadId})).data.find(row=>row.id===repair.leadId);assert.ok(example);assert.equal(example.customer_id,repair.newCustomerId);

 async function ready(){await expect(page.locator('.admin-data-table')).toBeVisible();await expect(page.locator('.admin-data-table > p[role=status]')).toHaveCount(0);}
 async function leads(query=''){await navigate(base+'/admin/leads'+(query?'?'+query:''));await ready();}
 const dialog=()=>page.getByRole('dialog',{name:'Filter leads',exact:true});
 async function filters(){await page.getByRole('button',{name:/^Filters/}).click();await expect(dialog()).toBeVisible();}
 await check('API accepts every preset and combined filters; custom range, status, context and cursor remain exact',async()=>{
  for(const date of ['all','today','yesterday','last7','month']){const data=await api('leads',{date,limit:'100'});assert.ok(Array.isArray(data.data));}
  for(const extra of [{assigned:'me'},{assigned:'unassigned'},{source:'whatsapp'},{follow_up:'today'},{follow_up:'overdue'}])assert.ok(Array.isArray((await api('leads',{...extra,limit:'100'})).data));
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(example.created_at));
  const found=await api('leads',{date:'custom',from:date,until:date,q:repair.leadId,status:example.status});assert.equal(found.data.length,1);assert.equal(found.data[0].id,repair.leadId);
  assert.deepEqual((await api('leads',{date:'custom',from:'2000-01-01',until:'2000-01-02',q:repair.leadId})).data,[]);
  assert.deepEqual((await api('leads',{date:'all',q:repair.leadId,context:'customers',context_id:repair.oldCustomerId})).data,[]);
  let cursor;const seen=new Set();for(let i=0;i<3;i++){const result=await api('leads',{date:'all',q:'a',limit:'1',...(cursor?{cursor}:{})});for(const row of result.data){assert.ok(!seen.has(row.id));seen.add(row.id);}cursor=result.meta?.nextCursor;if(!cursor)break;}
  const invalid=await fetch(base+'/api/v1/admin/leads?date=custom&from=2026-10-30&until=2026-10-01',{headers:{Authorization:'Bearer '+token}});assert.equal(invalid.status,422);
  const exported=await fetch(base+'/api/v1/reports/leads/export?'+new URLSearchParams({date:'custom',from:date,until:date,q:repair.leadId,status:example.status}),{headers:{Authorization:'Bearer '+token}});assert.equal(exported.status,200);assert.ok((await exported.text()).includes(example.name));
 });
 await check('Date presets, advanced filters, chips, clear, browser reload and list return preserve URL state',async()=>{
  await leads();await page.getByRole('button',{name:'Today',exact:true}).click();await expect(page).toHaveURL(/date=today/);await ready();await expect(page.getByRole('button',{name:'Today',exact:true})).toHaveAttribute('aria-pressed','true');
  await filters();await dialog().getByLabel('Lead status',{exact:true}).selectOption('NEW');await dialog().getByLabel('Assigned staff',{exact:true}).selectOption('unassigned');await dialog().getByLabel('Lead source',{exact:true}).selectOption('whatsapp');await dialog().getByLabel('Pending follow-up',{exact:true}).selectOption('today');await dialog().getByRole('button',{name:'Apply filters',exact:true}).click();await expect(dialog()).toHaveCount(0);await ready();for(const [key,value] of Object.entries({date:'today',status:'NEW',assigned:'unassigned',source:'whatsapp',follow_up:'today'}))assert.equal(new URL(page.url()).searchParams.get(key),value);
  await page.reload({waitUntil:'domcontentloaded'});await ready();await expect(page.getByRole('button',{name:'Remove Unassigned',exact:true})).toBeVisible();await page.getByRole('button',{name:'Remove Unassigned',exact:true}).click();await ready();assert.equal(new URL(page.url()).searchParams.has('assigned'),false);
  await page.getByRole('button',{name:'Clear all',exact:true}).click();await ready();assert.equal(new URL(page.url()).search,'');
  await leads('date=all&q='+repair.leadId);await page.getByRole('button',{name:/View details of/}).click();await expect(page.getByRole('tab',{name:'Details',exact:true})).toBeVisible();await page.goBack({waitUntil:'domcontentloaded'});await ready();await expect(page.getByRole('textbox',{name:'Search Leads',exact:true})).toHaveValue(repair.leadId);await page.getByRole('button',{name:/View details of/}).click();await expect(page.getByRole('tab',{name:'Details',exact:true})).toBeVisible();await page.getByRole('button',{name:'Back to list',exact:true}).first().click();await ready();assert.equal(new URL(page.url()).searchParams.get('q'),repair.leadId);assert.equal(new URL(page.url()).searchParams.get('date')||'all','all');
 });
 await check('Inline dates validate, combine with name/mobile search and reset with date chips',async()=>{
  await leads();await expect(page.getByRole('button',{name:'Custom dates',exact:true})).toHaveCount(0);const range=page.getByRole('form',{name:'Lead date range',exact:true});const from=range.getByLabel('From date (Kab se)',{exact:true}),until=range.getByLabel('To date (Kab tak)',{exact:true});
  await from.fill('2026-10-30');await until.fill('2026-10-01');await range.getByRole('button',{name:'Apply dates',exact:true}).click();await expect(range.getByRole('alert').first()).toBeVisible();assert.equal(new URL(page.url()).search,'');
  await from.fill('2000-01-01');await until.fill('2000-01-02');await range.getByRole('button',{name:'Apply dates',exact:true}).click();await ready();await expect(page.getByRole('heading',{name:'No leads match your filters',exact:true})).toBeVisible();await page.getByRole('button',{name:/Remove 2000-01-01/}).click();await ready();await expect(from).toHaveValue('');await expect(until).toHaveValue('');
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(example.created_at));await from.fill(day);await until.fill(day);await range.getByRole('button',{name:'Apply dates',exact:true}).click();await ready();
  for(const term of [example.name,example.phone]){await page.getByRole('textbox',{name:'Search Leads',exact:true}).fill(term);const pending=page.waitForResponse(r=>{const url=new URL(r.url());return url.pathname==='/api/v1/admin/leads'&&url.searchParams.get('q')===term&&url.searchParams.get('from')===day;});await page.getByRole('button',{name:'Search',exact:true}).click();const response=await pending;assert.equal(response.status(),200);assert.ok((await response.json()).data.some(row=>row.id===repair.leadId));await ready();}
  await page.reload({waitUntil:'domcontentloaded'});await ready();await expect(from).toHaveValue(day);await expect(until).toHaveValue(day);await expect(page.getByRole('textbox',{name:'Search Leads',exact:true})).toHaveValue(example.phone);
 });
 await check('Changing filters resets cursor and page while quick search keeps current filters',async()=>{
  let latest;const pattern='**/api/v1/admin/leads?**';await page.route(pattern,async route=>{const params=new URL(route.request().url()).searchParams;latest=params;await route.fulfill({json:{data:[{id:repair.leadId,name:'Pagination acceptance',phone:'+919410000001',city:'Test',source:'direct',status:'NEW',created_at:new Date().toISOString()}],meta:{nextCursor:params.has('cursor')?null:'acceptance-page-2'}}});});
  await leads();const pager=page.getByRole('navigation',{name:'Leads table pagination',exact:true});await pager.getByRole('button',{name:'Next',exact:true}).click();await expect(pager.getByText('Page 2',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Today',exact:true}).click();await ready();await expect(pager.getByText('Page 1',{exact:true})).toBeVisible();assert.equal(latest.has('cursor'),false);assert.equal(latest.get('date'),'today');await page.getByRole('textbox',{name:'Search Leads',exact:true}).fill('acceptance');await page.getByRole('button',{name:'Search',exact:true}).click();await ready();assert.equal(new URL(page.url()).searchParams.get('date'),'today');await page.unroute(pattern);
 });
 await check('Filter drawer is keyboard accessible and fits six screen widths without page overflow',async()=>{
  for(const width of [320,390,768,1024,1440,1920]){await page.setViewportSize({width,height:900});await leads('date=today');await expect(page.getByLabel('From date (Kab se)',{exact:true})).toBeVisible();await expect(page.getByLabel('To date (Kab tak)',{exact:true})).toBeVisible();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await filters();const box=await dialog().boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);await page.keyboard.press('Escape');await expect(dialog()).toHaveCount(0);await expect(page.getByRole('button',{name:/^Filters/})).toBeFocused();}
  await page.setViewportSize({width:390,height:844});await filters();await page.screenshot({path:'test-results/lead-filters-mobile.png',fullPage:true});await page.keyboard.press('Escape');await page.screenshot({path:'test-results/lead-range-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/lead-range-desktop.png',fullPage:true});
 });
 await preserved();assert.deepEqual(errors,[]);await fs.writeFile('test-results/lead-filters-browser-latest.json',JSON.stringify({base,checks,errors,completedAt:new Date().toISOString()},null,2));
}catch(error){console.error(error.stack);if(page){console.error('Browser URL: '+page.url());console.error('Visible alerts: '+await page.getByRole('alert').allTextContents().catch(()=>[]));await page.screenshot({path:'test-results/lead-filters-failure.png'}).catch(()=>{});}process.exitCode=1;}finally{await browser?.close();if(user)try{for(let attempt=0;;attempt++){try{await retirePublicationFixture({...user,admin});break;}catch(error){if(attempt>=2)throw error;}}console.log('Generated test identity retired');}catch(error){console.error('Fixture retirement failed: '+error.message);process.exitCode=1;}}
