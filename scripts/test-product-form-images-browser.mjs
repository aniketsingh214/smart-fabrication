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
let user,browser,page;const baseline=new Map();
async function check(name,fn){if(process.env.SF_SALES_GROUP&&!new RegExp(process.env.SF_SALES_GROUP).test(name))return;console.log('INFO: '+name);await fn();checks.push(name);console.log('PASS: '+name);}
async function navigate(url){for(let attempt=0;;attempt++){try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});return;}catch(error){if(attempt>=1||!/Timeout|ERR_ABORTED/i.test(error.message))throw error;console.log('INFO: Retrying interrupted page navigation');}}}
async function preserved(){const db=databaseClient();try{await db.connect();for(const [table,id] of [['leads',repair.leadId],['customers',repair.oldCustomerId,repair.oldCustomerHash],['quotations',repair.oldQuoteId,repair.oldQuoteHash]]){const row=(await db.query('select md5(row_to_json(r)::text) hash from public.'+table+' r where id=$1',[id])).rows[0];if(!baseline.has(table))baseline.set(table,row.hash);else assert.equal(row.hash,baseline.get(table),table+' changed during browser acceptance');}}finally{await db.end();}}
try{
 await preserved();
 const email='sf-publication-owner-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomBytes(32).toString('base64url');
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);user={id:created.data.user.id,email,password,auth};
 const db=databaseClient();try{await db.connect();await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner')",[user.id]);}finally{await db.end();}
 const signed=await auth.auth.signInWithPassword({email,password});assert.equal(signed.error,null);
 browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});context.setDefaultTimeout(45000);await context.addCookies([{name:'sf_locale',value:'en',url:base}]);page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('console',message=>{if(message.type()==='error'&&/hydration|hydrated|didn't match/i.test(message.text()))errors.push(message.text());});
 await navigate(base+'/login');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/admin',{timeout:90000,waitUntil:'domcontentloaded'});await expect(page.locator('main#main-content')).toBeVisible();
 if(new URL(base).hostname==='smartfabrication.vercel.app'){console.log('INFO: Waiting for deployed product image UI');await expect(async()=>{await navigate(base+'/admin/products?new=1');await expect(page.getByRole('button',{name:'Choose images',exact:true})).toBeVisible({timeout:5000});}).toPass({timeout:180000,intervals:[10000]});}

 const id=crypto.randomUUID(),media=[],confirmed=[],unexpected=[];let creates=0,uploads=0,patches=0,failLink=true;
 let product={id,name:'Acceptance Gate',sku:'ACCEPT-GATE',slug:'accept-gate',material:'Steel',description:'',weight_kg:1,price_min_minor:10000,price_max_minor:10000,custom_size:false,featured:false,status:'draft',delivery_availability:'confirm_with_workshop',installation_availability:'confirm_with_workshop'};
 const png=await (await import('sharp')).default({create:{width:24,height:24,channels:3,background:'#b58a36'}}).png().toBuffer();
 await page.route('**/_next/image?**',route=>route.fulfill({contentType:'image/png',body:png}));await page.route('https://res.cloudinary.com/**',route=>route.fulfill({contentType:'image/png',body:png}));await page.route('**/__product-image-acceptance',async route=>{uploads++;await route.fulfill({json:{public_id:'acceptance'}});});
 await page.route('**/api/v1/**',async route=>{const request=route.request(),url=new URL(request.url()),path=url.pathname,method=request.method();
  if(path==='/api/v1/uploads/sign'){assert.equal(request.postDataJSON().context,'product');await route.fulfill({json:{data:{apiKey:'acceptance',signature:'acceptance',uploadUrl:base+'/__product-image-acceptance',intentId:crypto.randomUUID(),params:{timestamp:1,public_id:'acceptance'}}}});return;}
  if(path==='/api/v1/uploads/confirm'){const asset=crypto.randomUUID();confirmed.push(asset);await route.fulfill({json:{data:{id:asset}}});return;}
  if(path==='/api/v1/admin/products'){if(method==='POST'){creates++;product={...product,...request.postDataJSON()};await route.fulfill({status:201,json:{data:product}});}else await route.fulfill({json:{data:[product],meta:{nextCursor:null}}});return;}
  if(path==='/api/v1/admin/products/'+id){if(method==='PATCH'){patches++;product={...product,...request.postDataJSON()};}await route.fulfill({json:{data:product}});return;}
  if(path==='/api/v1/admin/products/'+id+'/preview'){await route.fulfill({json:{data:{...product,product_media:media.map(row=>({...row,media_assets:{id:row.media_id,public_id:'acceptance/'+row.media_id,resource_type:'image',visibility:'public'}}))}}});return;}
  if(path==='/api/v1/admin/product-media'){if(method==='POST'){if(failLink){failLink=false;await route.fulfill({status:500,json:{error:{code:'DATABASE_ERROR',message:'Acceptance image link failed'}}});return;}media.push({id:crypto.randomUUID(),...request.postDataJSON()});await route.fulfill({status:201,json:{data:media.at(-1)}});}else await route.fulfill({json:{data:media,meta:{nextCursor:null}}});return;}
  if(path==='/api/v1/admin/product-variants'&&method==='POST'){await route.fulfill({status:201,json:{data:{id:crypto.randomUUID()}}});return;}
  if(!['GET','HEAD'].includes(method)){unexpected.push(path);await route.fulfill({status:500,json:{error:{message:'Unexpected acceptance write blocked'}}});return;}await route.continue();
 });
 await check('Add form stages previews, rejects unsupported files and uploads only on Save',async()=>{
  await navigate(base+'/admin/products?new=1');await expect(page.getByRole('button',{name:'Choose images',exact:true})).toBeVisible();const picker=page.getByLabel('Choose new product images',{exact:true});await picker.setInputFiles({name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});await expect(page.getByText('Choose non-empty JPG, PNG or WebP images no larger than 10 MB.',{exact:true})).toBeVisible();
  await picker.setInputFiles([{name:'front.png',mimeType:'image/png',buffer:png},{name:'detail.png',mimeType:'image/png',buffer:png}]);await expect(page.getByRole('region',{name:'New product images'}).locator('img')).toHaveCount(2);await page.getByRole('button',{name:'Set cover',exact:true}).click();assert.equal(uploads,0);
  const fields={name:'Acceptance Gate',sku:'ACCEPT-GATE',slug:'accept-gate',material:'Steel',price_min_minor:'100',price_max_minor:'100'};for(const [field,value] of Object.entries(fields))await page.locator('fieldset [name='+field+']').fill(value);
  await page.getByRole('button',{name:'Save record',exact:true}).click();await expect(page.getByRole('button',{name:'Retry images',exact:true})).toBeVisible();assert.equal(creates,1);assert.equal(uploads,2);assert.equal(confirmed.length,2);await page.getByRole('button',{name:'Retry images',exact:true}).click();await expect(page).toHaveURL(new RegExp('edit='+id));await expect(page.locator('input[type=file]')).toHaveCount(1);assert.equal(creates,1);assert.equal(uploads,2);assert.equal(media.length,2);assert.equal(media[0].sort_order,0);assert.equal(media[0].media_id,confirmed[0]);
 });
 await check('Edit form uploads to the same product and retains images while saving details',async()=>{
  await expect(page.locator('input[type=file]')).toBeEnabled();await page.locator('input[type=file]').setInputFiles({name:'edit.png',mimeType:'image/png',buffer:png});await expect(async()=>assert.equal(media.length,3)).toPass({timeout:45000});await expect(page.getByRole('button',{name:'Save record',exact:true})).toBeEnabled();assert.ok(media.every(row=>row.product_id===id));await page.getByRole('button',{name:'Save record',exact:true}).click();await expect(page).toHaveURL(base+'/admin/products');assert.equal(patches,1);assert.equal(media.length,3);
 });
 await check('Add and Edit image controls fit mobile, tablet and desktop without nested forms',async()=>{
  for(const target of ['/admin/products?new=1','/admin/products?edit='+id]){await navigate(base+target);await expect(page.locator('input[type=file]')).toBeAttached();for(const width of [320,390,768,1024,1440,1920]){await page.setViewportSize({width,height:1000});await expect(async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),target+' overflow '+width)).toPass({timeout:5000});assert.equal(await page.locator('form form').count(),0);}}
  await page.screenshot({path:'test-results/product-image-edit.png',fullPage:true,caret:'initial'});await navigate(base+'/admin/products?new=1');await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/product-image-add-mobile.png',fullPage:true,caret:'initial'});
 });
 assert.deepEqual(unexpected,[]);
 await preserved();assert.deepEqual(errors,[]);await fs.writeFile('test-results/product-form-images-browser-latest.json',JSON.stringify({base,checks,errors,completedAt:new Date().toISOString()},null,2));
}catch(error){console.error(error.stack);if(page){console.error('Browser URL: '+page.url());console.error('Dimensions: '+JSON.stringify(await page.evaluate(()=>({innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,nodes:[...document.querySelectorAll('body *')].filter(n=>n.getBoundingClientRect().right>innerWidth+1).slice(-20).map(n=>({tag:n.tagName,cls:n.className,right:n.getBoundingClientRect().right}))}))));console.error('Overflow nodes: '+JSON.stringify(await page.locator('body *').evaluateAll(nodes=>nodes.filter(node=>node.getBoundingClientRect().right>innerWidth+2).filter(node=>{for(let parent=node.parentElement;parent;parent=parent.parentElement){if(["auto","scroll","hidden","clip"].includes(getComputedStyle(parent).overflowX))return false;}return true;}).slice(0,20).map(node=>({tag:node.tagName,class:node.className,right:node.getBoundingClientRect().right}))).catch(()=>[])));console.error('Visible alerts: '+await page.getByRole('alert').allTextContents().catch(()=>[]));await page.screenshot({path:'test-results/product-form-images-failure.png'}).catch(()=>{});}process.exitCode=1;}finally{await browser?.close();if(user)try{for(let attempt=0;;attempt++){try{await retirePublicationFixture({...user,admin});break;}catch(error){if(attempt>=2)throw error;}}console.log('Generated test identity retired');}catch(error){console.error('Fixture retirement failed: '+error.message);process.exitCode=1;}}
