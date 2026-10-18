import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {chromium,devices,expect} from '@playwright/test';
import {databaseClient} from './db-client.mjs';
const base=process.env.TEST_BASE_URL??'http://localhost:3000';let db=databaseClient();db.on('error',error=>console.error('Database connection interrupted: '+(error.code??'unknown')));
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const stamp=crypto.randomUUID(),email=`sf-reliability-${stamp}@example.invalid`,password=crypto.randomBytes(24).toString('base64url'),materialCode=`sf-reliability-${stamp}`;
let fixture,material,browser,checks=0;
const deadline=setTimeout(()=>{console.error('Reliability test exceeded its three-minute browser deadline');void browser?.close().catch(()=>{});},180000);deadline.unref();
async function check(name,action){console.log(`INFO: starting ${name}`);await action();checks++;console.log(`PASS: ${name}`);}
try{
 await db.connect();await db.query('set statement_timeout=20000');console.log('INFO: database connected');const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:'Reliability acceptance fixture'}});assert.equal(created.error,null,'Fixture auth creation failed');fixture=created.data.user.id;console.log('INFO: isolated user created');
 await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner')",[fixture]);
 const inserted=await db.query("insert into public.materials(name,code,type,size,thickness_mm,unit,weight_kg_per_unit) values('Reliability acceptance material',$1,'square_pipe','25mm',2,'kg',1) returning id",[materialCode]);material=inserted.rows[0].id;
 console.log('INFO: material fixture ready');browser=await chromium.launch({channel:process.env.TEST_BROWSER_CHANNEL??'chrome',headless:true});
 for(const viewport of ['desktop','mobile']){
  const context=await browser.newContext(viewport==='mobile'?{...devices['iPhone 13'],baseURL:base}:{viewport:{width:1440,height:1000},baseURL:base});
  try{
   const page=await context.newPage();page.on('response',response=>{if(new URL(response.url()).pathname.endsWith('/auth/v1/token'))console.log('INFO: fixture auth response '+response.status());});page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(30000);await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();try{await page.waitForURL('**/account',{timeout:90000});}catch{console.error('Login status: '+(await page.getByRole('status').allTextContents()).join(' '));throw new Error('Fixture login did not reach account');}
   await check(`${viewport}: real staff API continues owned permitted pages`,async()=>{
    let cursor=null;const ids=[];let pages=0;do{const response=await context.request.get('/api/v1/admin/users?limit=1'+(cursor?'&cursor='+encodeURIComponent(cursor):''));assert.equal(response.status(),200);const body=await response.json();assert.equal(body.data.length,1);ids.push(body.data[0].id);cursor=body.meta.nextCursor;assert.ok(++pages<100,'Unexpected fixture dataset size');}while(cursor&&pages<5);assert.equal(new Set(ids).size,ids.length);assert.ok(ids.includes(fixture));assert.equal((await context.request.get('/api/v1/admin/users?cursor=bad!')).status(),422);
   });
   await check(`${viewport}: failed role request releases controls without changing access`,async()=>{
    await page.goto('/admin/users');const own=page.locator('article').filter({hasText:'Reliability acceptance fixture'});console.log(JSON.stringify({screen:await page.locator('h1').allTextContents(),articleCount:await page.locator('article').count(),fixtureProfile:(await db.query('select display_name,disabled from public.profiles where id=$1',[fixture])).rows,profileCount:(await db.query('select count(*)::int as count from public.profiles')).rows}));await expect(own).toHaveCount(1,{timeout:30000});
    await page.route('**/api/v1/admin/users/*/roles',route=>route.abort('failed'));const toggle=own.getByRole('checkbox',{name:'sales',exact:true});await toggle.click();await expect(own.getByRole('alert')).toContainText(/fetch|network|retry/i);await expect(toggle).toBeEnabled();await expect(toggle).not.toBeChecked();await page.unrouteAll({behavior:'wait'});
    const rows=await db.query('select role_id from public.user_roles where user_id=$1 order by role_id',[fixture]);assert.deepEqual(rows.rows.map(row=>row.role_id),['customer','owner']);
   });
   await check(`${viewport}: malformed permission response releases matrix controls`,async()=>{
    await page.route('**/api/v1/admin/permissions',route=>route.fulfill({status:502,contentType:'text/html',body:'Temporary gateway failure'}));const matrix=page.locator('section').filter({has:page.getByRole('heading',{name:'Role permission matrix',exact:true})});const toggle=matrix.getByRole('checkbox').first();await toggle.click();await expect(matrix.getByRole('alert')).toBeVisible();await expect(toggle).toBeEnabled();await page.unrouteAll({behavior:'wait'});
   });
   await check(`${viewport}: inventory retry preserves entered values and exact request key/body`,async()=>{
    await page.goto('/admin/inventory');const form=page.locator('section').filter({has:page.getByRole('heading',{name:'Post a stock movement',exact:true})}).locator('form');
    await form.getByLabel('Material',{exact:true}).selectOption(material);await form.getByLabel('Movement type',{exact:true}).selectOption('adjustment');await form.getByLabel('Signed quantity',{exact:true}).fill('2');await form.getByLabel('Unit cost (INR)',{exact:true}).fill('1.01');await form.getByLabel('Reason / notes',{exact:true}).fill('Synthetic retry acceptance');
    const calls=[];await page.route('**/api/v1/inventory/adjustments',route=>{calls.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()});return calls.length===1?route.abort('failed'):route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({error:{code:'VALIDATION_ERROR',message:'Synthetic validation rejection'}})});});
    await form.getByRole('button',{name:'Post movement',exact:true}).click();await expect(form.getByRole('button',{name:'Retry same movement',exact:true})).toBeEnabled();await expect(form.getByLabel('Signed quantity',{exact:true})).toHaveValue('2');await expect(form.getByLabel('Signed quantity',{exact:true})).toBeDisabled();
    await page.reload();await expect(form.getByRole('button',{name:'Retry same movement',exact:true})).toBeEnabled();await expect(form.getByLabel('Signed quantity',{exact:true})).toHaveValue('2');await form.getByRole('button',{name:'Retry same movement',exact:true}).click();await expect(form.getByRole('alert')).toHaveText('Synthetic validation rejection');await expect(form.getByLabel('Signed quantity',{exact:true})).toBeEnabled();assert.equal(calls.length,2);assert.deepEqual(calls[0],calls[1]);assert.equal(JSON.parse(calls[0].body).unit_cost_minor,101);
    await form.getByLabel('Signed quantity',{exact:true}).fill('3');await form.getByRole('button',{name:'Post movement',exact:true}).click();await expect.poll(()=>calls.length).toBe(3);assert.notEqual(calls[2].key,calls[0].key);assert.equal(JSON.parse(calls[2].body).quantity,3);await page.unrouteAll({behavior:'wait'});
    assert.equal((await db.query('select id from public.stock_movements where material_id=$1',[material])).rowCount,0);
   });
   await check(`${viewport}: checked sign-out removes cookie access`,async()=>{await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL(base+'/',{timeout:30000});assert.equal((await context.request.get('/api/v1/me')).status(),401);});
  }finally{await context.close();}
 }
 console.log(`PASS: ${checks} desktop/mobile reliability checks. Login/read paths real; all role/permission/stock write failures intercepted. No ledger postings or actual permission changes.`);
}catch(error){console.error(`Reliability acceptance failed: ${error.message}`);process.exitCode=1;}
finally{
 clearTimeout(deadline);await browser?.close();
 try{await db.end().catch(()=>{});db=databaseClient();db.on('error',()=>{});await db.connect();if(material){assert.equal((await db.query('select id from public.materials where id=$1 and code=$2',[material,materialCode])).rowCount,1);await db.query('delete from public.materials where id=$1 and code=$2',[material,materialCode]);}if(fixture){assert.equal((await db.query('select id from auth.users where id=$1 and email=$2',[fixture,email])).rowCount,1);await db.query('begin');await db.query('delete from public.notifications where user_id=$1',[fixture]);await db.query('delete from public.user_roles where user_id=$1',[fixture]);await db.query('delete from public.profiles where id=$1',[fixture]);await db.query('commit');assert.equal((await admin.auth.admin.deleteUser(fixture)).error,null);}console.log('Generated account/material fixtures removed; immutable audit retained.');}catch(error){await db.query('rollback').catch(()=>{});console.error(`Reliability cleanup failed: ${error.message}`);process.exitCode=1;}
 await db.end().catch(()=>{});
}









