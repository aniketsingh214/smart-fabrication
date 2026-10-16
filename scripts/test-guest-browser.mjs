import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { chromium,expect } from '@playwright/test';
import {v2 as cloudinary} from 'cloudinary';
import {databaseClient} from './db-client.mjs';
const base=process.env.TEST_BASE_URL??'http://localhost:3000',db=databaseClient();
const email=`sf-guest-browser-${crypto.randomUUID()}@example.invalid`,phone=`9${crypto.randomInt(100000000,999999999)}`;
cloudinary.config({cloud_name:process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET,secure:true});
let browser,lead,checks=0;
async function check(name,action){await action();checks++;console.log(`PASS: ${name}`);}
try{
 await db.connect();browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({baseURL:base}),page=await context.newPage();
 await page.goto('/contact?inspiration=gate');await expect(page.getByLabel('Tell us about your requirement')).toHaveValue(/Decorative entrance gate/);
 await page.getByLabel('Your name',{exact:true}).fill('Synthetic guest browser fixture');await page.getByLabel('Mobile / WhatsApp',{exact:true}).fill(phone);await page.getByLabel('Email (optional)',{exact:true}).fill(email);await page.getByLabel('City / area',{exact:true}).fill('Acceptance test city');
 const image=await sharp({create:{width:32,height:32,channels:3,background:'#ea580c'}}).png().toBuffer();await page.getByLabel('Reference design (optional)').setInputFiles({name:'synthetic-reference.png',mimeType:'image/png',buffer:image});
 const submitted=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/v1/leads'&&response.request().method()==='POST');
 const confirmed=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/v1/uploads/guest/confirm'&&response.request().method()==='POST',{timeout:90000});
 await page.getByRole('button',{name:'Send enquiry',exact:true}).click();const submission=await submitted;assert.equal(submission.status(),201);const body=await submission.json();lead=body.data.id;assert.match(lead,/^[a-f0-9-]{36}$/);assert.ok(body.data.uploadToken);
 await check('Guest browser saves a real enquiry with demo reference and no login',async()=>{await expect(page.getByRole('heading',{name:'Your enquiry has been received.',exact:true})).toBeVisible();const {rows}=await db.query('select email,phone,requirement,product_id from public.leads where id=$1',[lead]);assert.equal(rows[0].email,email);assert.equal(rows[0].phone,phone);assert.match(rows[0].requirement,/pexels.com/);assert.equal(rows[0].product_id,null);});
 await check('Guest reference photo reaches Cloudinary and atomic lead association',async()=>{assert.equal((await confirmed).status(),200);await expect(page.getByText('Attaching your reference image…',{exact:true})).toHaveCount(0,{timeout:30000});await expect(page.getByRole('alert').filter({hasText:/could not|failed|error/i})).toHaveCount(0);const {rows}=await db.query('select m.id,m.public_id,m.visibility,m.context,i.confirmed_at from public.lead_attachments a join public.media_assets m on m.id=a.media_id join public.upload_intents i on i.public_id=m.public_id where a.lead_id=$1',[lead]);assert.equal(rows.length,1);assert.equal(rows[0].visibility,'private');assert.equal(rows[0].context,'customer_design');assert.ok(rows[0].confirmed_at);const provider=await cloudinary.api.resource(rows[0].public_id,{resource_type:'image',type:'authenticated'});assert.equal(provider.width,32);});
 await check('Guest token is scoped and confirmation retries do not duplicate attachment',async()=>{const {rows}=await db.query('select id from public.upload_intents where lead_id=$1',[lead]);const headers={'X-Enquiry-Upload-Token':body.data.uploadToken};const retry=await context.request.post('/api/v1/uploads/guest/confirm',{headers,data:{intentId:rows[0].id}});assert.equal(retry.status(),200);assert.equal((await db.query('select id from public.lead_attachments where lead_id=$1',[lead])).rowCount,1);assert.equal((await context.request.post('/api/v1/uploads/guest/confirm',{headers,data:{intentId:crypto.randomUUID()}})).status(),404);assert.equal((await context.request.post('/api/v1/uploads/guest/sign',{headers,data:{context:'invoice',format:'png',bytes:100}})).status(),403);});
 await check('Anonymous browser cannot read saved CRM data or private reference URLs',async()=>{const {rows}=await db.query('select media_id from public.lead_attachments where lead_id=$1',[lead]);assert.equal((await context.request.get('/api/v1/admin/leads/'+lead)).status(),401);assert.equal((await context.request.get('/api/v1/uploads/'+rows[0].media_id)).status(),401);});
 console.log(`PASS: ${checks} real guest browser, provider, association and privacy checks.`);
}catch(error){console.error(`Guest browser acceptance failed: ${error.message}`);process.exitCode=1;}
finally{
 await browser?.close();
 try{if(!lead){const found=await db.query('select id from public.leads where email=$1 and phone=$2',[email,phone]);if(found.rowCount===1)lead=found.rows[0].id;}if(lead){const match=await db.query('select id from public.leads where id=$1 and email=$2 and phone=$3',[lead,email,phone]);assert.equal(match.rowCount,1,'Synthetic lead identity mismatch');const {rows:intents}=await db.query('select public_id from public.upload_intents where lead_id=$1',[lead]);for(const intent of intents){assert.match(intent.public_id,/^smart-fabrication\/[^/]+\/customer_design\/[a-f0-9-]{36}$/);const result=await cloudinary.uploader.destroy(intent.public_id,{resource_type:'image',type:'authenticated',invalidate:true});assert.ok(['ok','not found'].includes(result.result));}await db.query('begin');const {rows:media}=await db.query('delete from public.lead_attachments where lead_id=$1 returning media_id',[lead]);for(const asset of media)await db.query('delete from public.media_assets where id=$1',[asset.media_id]);await db.query('delete from public.upload_intents where lead_id=$1',[lead]);await db.query('delete from public.lead_status_history where lead_id=$1',[lead]);await db.query('delete from public.leads where id=$1 and email=$2',[lead,email]);await db.query('commit');console.log('Synthetic guest enquiry and provider asset removed; normal enquiry notifications and immutable audit retained.');}}
 catch(error){await db.query('rollback').catch(()=>{});console.error(`Guest fixture cleanup failed: ${error.message}`);process.exitCode=1;}
 await db.end().catch(()=>{});
}


