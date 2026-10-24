import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { chromium,devices,expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { databaseClient } from './db-client.mjs';
import { retirePublicationFixture } from './retire-publication-fixture.mjs';
const base=process.env.TEST_BASE_URL??'http://localhost:3000';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Local acceptance target required');
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,options);
const auth=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);
const db=databaseClient(),run=crypto.randomUUID(),name=`TEST ONLY measurement ${run}`;
const email=`sf-publication-owner-${run}@example.invalid`,password=crypto.randomBytes(32).toString('base64url');
let account,browser,token,leadId,passed=false,closed=false;
async function api(path,method='GET',body){const response=await fetch(base+'/api/v1'+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});const result=await response.json();assert.ok(response.ok,`${method} ${path}: ${response.status}`);return result.data;}
try{
 await db.connect();const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);account={id:created.data.user.id,email,password,auth};
 await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner') on conflict do nothing",[account.id]);const login=await auth.auth.signInWithPassword({email,password});assert.equal(login.error,null);token=login.data.session.access_token;
 browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({...devices['iPhone 13']});await context.addCookies([{name:'sf_locale',value:'en',url:base}]);const page=await context.newPage();
 await page.goto(base+'/contact?measurement=1');await expect(page.getByLabel('I would like a site measurement visit',{exact:true})).toBeChecked();
 await page.getByLabel('Your name',{exact:true}).fill(name);await page.getByLabel('Mobile / WhatsApp',{exact:true}).fill('9000'+crypto.randomInt(1000000).toString().padStart(6,'0'));await page.getByLabel('City / area',{exact:true}).fill('Jhansi');await page.getByLabel('Tell us about your requirement',{exact:true}).fill('TEST ONLY site measurement request; no real customer contact or visit.');
 const date=new Date(Date.now()+86400000).toISOString().slice(0,10);await page.getByLabel('Preferred date (India time)',{exact:true}).fill(date);await page.getByLabel('Preferred time',{exact:true}).selectOption('afternoon');await page.getByLabel('Site address',{exact:true}).fill('TEST ONLY synthetic site address, Jhansi');await page.getByLabel('PIN code',{exact:true}).fill('284001');
 const createdLead=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/v1/leads'&&r.request().method()==='POST');await page.getByRole('button',{name:'Send enquiry',exact:true}).click();const response=await createdLead;assert.equal(response.status(),201);leadId=(await response.json()).data.id;
 await expect(page.getByRole('heading',{name:'Your enquiry has been received.',exact:true})).toBeVisible();const lead=await api('/admin/leads/'+leadId);assert.equal(lead.name,name);assert.match(lead.phone,/^\+919[0-9]{9}$/);assert.ok(lead.requirement.includes('Preferred date: '+date));assert.ok(lead.requirement.includes('not a confirmed appointment'));assert.ok(lead.requirement.includes('TEST ONLY synthetic site address'));assert.ok(lead.requirement.includes('PIN: 284001'));
 await page.goto(base+'/login');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/account');await expect(page.getByRole('region',{name:'Project overview',exact:true})).toBeVisible();await expect(page.getByText('Counts cover the currently displayed pages.',{exact:false})).toBeVisible();passed=true;
 console.log('PASS: real mobile browser → lead API → development database persists preferred date/time/address/PIN without promising an appointment.');
}catch(error){console.error('Measurement acceptance failed: '+error.message);process.exitCode=1;}
finally{
 try{if(token){const {rows}=await db.query('select id from public.leads where name=$1',[name]);assert.ok(rows.length<=1);leadId??=rows[0]?.id;if(leadId){const lead=await api('/admin/leads/'+leadId);if(lead.status!=='LOST')await api(`/admin/leads/${leadId}/transitions`,'POST',{status:'LOST',version:lead.version});}}closed=true;}catch(error){console.error('Measurement fixture closure failed: '+error.message);process.exitCode=1;}
 await browser?.close();if(account)try{await retirePublicationFixture({...account,admin});}catch(error){console.error('Measurement generated-login retirement failed: '+error.message);process.exitCode=1;}
 await db.end().catch(()=>{});await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/measurement-browser-latest.json',JSON.stringify({finishedAt:new Date().toISOString(),passed:passed&&closed&&!process.exitCode,run,leadId,closed,scope:'Real local mobile browser, API and configured development DB. Labeled lead closed LOST; generated owner retired; immutable audit retained. No real booking confirmation, external message, payment, stock or production entry.'},null,2));
}
