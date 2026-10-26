import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { createElement } from 'react';
import { Document, Page, Text, renderToBuffer } from '@react-pdf/renderer';
import { chromium, devices, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { databaseClient } from './db-client.mjs';

// Only a labeled zero-value DRAFT is created. Immutable invoice evidence is retained.
// Never receive this test purchase, post payment, alter audit, or delete history.
const base = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local acceptance target required');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options);
const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const db = databaseClient(), run = crypto.randomUUID(), email = `sf-procurement-${run}@example.invalid`, password = crypto.randomBytes(32).toString('base64url');
db.on('error', error => console.error('Procurement test database connection interrupted: ' + (error.code ?? 'unknown')));
const title = `TEST ONLY - zero draft invoice acceptance ${run}`, fixture = { run, title };
let browser, context, checks = 0, retired = false;
const passed = [];
async function check(name, action) { console.log(`INFO: ${name}`); await action(); checks++; passed.push(name); console.log(`PASS: ${name}`); }
try {
  assert.equal((await fetch(base + '/api/v1/health', { signal: AbortSignal.timeout(10000) })).status, 200);
  await db.connect(); await db.query('set statement_timeout=20000');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: 'Retained procurement test author' } });
  assert.equal(created.error, null, 'Fixture Auth creation failed'); fixture.ownerId = created.data.user.id;
  await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner')", [fixture.ownerId]);
  browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'msedge', headless: true });
  context = await browser.newContext({ ...devices['iPhone 13'], baseURL: base }); context.setDefaultTimeout(30000);
  const page = await context.newPage();
  await page.goto('/login'); await page.getByLabel('Email', { exact: true }).fill(email); await page.getByLabel('Password', { exact: true }).fill(password); await page.getByRole('button', { name: 'Sign in', exact: true }).click(); await page.waitForURL('**/account');
  const supplier = await context.request.post('/api/v1/admin/suppliers', { headers: { Origin: base }, data: { name: `TEST ONLY - invoice vendor ${run}`, phone: '910000000000', address: 'Synthetic acceptance fixture; no real supplier', gst_number: '' } });
  assert.equal(supplier.status(), 201); fixture.supplierId = (await supplier.json()).data.id;
  await check('Mobile browser creates a real zero-value draft purchase through the application', async () => {
    await page.goto('/admin/purchases'); await page.getByRole('button', { name: 'Add purchase', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Add purchase', exact: true });
    await dialog.getByLabel('Purchase title', { exact: false }).fill(title); await dialog.locator('select[name=supplier_id]').selectOption(fixture.supplierId); await dialog.getByLabel('Supplier bill number', { exact: false }).fill(`TEST-${run}`); await dialog.getByLabel('Bill date', { exact: false }).fill('2026-10-16');
    await dialog.getByRole('button', { name: 'Save record', exact: true }).click();
    await expect(page.getByText('Purchases record saved.', { exact: true })).toBeVisible();
    const rows = await db.query('select id,status,total_minor from public.purchases where supplier_id=$1 and bill_number=$2', [fixture.supplierId, `TEST-${run}`]); assert.equal(rows.rowCount, 1); fixture.purchaseId = rows.rows[0].id; assert.equal(rows.rows[0].status, 'draft'); assert.equal(String(rows.rows[0].total_minor), '0');
  });
  let attempts = 0; const payloads = [], returnedIds = [];
  await page.route(`**/api/v1/purchases/${fixture.purchaseId}/attachments`, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    attempts++; payloads.push(route.request().postDataJSON());
    const response = await route.fetch(); assert.equal(response.status(), 201); returnedIds.push((await response.json()).data.id);
    // The real server already committed. Lose only its first browser response.
    return attempts === 1 ? route.abort('failed') : route.fulfill({ response });
  });
  await page.getByRole('button', { name: `View details of ${title}`, exact: true }).click();
  await page.getByRole('tab',{name:'Invoice',exact:true}).click();
  const panel = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Private invoices', exact: true }) });
  await check('Real PDF upload, provider verification and committed association recover a lost response', async () => {
    const pdf = await renderToBuffer(createElement(Document, null, createElement(Page, null, createElement(Text, null, 'TEST ONLY - synthetic zero-value draft invoice. Not a supplier bill.'))));
    await panel.getByLabel('Invoice image or PDF', { exact: true }).setInputFiles({ name: 'test-only-zero-draft.pdf', mimeType: 'application/pdf', buffer: pdf }); await panel.getByLabel('Invoice note', { exact: true }).fill('TEST ONLY - immutable zero-draft acceptance evidence');
    await panel.getByRole('button', { name: 'Upload and attach invoice', exact: true }).click(); await expect(panel.getByRole('button', { name: 'Retry attachment', exact: true })).toBeVisible({ timeout: 90000 });
    await expect(panel.getByLabel('Invoice note', { exact: true })).toBeDisabled();
    await panel.getByRole('button', { name: 'Retry attachment', exact: true }).click(); await expect(panel.getByRole('button', { name: 'Prepare invoice 1', exact: true })).toBeVisible({ timeout: 60000 });
    assert.equal(attempts, 2); assert.deepEqual(payloads[0], payloads[1]); assert.equal(returnedIds[0], returnedIds[1]); fixture.mediaId = payloads[0].media_id;
    const rows = await db.query('select a.id,m.format,m.visibility,m.context,i.confirmed_at from public.purchase_attachments a join public.media_assets m on m.id=a.media_id join public.upload_intents i on i.public_id=m.public_id where a.purchase_id=$1', [fixture.purchaseId]);
    assert.equal(rows.rowCount, 1); assert.equal(rows.rows[0].format, 'pdf'); assert.equal(rows.rows[0].visibility, 'private'); assert.equal(rows.rows[0].context, 'invoice'); assert.ok(rows.rows[0].confirmed_at);
  });
  await check('Authorized invoice link downloads actual private PDF bytes; anonymous access is denied', async () => {
    await panel.getByRole('button', { name: 'Prepare invoice 1', exact: true }).click(); const link = panel.getByRole('link', { name: /Open invoice 1/ }); await expect(link).toBeVisible();
    const url = await link.getAttribute('href'), downloaded = await context.request.get(url); assert.equal(downloaded.status(), 200); assert.equal((await downloaded.body()).subarray(0, 5).toString(), '%PDF-'); assert.match(downloaded.headers()['content-disposition'] ?? '', /attachment/i);
    assert.equal((await fetch(base + `/api/v1/uploads/${fixture.mediaId}`)).status, 401);
    assert.equal((await fetch(base + `/api/v1/purchases/${fixture.purchaseId}/attachments`)).status, 401);
  });
  await check('Invoice evidence preserves the zero draft and does not receive stock or create purchase items', async () => {
    const { rows } = await db.query('select status,total_minor,(select count(*)::int from public.purchase_items where purchase_id=p.id) items from public.purchases p where id=$1', [fixture.purchaseId]); assert.equal(rows[0].status, 'draft'); assert.equal(String(rows[0].total_minor), '0'); assert.equal(rows[0].items, 0);
  });
} catch (error) { console.error(`Procurement browser acceptance failed: ${error.message}`); process.exitCode = 1; }
finally {
  await browser?.close();
  if (fixture.ownerId) {
    try {
      await db.end().catch(() => {});
      const cleanupDb = databaseClient(); await cleanupDb.connect();
      try {
        assert.match(email, /^sf-procurement-[0-9a-f-]{36}@example\.invalid$/);
        assert.equal((await cleanupDb.query('select id from auth.users where id=$1 and email=$2', [fixture.ownerId, email])).rowCount, 1);
        await cleanupDb.query('begin'); await cleanupDb.query('delete from public.user_roles where user_id=$1', [fixture.ownerId]); await cleanupDb.query('update public.profiles set disabled=true where id=$1', [fixture.ownerId]); await cleanupDb.query('commit');
        const session = await auth.auth.signInWithPassword({ email, password }); assert.equal(session.error, null, 'Retirement sign-in failed'); assert.equal((await auth.auth.signOut({ scope: 'global' })).error, null, 'Retirement sign-out failed');
        assert.equal((await admin.auth.admin.updateUserById(fixture.ownerId, { ban_duration: '876000h', password: crypto.randomBytes(32).toString('base64url') })).error, null, 'Fixture ban failed'); retired = true;
        console.log('Generated test login retired. Only the labeled fixtures/evidence actually created by this run are retained; no receipt/payment/stock posting.');
      } finally { await cleanupDb.end().catch(() => {}); }
    } catch (error) { console.error(`Procurement fixture retirement failed: ${error.message}`); process.exitCode = 1; }
  }
  await db.end().catch(() => {}); await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/procurement-browser-latest.json', JSON.stringify({ finishedAt: new Date().toISOString(), passed: !process.exitCode, checks, passedChecks: passed, fixture, retired, scope: 'Real application/Auth/Cloudinary/database on a retained labeled zero-value draft; only the first committed association response is dropped.' }, null, 2));
  if (!process.exitCode) console.log(`PASS: ${checks} combined real procurement browser checks.`);
}
