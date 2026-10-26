import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { chromium, devices, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { retirePublicationFixture } from './retire-publication-fixture.mjs';
import { publicationFixtureRecords } from './publication-fixture-records.mjs';
import { cleanupUnlinkedPublicationCategory } from './cleanup-publication-category.mjs';

if (process.argv[2] === '--cleanup-category') { await cleanupUnlinkedPublicationCategory(process.argv[3]); process.exit(0); }
if (process.argv[2] === '--inspect-run') { console.log(await publicationFixtureRecords(process.argv[3])); process.exit(0); }

const base = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local acceptance target required');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options);
const ownerAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const salesAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const run = crypto.randomUUID(), title = `TEST ONLY demo gate ${run}`, heading = `TEST ONLY process ${run}`;
const fixture = { run, title }, users = [], passed = []; let browser, ownerToken, salesToken, cleaned = false;
const calculatorOnly = process.argv.includes('--calculator-only'), cmsOnly = process.argv.includes('--cms-only'), catalogOnly = process.argv.includes('--catalog-only') || calculatorOnly;
assert.ok(!(cmsOnly && catalogOnly), 'Choose one module scope');
async function api(path, method = 'GET', body, token = ownerToken) {
  let response;
  try { response = await fetch(base + '/api/v1' + path, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60000) }); }
  catch (error) { throw new Error(`API ${method} ${path}: ${error.name}; write outcome requires reconciliation`); }
  const result = await response.json();
  assert.ok(response.ok, `API ${method} ${path}: ${response.status} ${result.error?.code ?? ''}`); return result.data;
}
async function check(name, action) { console.log(`INFO: ${name}`); await action(); passed.push(name); console.log(`PASS: ${name}`); }
async function newUser(role, auth) {
  const email = `sf-publication-${role}-${run}@example.invalid`, password = crypto.randomBytes(32).toString('base64url');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: `Retained publication test ${role}` } }); assert.equal(created.error, null, 'Fixture creation failed');
  const user = { id: created.data.user.id, email, password, auth }; users.push(user);
  // Fixture metadata only; all business operations below use authenticated application APIs.
  const { databaseClient } = await import('./db-client.mjs'); const db = databaseClient();
  try { await db.connect(); await db.query('insert into public.user_roles(user_id,role_id) values($1,$2) on conflict do nothing', [user.id, role]); } finally { await db.end(); }
  const login = await auth.auth.signInWithPassword({ email, password }); assert.equal(login.error, null, 'Fixture login failed'); return { ...user, token: login.data.session.access_token };
}
async function editRecord(page, resource, marker, patch) {
  await page.goto('/admin/' + resource);
  const row = page.getByRole('row').filter({ hasText: marker }); await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: /View details of/ }).click(); await page.getByRole('button', { name: 'Edit record', exact: true }).click();
  const dialog = page.getByRole('dialog');
  for (const [name, value] of Object.entries(patch)) {
    const input = dialog.locator(`[name="${name}"]`); if (await input.evaluate(element => element.tagName === 'SELECT')) await input.selectOption(value); else await input.fill(value);
  }
  const saved = page.waitForResponse(response => new URL(response.url()).pathname.startsWith('/api/v1/admin/' + resource + '/') && response.request().method() === 'PATCH');
  await dialog.getByRole('button', { name: 'Save record', exact: true }).click(); assert.equal((await saved).status(), 200); await expect(dialog).toHaveCount(0);
}
async function calculatorWorkflow(page,publicPage,visitor){
  await check('Real calculator uses versioned rates and preserves the original estimate history', async () => {
    fixture.materialId=(await api('/admin/materials','POST',{name:`TEST ONLY calculator material ${run}`,code:`TEST-CALC-${run}`,type:'square_pipe',size:'Synthetic test section',thickness_mm:1,unit:'kg',weight_kg_per_unit:1,reorder_level:0,active:true})).id;
    const rate=(await api('/admin/material-rates','POST',{material_id:fixture.materialId,purchase_minor:8000,selling_minor:10000,effective_at:new Date(Date.now()-7200000).toISOString()})).id;
    fixture.bomId=(await api('/admin/bom-versions','POST',{product_id:fixture.productId,version:1,status:'draft'})).id;
    await api('/admin/bom-items','POST',{bom_id:fixture.bomId,material_id:fixture.materialId,quantity_per_sq_m:2,wastage_percent:10});
    await api('/admin/bom-versions/'+fixture.bomId,'PATCH',{status:'published'});
    fixture.ruleId=(await api('/admin/calculation-rules','POST',{product_id:fixture.productId,version:1,labour_minor_per_sq_m:1000,finish_minor_per_sq_m:500,hardware_minor:100,delivery_minor:200,installation_minor:0,margin_bps:1000,range_percent:10,status:'draft'})).id;
    await page.goto(`/admin/calculation-preview?product=${fixture.productId}&rule=${fixture.ruleId}`);
    await page.getByRole('combobox',{name:'BOM version',exact:true}).selectOption(fixture.bomId);await page.getByLabel('Width (mm)',{exact:true}).fill('1000');await page.getByLabel('Height (mm)',{exact:true}).fill('2000');
    const previewed=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/v1/estimates/preview'&&response.request().method()==='POST');await page.getByRole('button',{name:'Preview estimate',exact:true}).click();const previewResponse=await previewed;const previewBody=await previewResponse.json().catch(()=>({error:{code:'NON_JSON_RESPONSE'}}));assert.equal(previewResponse.status(),200,'Preview response: '+(previewBody.error?.code??'unknown'));const preview=previewBody.data;assert.equal(preview.preview,true);assert.equal(preview.id,undefined);assert.equal(preview.total_minor,52030);await expect(page.getByText('Preview only. No estimate was saved.',{exact:true})).toBeVisible();
    await api('/admin/calculation-rules/'+fixture.ruleId,'PATCH',{status:'published'});
    await publicPage.getByRole('link',{name:'Get approximate estimate',exact:true}).click();
    await publicPage.getByLabel('Width (mm)',{exact:true}).fill('1000');await publicPage.getByLabel('Height (mm)',{exact:true}).fill('2000');
    const calculate=async()=>{const result=publicPage.waitForResponse(response=>new URL(response.url()).pathname==='/api/v1/estimates'&&response.request().method()==='POST');await publicPage.getByRole('button',{name:'Calculate approximate price',exact:true}).click();const response=await result;assert.equal(response.status(),201);return (await response.json()).data;};
    const original=await calculate();fixture.estimateId=original.id;assert.equal(original.total_minor,52030);assert.equal(original.materials[0].rate_id,rate);assert.equal(original.bom_version,1);
    await expect(publicPage.getByText('Approximate estimate',{exact:true})).toBeVisible();
    const changed=(await api('/admin/material-rates','POST',{material_id:fixture.materialId,purchase_minor:12000,selling_minor:20000,effective_at:new Date(Date.now()-3600000).toISOString()})).id;
    const later=await calculate();assert.equal(later.total_minor,100430);assert.equal(later.materials[0].rate_id,changed);
    const historical=await api('/admin/estimate-history/'+original.id);const savedResult={...original};delete savedResult.id;assert.deepEqual(historical.result,savedResult);
    assert.equal((await visitor.request.get('/api/v1/admin/estimate-history/'+original.id)).status(),401);
    const hiddenBom=(await api('/admin/bom-versions','POST',{product_id:fixture.productId,version:2,status:'draft'})).id;
    await api('/admin/bom-items','POST',{bom_id:hiddenBom,material_id:fixture.materialId,quantity_per_sq_m:2,wastage_percent:10,customer_visible:false});await api('/admin/bom-versions/'+hiddenBom,'PATCH',{status:'published'});
    const hidden=await calculate();assert.equal(hidden.total_minor,100430);assert.deepEqual(hidden.materials,[]);const privateHistory=await api('/admin/estimate-history/'+hidden.id);assert.equal(privateHistory.result.materials[0].customer_visible,false);assert.equal(privateHistory.result.materials[0].rate_id,changed);await expect(publicPage.getByText('Material details will be confirmed in the quotation.',{exact:true})).toBeVisible();
    await publicPage.goto(`/catalog/test-gate-${run}`);
  });
}
try {
  assert.equal((await fetch(base + '/api/v1/health', { signal: AbortSignal.timeout(10000) })).status, 200);
  const owner = await newUser('owner', ownerAuth); ownerToken = owner.token; const sales = cmsOnly || calculatorOnly ? null : await newUser('sales', salesAuth); salesToken = sales?.token;
  browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'msedge', headless: true });
  const staff = await browser.newContext({ ...devices['iPhone 13'], baseURL: base }), visitor = await browser.newContext({ ...devices['iPhone 13'], baseURL: base });
  staff.setDefaultTimeout(30000); visitor.setDefaultTimeout(30000);await visitor.addInitScript(()=>sessionStorage.setItem('sf:visitor-dismissed','1')); const page = await staff.newPage(), publicPage = await visitor.newPage();
  await page.goto('/login'); await page.getByLabel('Email', { exact: true }).fill(owner.email); await page.getByLabel('Password', { exact: true }).fill(owner.password); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await page.waitForURL('**/account');
  if (!catalogOnly) {
  fixture.sectionId = (await api('/admin/site-sections', 'POST', { name: 'process', heading, body: 'TEST ONLY - publication acceptance. Not a workshop claim.', sort_order: 9999, status: 'draft' })).id;
  await check('Real mobile CMS publication and edits appear to an anonymous visitor', async () => {
    await publicPage.goto('/about'); await expect(publicPage.getByRole('heading', { name: heading, exact: true })).toHaveCount(0);
    await editRecord(page, 'site-sections', heading, { status: 'published' }); await publicPage.reload(); await expect(publicPage.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await editRecord(page, 'site-sections', heading, { body: `TEST ONLY updated published content ${run}` }); await publicPage.reload(); await expect(publicPage.getByText(`TEST ONLY updated published content ${run}`, { exact: true })).toBeVisible();
    await api('/admin/site-sections/' + fixture.sectionId, 'PATCH', { status: 'archived' }); await publicPage.reload(); await expect(publicPage.getByRole('heading', { name: heading, exact: true })).toHaveCount(0);
  });
  }
  if (calculatorOnly) {
    fixture.productId=(await api('/admin/products','POST',{name:title,sku:`TEST-${run}`,slug:`test-gate-${run}`,category_id:null,description:'TEST ONLY synthetic calculator fixture',material:'Test steel',price_min_minor:0,price_max_minor:0,custom_size:true,status:'published',delivery_availability:'available',installation_availability:'unavailable'})).id;
    await publicPage.goto(`/catalog/test-gate-${run}`);
    await calculatorWorkflow(page,publicPage,visitor);
  }
  if (!cmsOnly && !calculatorOnly) {
  fixture.categoryId = (await api('/admin/categories', 'POST', { name: `TEST ONLY category ${run}`, slug: `test-category-${run}`, parent_id: null, sort_order: 9999, active: true })).id;
  await check('Category photo uploads through Cloudinary and is associated through the real admin form', async () => {
    await page.goto('/admin/categories');
    const uploader = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Upload catalog media or evidence', exact: true }) });
    const png = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#ea580c' } }).png().toBuffer();
    await uploader.locator('input[type=file]').setInputFiles({ name: `test-only-category-${run}.png`, mimeType: 'image/png', buffer: png });
    const confirmed = page.waitForResponse(response => new URL(response.url()).pathname === '/api/v1/uploads/confirm' && response.request().method() === 'POST');
    await uploader.getByRole('button', { name: 'Upload and verify', exact: true }).click();
    const response = await confirmed; assert.equal(response.status(), 200); const result = await response.json(); fixture.categoryMediaId = result.data.id;
    assert.match(fixture.categoryMediaId, /^[0-9a-f-]{36}$/);
    await editRecord(page, 'categories', `TEST ONLY category ${run}`, { image_media_id: fixture.categoryMediaId });
    assert.equal((await api('/admin/categories/' + fixture.categoryId)).image_media_id, fixture.categoryMediaId);
    assert.equal((await api('/categories/' + fixture.categoryId, 'GET', undefined, null)).image_media_id, fixture.categoryMediaId);
    const delivered = await api('/uploads/' + fixture.categoryMediaId); assert.equal((await visitor.request.get(delivered.url)).status(), 200);
  });
  fixture.productId = (await api('/admin/products', 'POST', { name: title, sku: `TEST-${run}`, slug: `test-gate-${run}`, category_id: fixture.categoryId, description: 'TEST ONLY - zero-price synthetic catalog acceptance. Not an offered product.', material: 'Test steel', finish: 'Synthetic', price_min_minor: 0, price_max_minor: 0, custom_size: true, featured: true, status: 'draft', weight_kg: 12, design_code: 'TEST-ONLY', design_details: 'Synthetic design metadata for acceptance only.' })).id;
  await check('Verified image associates through the real product-media form', async () => {
    await page.goto('/admin/product-media');await page.getByRole('button',{name:'Add product image',exact:true}).click();const dialog=page.getByRole('dialog');
    await dialog.getByRole('combobox',{name:'Product',exact:true}).selectOption(fixture.productId);
    await dialog.getByRole('combobox',{name:'Verified media',exact:true}).selectOption(fixture.categoryMediaId);
    await dialog.getByRole('textbox',{name:'Accessible description',exact:true}).fill(`TEST ONLY publication photo ${run}`);
    await dialog.locator('input[name="sort_order"]').fill('0');
    const posted=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/v1/admin/product-media'&&response.request().method()==='POST');
    await dialog.getByRole('button',{name:'Save record',exact:true}).click();const response=await posted;assert.equal(response.status(),201);fixture.productMediaId=(await response.json()).data.id;await expect(dialog).toHaveCount(0);
  });
  const variantName = `TEST variant ${run}`, optionName = `TEST option ${run}`;
  fixture.variantId = (await api('/admin/product-variants', 'POST', { product_id: fixture.productId, name: variantName, sku: `TEST-V-${run}`, width_mm: 1000, height_mm: 1800, colour: 'Test', finish: 'Test', price_min_minor: 0, price_max_minor: 0, status: 'published' })).id;
  fixture.optionId = (await api('/admin/product-options', 'POST', { product_id: fixture.productId, name: optionName, option_group: 'Test hardware', extra_cost_minor: 0, sort_order: 0, status: 'published' })).id;
  await check('Draft is hidden from anonymous visitors and available only in authorized preview', async () => {
    assert.equal((await visitor.request.get(`/catalog/test-gate-${run}`)).status(), 404);
    await publicPage.goto('/'); await expect(publicPage.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
    await page.goto(`/admin/products/${fixture.productId}/preview`); await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  });
  await check('Admin publishes via real form; anonymous catalog search/category and design details work', async () => {
    await editRecord(page, 'products', title, { status: 'published', delivery_availability: 'available', installation_availability: 'unavailable' });
    assert.equal((await api('/admin/products/' + fixture.productId)).category_id, fixture.categoryId, 'Editing publication must preserve the existing category');
    await publicPage.goto('/'); await expect(publicPage.locator('section[aria-labelledby="featured-designs"]').getByRole('heading', { name: title, exact: true })).toBeVisible();
    await publicPage.goto('/catalog'); await publicPage.getByRole('textbox', { name: 'Search designs', exact: true }).fill(title); await publicPage.getByRole('combobox', { name: 'Filter category', exact: true }).selectOption(fixture.categoryId); await publicPage.getByRole('button', { name: 'Search', exact: true }).click();
    await publicPage.getByRole('link').filter({ has: publicPage.getByRole('heading', { name: title, exact: true }) }).click();
    await expect(publicPage.getByRole('heading', { name: title, exact: true })).toBeVisible(); await expect(publicPage.getByText('TEST-ONLY', { exact: true })).toBeVisible(); await expect(publicPage.getByRole('heading', { name: variantName, exact: true })).toBeVisible();
    await expect(publicPage.getByText('Available — scope and charges confirmed in quotation',{exact:true})).toBeVisible();await expect(publicPage.getByText('Not offered for this design',{exact:true})).toBeVisible();await expect(publicPage.getByAltText(`TEST ONLY publication photo ${run}`,{exact:true})).toBeVisible();
  });
  await calculatorWorkflow(page,publicPage,visitor);
  await check('Anonymous configured enquiry saves server-derived variant/option snapshot', async () => {
    await publicPage.getByRole('link', { name: 'Request exact quotation', exact: true }).click();
    await publicPage.getByLabel('Your name').fill(`TEST ONLY publication lead ${run}`); await publicPage.getByLabel('Mobile / WhatsApp').fill('910000' + crypto.randomInt(0, 1000000).toString().padStart(6, '0')); await publicPage.getByLabel('Email (optional)').fill(`sf-publication-lead-${run}@example.invalid`); await publicPage.getByLabel('City / area').fill('Test area'); await publicPage.getByLabel('Tell us about your requirement').fill('TEST ONLY - synthetic configured enquiry. No actual customer or order.');
    await publicPage.getByRole('combobox', { name: 'Preferred variant', exact: true }).selectOption(fixture.variantId); await publicPage.getByRole('checkbox', { name: 'Test hardware: ' + optionName, exact: true }).check();
    const received = publicPage.waitForResponse(response => new URL(response.url()).pathname === '/api/v1/leads' && response.request().method() === 'POST');
    await publicPage.getByRole('button', { name: 'Send enquiry', exact: true }).click(); const response = await received; assert.equal(response.status(), 201); fixture.leadId = (await response.json()).data.id; await expect(publicPage.getByRole('heading', { name: 'Your enquiry has been received.', exact: true })).toBeVisible();
    const lead = await api('/admin/leads/' + fixture.leadId); assert.equal(lead.configuration_snapshot.variant.id, fixture.variantId); assert.equal(lead.configuration_snapshot.variant.name, variantName); assert.equal(lead.configuration_snapshot.options[0].id, fixture.optionId); assert.equal(lead.configuration_snapshot.pricing, 'indicative_only');
  });
  await check('Assigned real sales role can note, follow up and transition its lead', async () => {
    await api(`/leads/${fixture.leadId}/assign`, 'POST', { staff_user: sales.id });
    const lead = await api('/admin/leads/' + fixture.leadId, 'GET', undefined, salesToken); assert.equal(lead.id, fixture.leadId);
    await api(`/leads/${fixture.leadId}/notes`, 'POST', { note: 'TEST ONLY - assigned sales follow-up acceptance' }, salesToken);
    fixture.followUpId = (await api('/admin/follow-ups', 'POST', { lead_id: fixture.leadId, due_at: new Date(Date.now() + 86400000).toISOString(), note: 'TEST ONLY - no real customer contact', status: 'pending' }, salesToken)).id;
    await api('/admin/follow-ups/' + fixture.followUpId, 'PATCH', { status: 'completed' }, salesToken);
    await api(`/admin/leads/${fixture.leadId}/transitions`, 'POST', { status: 'CONTACTED', version: lead.version }, salesToken);
    const notes = await api(`/leads/${fixture.leadId}/notes`, 'GET', undefined, salesToken); assert.ok(notes.some(note => note.note === 'TEST ONLY - assigned sales follow-up acceptance'));
  });
  await check('Archiving test catalog removes publication and preserves the original enquiry snapshot', async () => {
    await api('/admin/products/' + fixture.productId, 'PATCH', { status: 'archived' }); assert.equal((await visitor.request.get(`/catalog/test-gate-${run}`)).status(), 404);
    await publicPage.goto('/'); await expect(publicPage.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
    assert.equal((await api('/admin/leads/' + fixture.leadId)).configuration_snapshot.variant.name, variantName);
  });
  }
} catch (error) { console.error(`Publication acceptance failed: ${error.message}`); process.exitCode = 1; }
finally {
  // Archive only IDs created in this run through the real authorized API. Never delete audit.
  try {
    if (ownerToken) {
      Object.assign(fixture, await publicationFixtureRecords(run));
      for (const [resource, id] of [['site-sections', fixture.sectionId], ['products', fixture.productId], ['product-variants', fixture.variantId], ['product-options', fixture.optionId]]) if (id) await api('/admin/' + resource + '/' + id, 'PATCH', { status: 'archived' });
      if (fixture.categoryId) await api('/admin/categories/' + fixture.categoryId, 'PATCH', { active: false });
      if (fixture.materialId) await api('/admin/materials/' + fixture.materialId, 'PATCH', { active: false });
      if (fixture.followUpId) await api('/admin/follow-ups/' + fixture.followUpId, 'PATCH', { status: 'completed' });
      if (fixture.leadId) { const lead = await api('/admin/leads/' + fixture.leadId); if (lead.status !== 'LOST') await api(`/admin/leads/${fixture.leadId}/transitions`, 'POST', { status: 'LOST', version: lead.version }); }
    }
    cleaned = true;
  } catch (error) { console.error(`Publication archive failed: ${error.message}`); process.exitCode = 1; }
  await browser?.close();
  for (const user of users) { try { await retirePublicationFixture({ ...user, admin }); } catch (error) { console.error(`Generated login retirement failed: ${error.message}`); process.exitCode = 1; } }
  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/publication-browser-latest.json', JSON.stringify({ finishedAt: new Date().toISOString(), passed: !process.exitCode, checks: passed, fixture, archived: cleaned, scope: 'Real mobile CMS/catalog/public enquiry/sales APIs. Labeled archived content/catalog, inactive category with referenced synthetic photo, deactivated synthetic materials, immutable BOM/rate/estimate history, closed-lost lead and completed follow-up retained; generated logins disabled/banned; no financial or stock posting.' }, null, 2));
  if (!process.exitCode) console.log(`PASS: ${passed.length} real publication/customer/sales checks. Test publication archived; audit identities retired.`);
}
