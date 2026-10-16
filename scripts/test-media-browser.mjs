import {createElement} from 'react';
import {Document,Page,Text,renderToBuffer} from '@react-pdf/renderer';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { databaseClient } from './db-client.mjs';

const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,options);
const db=databaseClient(),base=process.env.TEST_BASE_URL??'http://localhost:3000';
let email=`sf-media-browser-${crypto.randomUUID()}@example.invalid`;
const password=crypto.randomBytes(24).toString('base64url');
cloudinary.config({cloud_name:process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET,secure:true});
let fixture,browser,checks=0;
async function check(name,action){await action();checks++;console.log(`PASS: ${name}`);}
try{
 await db.connect();
 if(process.argv[2]==='--cleanup-fixture'){
  const candidate=process.argv[3];assert.match(candidate??'',/^[0-9a-f-]{36}$/);
  const {rows}=await db.query('select email from auth.users where id=$1',[candidate]);assert.equal(rows.length,1);assert.match(rows[0].email,/^sf-media-browser-[0-9a-f-]{36}@example.invalid$/);email=rows[0].email;fixture=candidate;
 }else{
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null,'Fixture creation failed');fixture=created.data.user.id;
 await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner')",[fixture]);
 browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({baseURL:base}),page=await context.newPage();
 page.on('response',async response=>{if(response.url().startsWith('https://api.cloudinary.com/')&&response.status()>=400){const body=await response.json().catch(()=>({}));const message=String(body.error?.message??'Upload rejected');console.error(`Provider upload error ${response.status()}: ${/signature/i.test(message)?'Upload signature rejected':message.slice(0,180)}`);}});
 await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/account');
 await page.goto('/admin/media-assets');await page.getByRole('heading',{name:'Upload catalog media or evidence',exact:true}).waitFor();const uploader=page.locator('section').filter({has:page.getByRole('heading',{name:'Upload catalog media or evidence',exact:true})});
 await check('Browser sends a real signed private invoice upload to Cloudinary',async()=>{
  const png=await sharp({create:{width:8,height:8,channels:3,background:'#ea580c'}}).png().toBuffer();
  await page.getByLabel('Purpose',{exact:true}).selectOption('invoice');
  await page.locator('input[type=file]').setInputFiles({name:'invoice-fixture.png',mimeType:'image/png',buffer:png});
  await page.getByRole('button',{name:'Upload and verify',exact:true}).click();
  await uploader.getByRole('status').filter({hasText:/./}).waitFor({timeout:60000});const status=await uploader.getByRole('status').textContent();assert.match(status,/Verified asset ready:/,status);
 });
 const {rows}=await db.query("select m.id,m.public_id,m.context,m.visibility,m.width,m.height,i.confirmed_at from public.media_assets m join public.upload_intents i on i.public_id=m.public_id where m.owner_user_id=$1",[fixture]);
 assert.equal(rows.length,1);const asset=rows[0];
 await check('Provider verification atomically confirms the private database asset',async()=>{
  assert.equal(asset.context,'invoice');assert.equal(asset.visibility,'private');assert.ok(asset.confirmed_at);assert.equal(asset.width,8);assert.equal(asset.height,8);
  const provider=await cloudinary.api.resource(asset.public_id,{resource_type:'image',type:'authenticated'});assert.equal(provider.public_id,asset.public_id);assert.equal(provider.width,8);
 });
 await check('Authorized browser receives a working expiring private delivery URL',async()=>{
  const response=await context.request.get(`/api/v1/uploads/${asset.id}`);assert.equal(response.status(),200);const {data}=await response.json();assert.equal(data.expiresIn,300);
  const delivered=await context.request.get(data.url);assert.equal(delivered.status(),200);assert.ok((await delivered.body()).length>0);
 });
 await check('Anonymous requests cannot obtain the private delivery URL',async()=>assert.equal((await fetch(`${base}/api/v1/uploads/${asset.id}`)).status,401));
 await check('Catalog video traverses browser upload, provider verification and database confirmation',async()=>{
  const encoded=await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const drawing=canvas.getContext('2d');drawing.fillStyle='#ea580c';drawing.fillRect(0,0,32,32);
   const stream=canvas.captureStream(10),recorder=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];
   recorder.ondataavailable=event=>chunks.push(event.data);
   const stopped=new Promise(resolve=>{recorder.onstop=resolve;});recorder.start();let frame=0;const animation=setInterval(()=>{drawing.fillStyle=frame++%2?'#ea580c':'#17202e';drawing.fillRect(0,0,32,32);},50);await new Promise(resolve=>setTimeout(resolve,1500));clearInterval(animation);recorder.stop();await stopped;stream.getTracks().forEach(track=>track.stop());
   const bytes=new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());return btoa(String.fromCharCode(...bytes));
  });
  await page.getByLabel('Purpose',{exact:true}).selectOption('product');await page.locator('input[type=file]').setInputFiles({name:'catalog-fixture.webm',mimeType:'video/webm',buffer:Buffer.from(encoded,'base64')});
  await page.getByRole('button',{name:'Upload and verify',exact:true}).click();await uploader.getByRole('status').filter({hasText:/./}).waitFor({timeout:60000});const status=await uploader.getByRole('status').textContent();assert.match(status,/Verified asset ready:/,status);
  const {rows:videos}=await db.query("select resource_type,visibility,duration_seconds from public.media_assets where owner_user_id=$1 and context='product'",[fixture]);assert.equal(videos.length,1);assert.equal(videos[0].resource_type,'video');assert.equal(videos[0].visibility,'public');assert.ok(Number(videos[0].duration_seconds)>0&&Number(videos[0].duration_seconds)<=120);
 });
 await check('Private PDF invoice traverses browser, provider verification and attachment download',async()=>{
  const pdf=await renderToBuffer(createElement(Document,null,createElement(Page,null,createElement(Text,null,'Synthetic private supplier invoice acceptance'))));
  await page.getByLabel('Purpose',{exact:true}).selectOption('invoice');await page.locator('input[type=file]').setInputFiles({name:'synthetic-invoice.pdf',mimeType:'application/pdf',buffer:pdf});
  const signed=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/v1/uploads/sign'&&response.request().method()==='POST',{timeout:30000});
  const confirmed=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/v1/uploads/confirm'&&response.request().method()==='POST',{timeout:60000}).catch(()=>null);
  await page.getByRole('button',{name:'Upload and verify',exact:true}).click();const signedResponse=await signed;if(signedResponse.status()!==200)console.error(JSON.stringify({pdfRequest:signedResponse.request().postDataJSON(),error:(await signedResponse.json()).error}));assert.equal(signedResponse.status(),200);assert.equal((await confirmed)?.status(),200);await uploader.getByRole('status').filter({hasText:/Verified asset ready:/}).waitFor({timeout:60000});
  const {rows}=await db.query("select id,public_id,format,visibility,context from public.media_assets where owner_user_id=$1 and format='pdf'",[fixture]);assert.equal(rows.length,1);assert.equal(rows[0].visibility,'private');assert.equal(rows[0].context,'invoice');
  const provider=await cloudinary.api.resource(rows[0].public_id,{resource_type:'image',type:'authenticated'});assert.equal(provider.format,'pdf');
  const response=await context.request.get(`/api/v1/uploads/${rows[0].id}`);assert.equal(response.status(),200);const {data}=await response.json();assert.equal(data.expiresIn,300);const downloaded=await context.request.get(data.url);assert.equal(downloaded.status(),200);assert.equal((await downloaded.body()).subarray(0,5).toString(),'%PDF-');assert.match(downloaded.headers()['content-disposition']??'',/attachment/i);
  assert.equal((await fetch(`${base}/api/v1/uploads/${rows[0].id}`)).status,401);assert.equal((await context.request.post('/api/v1/uploads/sign',{headers:{Origin:base},data:{context:'product',format:'pdf',bytes:pdf.length}})).status(),422);
 });
 console.log(`PASS: ${checks} live browser → Cloudinary → database → private delivery checks. No purchase/financial record was created.`);
 }
}catch(error){console.error(`Media browser verification failed: ${error.message}`);const active=browser?.contexts()[0]?.pages()[0];if(active)console.error(JSON.stringify({visibleStatus:await active.getByRole('status').allTextContents().catch(()=>[]),uploadButton:await active.getByRole('button',{name:/Uploading|Upload and verify/}).allTextContents().catch(()=>[])}));process.exitCode=1;}
finally{
 await browser?.close();
 if(fixture){try{
  const match=await db.query('select id from auth.users where id=$1 and email=$2',[fixture,email]);assert.equal(match.rowCount,1,'Fixture identity mismatch');
  const {rows:intents}=await db.query('select public_id,resource_type,visibility from public.upload_intents where owner_user_id=$1',[fixture]);
  for(const intent of intents){assert.match(intent.public_id,/^smart-fabrication\/[^/]+\/(invoice|product)\/[0-9a-f-]{36}$/);const result=await cloudinary.uploader.destroy(intent.public_id,{resource_type:intent.resource_type,type:intent.visibility==='private'?'authenticated':'upload',invalidate:true});assert.ok(['ok','not found'].includes(result.result),'Provider cleanup failed');}
  await db.query('begin');
  await db.query('delete from public.media_assets where owner_user_id=$1',[fixture]);
  await db.query('delete from public.upload_intents where owner_user_id=$1',[fixture]);
  await db.query('delete from public.user_roles where user_id=$1',[fixture]);
  await db.query('delete from public.profiles where id=$1',[fixture]);await db.query('commit');
  assert.equal((await admin.auth.admin.deleteUser(fixture)).error,null,'Auth fixture cleanup failed');
  console.log('Only this run’s verified fixture assets and account removed; audit history retained.');
 }catch(error){await db.query('rollback').catch(()=>{});console.error(`Media fixture cleanup failed: ${error.message}`);process.exitCode=1;}}
 await db.end().catch(()=>{});
}







