import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { chromium,devices,expect } from '@playwright/test';
import { databaseClient } from './db-client.mjs';
const base=process.env.TEST_BASE_URL??'http://localhost:3000';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const db=databaseClient(),fixtures=[];let browser,checks=0;
async function check(name,fn){await fn();checks++;console.log(`PASS: ${name}`);}
try{
 await db.connect();
 for(let i=0;i<2;i++){
  const email=`sf-notification-${crypto.randomUUID()}@example.invalid`,password=crypto.randomBytes(24).toString('base64url');
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(error,null,'Fixture creation failed');
  const fixture={id:data.user.id,email,password};fixtures.push(fixture);
  await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner')",[fixture.id]);
 }
 const own=[];for(let i=0;i<26;i++){const id=crypto.randomUUID();own.push(id);await db.query("insert into public.notifications(id,user_id,name,body,created_at) values($1,$2,$3,'Synthetic notification acceptance','2026-10-15 10:00:00.123456+00')",[id,fixtures[0].id,`Acceptance notification ${i}`]);}
 const foreign=crypto.randomUUID();await db.query("insert into public.notifications(id,user_id,name,body) values($1,$2,'Private other owner notification','Must remain private')",[foreign,fixtures[1].id]);
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const viewport of ['desktop','mobile']){
  const context=await browser.newContext(viewport==='mobile'?{...devices['iPhone 13'],baseURL:base}:{viewport:{width:1440,height:1000},baseURL:base});
  try{
   const page=await context.newPage();await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(fixtures[0].email);await page.getByLabel('Password',{exact:true}).fill(fixtures[0].password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/account');
   await check(`${viewport}: real owner pagination includes all tied-timestamp rows once`,async()=>{
    const first=await context.request.get('/api/v1/notifications');assert.equal(first.status(),200);const body=await first.json();assert.equal(body.data.length,25);assert.ok(body.meta.nextCursor);
    const second=await context.request.get('/api/v1/notifications?cursor='+encodeURIComponent(body.meta.nextCursor));assert.equal(second.status(),200);const tail=await second.json();assert.equal(tail.meta.nextCursor,null);assert.deepEqual(new Set([...body.data,...tail.data].map(row=>row.id)),new Set(own));
    assert.equal((await context.request.get('/api/v1/notifications?cursor=bad!')).status(),422);
   });
   await check(`${viewport}: browser older/first links and mobile width`,async()=>{
    await page.goto('/admin/notifications');await expect(page.locator('article')).toHaveCount(25);await expect(page.getByText('Private other owner notification',{exact:true})).toHaveCount(0);
    await page.getByRole('link',{name:'Older notifications',exact:true}).click();await expect(page.locator('article')).toHaveCount(1);await page.getByRole('link',{name:'First page',exact:true}).click();await expect(page.locator('article')).toHaveCount(25);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true);
   });
   await check(`${viewport}: real browser mark-read persists and concurrent retries preserve timestamp`,async()=>{
    const article=page.locator('article').filter({has:page.getByRole('button',{name:'Mark read',exact:true})}).first();const name=await article.locator('h2').innerText();
    const posted=page.waitForResponse(response=>response.url().includes('/api/v1/notifications/')&&response.url().endsWith('/read')&&response.request().method()==='POST');await article.getByRole('button',{name:'Mark read',exact:true}).click();assert.equal((await posted).status(),200);await expect(page.locator('article').filter({hasText:name}).getByRole('button',{name:'Mark read',exact:true})).toHaveCount(0,{timeout:30000});
    const before=await db.query('select id,read_at::text from public.notifications where user_id=$1 and name=$2',[fixtures[0].id,name]);assert.ok(before.rows[0].read_at);
    const responses=await Promise.all(Array.from({length:4},()=>context.request.post(`/api/v1/notifications/${before.rows[0].id}/read`,{headers:{Origin:base}})));assert.ok(responses.every(response=>response.status()===200));
    const after=await db.query('select read_at::text from public.notifications where id=$1',[before.rows[0].id]);assert.equal(after.rows[0].read_at,before.rows[0].read_at);
   });
   await check(`${viewport}: another owner cannot read or mutate foreign notifications`,async()=>{
    for(const id of [foreign,crypto.randomUUID()])assert.equal((await context.request.post(`/api/v1/notifications/${id}/read`,{headers:{Origin:base}})).status(),404);
    const row=await db.query('select read_at from public.notifications where id=$1',[foreign]);assert.equal(row.rows[0].read_at,null);
   });
   await check(`${viewport}: browser network failure releases mark-read for retry`,async()=>{
    await page.goto('/admin/notifications');await page.route('**/api/v1/notifications/*/read',route=>route.abort('failed'));
    const article=page.locator('article').filter({has:page.getByRole('button',{name:'Mark read',exact:true})}).first();await article.getByRole('button',{name:'Mark read',exact:true}).click();await expect(article.getByRole('alert')).toHaveText('Unable to mark read. Please retry.');await expect(article.getByRole('button',{name:'Mark read',exact:true})).toBeEnabled();await page.unrouteAll({behavior:'wait'});
   });
  }finally{await context.close();}
 }
 console.log(`PASS: ${checks} notification browser checks; real development database and authenticated requests, with only the network-failure probe simulated.`);
}catch(error){console.error(`Notification acceptance failed: ${error.message}`);process.exitCode=1;}
finally{
 await browser?.close();
 for(const fixture of fixtures){try{
  const match=await db.query('select id from auth.users where id=$1 and email=$2',[fixture.id,fixture.email]);assert.equal(match.rowCount,1,'Fixture identity mismatch');
  await db.query('begin');await db.query('delete from public.notifications where user_id=$1',[fixture.id]);await db.query('delete from public.user_roles where user_id=$1',[fixture.id]);await db.query('delete from public.profiles where id=$1',[fixture.id]);await db.query('commit');
  const {error}=await admin.auth.admin.deleteUser(fixture.id);assert.equal(error,null,'Fixture auth cleanup failed');
 }catch(error){await db.query('rollback').catch(()=>{});console.error(`Fixture cleanup failed for ${fixture.id}: ${error.message}`);process.exitCode=1;}}
 await db.end().catch(()=>{});
 console.log('Notification fixtures cleanup finished; immutable audit records retained.');
}

