import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { chromium,expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { databaseClient } from './db-client.mjs';
import { retirePublicationFixture } from './retire-publication-fixture.mjs';
const base=process.env.TEST_BASE_URL??'http://localhost:3000';
assert.ok(['localhost','127.0.0.1','smartfabrication.vercel.app'].includes(new URL(base).hostname),'Known test target required');
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,options);
const auth=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);
const db=databaseClient(),run=crypto.randomUUID(),email=`sf-publication-owner-${run}@example.invalid`,password=crypto.randomBytes(32).toString('base64url');
let user,browser,token;const checks=[];
db.on('error',error=>{console.error('Dashboard fixture connection ended: '+(error.code??'CONNECTION_ERROR'));process.exitCode=1;});
async function check(label,action){await action();checks.push(label);console.log('PASS: '+label);}
async function api(query=''){const response=await fetch(base+'/api/v1/dashboard'+query,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(60000)});assert.equal(response.status,200);return(await response.json()).data;}
try{
 await db.connect();const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);user={id:created.data.user.id,email,password,auth};await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner') on conflict do nothing",[user.id]);
 const login=await auth.auth.signInWithPassword({email,password});assert.equal(login.error,null);token=login.data.session.access_token;
 browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
 await page.goto(base+'/login');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/account');
 await check('Real owner browser opens daily tasks and business data scope by default',async()=>{
  await page.goto(base+'/admin');await expect(page.getByRole('heading',{name:'Aaj ka kaam',exact:true})).toBeVisible();await expect(page.getByLabel('Dashboard data scope')).toHaveValue('business');await expect(page.getByRole('region',{name:'My task list',exact:true})).toBeVisible();const data=await api();assert.equal(data.scope,'business');assert.ok(data.tasks.every(task=>!/^TEST ONLY|^(Finance Quote|Delivery Quotation|Reminder Lead) [0-9a-f]{8}$/i.test(task.title)));
 });
 await check('Card drilldown uses the same task predicate and paginated count as its card',async()=>{
  await page.getByRole('link').filter({has:page.getByRole('heading',{name:'Follow-ups due',exact:true})}).click();await page.waitForURL(/task=followup/);const data=await api('?task=followup');assert.equal(data.task_total,data.metrics.followups_due);await expect(page.getByText(`${data.task_total} matching tasks`,{exact:false})).toBeVisible();
 });
 await check('Business overview separates order stages from cash and handles responsive layouts',async()=>{
  await page.getByRole('link',{name:'Business overview',exact:true}).click();await expect(page.getByRole('heading',{name:'Business overview',exact:true})).toBeVisible();await expect(page.getByRole('region',{name:'Order progress board',exact:true})).toBeVisible();const data=await api();assert.equal(data.board.length,5);
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.locator('main').evaluate(node=>node.scrollWidth<=node.clientWidth),true);}
  await page.screenshot({path:'test-results/dashboard-business.png',fullPage:true});
 });
 await check('Demo data remains available in an explicit labeled view',async()=>{
  await page.getByLabel('Dashboard data scope').selectOption('demo');await page.getByRole('button',{name:'Apply view',exact:true}).click();await page.waitForURL(/scope=demo/);await expect(page.getByText('Showing recognized synthetic/test records only.',{exact:false})).toBeVisible();assert.equal((await api('?scope=demo')).scope,'demo');
 });
 await check('Exact record links open authorized details; quick new enquiry opens its form',async()=>{
  const data=await api('?scope=all');const link=data.tasks[0]?.href??data.activity[0]?.href;
  if(link){await page.goto(base+link);await expect(page.getByRole('dialog')).toBeVisible();const denied=await context.request.get(base+'/api/v1/admin/leads/'+crypto.randomUUID());assert.equal(denied.status(),404);}
  await page.goto(base+'/admin/leads?new=1');await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('button',{name:'Save record',exact:true})).toBeVisible();
 });
 await check('Anonymous dashboard requests remain denied',async()=>assert.equal((await fetch(base+'/api/v1/dashboard')).status,401));
}catch(error){console.error('Dashboard browser acceptance failed: '+error.message);process.exitCode=1;}
finally{
 await browser?.close();if(user)try{await retirePublicationFixture({...user,admin});}catch(error){console.error('Dashboard login retirement failed: '+error.message);process.exitCode=1;}await db.end().catch(()=>{});await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/dashboard-browser-latest.json',JSON.stringify({finishedAt:new Date().toISOString(),target:base,passed:!process.exitCode,checks,scope:'Real owner Auth/browser/read APIs, two dashboard tabs/scopes, matching drilldowns, responsive board and exact record/new-form links. No business record written. Generated owner retired.'},null,2));
}
