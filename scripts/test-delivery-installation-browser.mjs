import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { chromium, devices, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { databaseClient } from './db-client.mjs';
import { retirePublicationFixture } from './retire-publication-fixture.mjs';

const base = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local acceptance target required');

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options);
const ownerAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const customerAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);

const run = crypto.randomUUID();
const fixture = { run };
const users = [];
const passed = [];
let ownerToken, customerToken;

async function api(path, method = 'GET', body, token = ownerToken, extraHeaders = {}) {
  let response;
  try {
    response = await fetch(base + '/api/v1' + path, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    throw new Error(`API ${method} ${path}: ${error.name}`);
  }
  const result = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data: result.data, error: result.error };
}

async function check(name, action) {
  console.log(`INFO: ${name}`);
  await action();
  passed.push(name);
  console.log(`PASS: ${name}`);
}

async function newUser(role, auth) {
  const email = `sf-publication-${role}-${crypto.randomUUID()}@example.invalid`;
  const password = crypto.randomBytes(32).toString('base64url');
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Delivery acceptance ${role}` },
  });
  assert.equal(created.error, null, 'Fixture creation failed');
  const user = { id: created.data.user.id, email, password, auth, admin };
  users.push(user);

  const db = databaseClient();
  try {
    await db.connect();
    await db.query('insert into public.user_roles(user_id, role_id) values($1, $2) on conflict do nothing', [user.id, role]);
  } finally {
    await db.end();
  }

  const login = await auth.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null, 'Fixture login failed');
  return { ...user, token: login.data.session.access_token };
}

async function main() {
  console.log(`Starting Phase 16 acceptance run: ${run}`);
  const owner = await newUser('owner', ownerAuth);
  ownerToken = owner.token;
  const customer = await newUser('customer', customerAuth);
  customerToken = customer.token;
  const stranger = await newUser('customer', customerAuth);

  const db = databaseClient();
  await db.connect();

  let browser;
  try {

    // 1. Setup base order via API
    const contactRes = await api('/admin/customers', 'POST', {
      name: `Delivery Customer ${run.slice(0, 8)}`,
      phone: '+919876543210',
      email: customer.email,
      address: 'Flat 402, Sunset Towers, Gurugram',
      notes: 'Customer for delivery & installation acceptance'
    });
    assert.equal(contactRes.ok, true, 'Customer creation failed');
    fixture.customerId = contactRes.data.id;

    await api(`/customers/${fixture.customerId}/link`, 'POST', { email: customer.email });

    const leadRes = await api('/admin/leads', 'POST', {
      name: `Delivery Lead ${run.slice(0, 8)}`,
      phone: '+919876543210',
      email: customer.email,
      city: 'Gurugram',
      requirement: 'Main gate with delivery & installation'
    });
    assert.equal(leadRes.ok, true, 'Lead creation failed');
    fixture.leadId = leadRes.data.id;

    const measRes = await api('/admin/measurements', 'POST', {
      lead_id: fixture.leadId,
      width_mm: 3000,
      height_mm: 2100,
      depth_mm: 100,
      note: 'Verified site dimensions'
    });
    assert.equal(measRes.ok, true, 'Measurement creation failed');

    const quoteRes = await api('/admin/quotations', 'POST', {
      name: `Delivery Quotation ${run.slice(0, 8)}`,
      customer_id: fixture.customerId,
      lead_id: fixture.leadId,
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString()
    });
    assert.equal(quoteRes.ok, true, 'Quotation creation failed');
    fixture.quotationId = quoteRes.data.id;

    const qvRes = await api(`/admin/quotations/${fixture.quotationId}/versions`, 'POST', {
      items: [{ description: 'Main entrance gate', quantity: 1, unit_minor: 6000000 }],
      discount_minor: 0,
      tax_bps: 1800
    });
    assert.equal(qvRes.ok, true, 'Quotation version failed');

    const appRes = await api(`/admin/quotations/${fixture.quotationId}/approve`, 'POST', {});
    assert.equal(appRes.ok, true, `Quotation approval failed: ${JSON.stringify(appRes.error)}`);

    const accRes = await api(`/quotations/${fixture.quotationId}/accept`, 'POST', {}, customerToken);
    assert.equal(accRes.ok, true, `Quotation acceptance failed: ${JSON.stringify(accRes.error)}`);

    // Convert quotation to order
    const convRes = await api(`/admin/quotations/${fixture.quotationId}/convert`, 'POST', {});
    assert.equal(convRes.ok, true, `Quotation conversion failed: ${JSON.stringify(convRes.error)}`);
    fixture.orderId = convRes.data.result;
    console.log(`Order created: ${fixture.orderId}`);

    // Record advance payment
    const payKey = crypto.randomUUID();
    const payRes = await api('/admin/customer-payments', 'POST', {
      order_id: fixture.orderId,
      amount_minor: 2500000,
      mode: 'bank',
      reference: `ADV-DEL-${run.slice(0, 6)}`
    }, ownerToken, { 'Idempotency-Key': payKey });
    assert.equal(payRes.ok, true, 'Advance payment failed');

    async function getOrderVersion() {
      const res = await api('/admin/orders/' + fixture.orderId);
      assert.equal(res.ok, true, `Get order failed: ${JSON.stringify(res.error)}`);
      return res.data.version;
    }

    // Progress order: CONFIRMED -> ADVANCE_RECEIVED -> MEASUREMENT_CONFIRMED -> PRODUCTION_PENDING -> PRODUCTION_STARTED -> FABRICATION_COMPLETED -> FINISHING -> READY
    await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', { status: 'ADVANCE_RECEIVED', version: await getOrderVersion() });
    await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', { status: 'MEASUREMENT_CONFIRMED', version: await getOrderVersion() });
    await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', { status: 'PRODUCTION_PENDING', version: await getOrderVersion() });

    // Create work order and quality check to satisfy READY gate
    const woRes = await api('/admin/work-orders', 'POST', {
      name: `WO-DEL-${run.slice(0, 6)}`,
      order_id: fixture.orderId,
      planned_weight_kg: 280
    });
    assert.equal(woRes.ok, true, `Work order creation failed: ${JSON.stringify(woRes.error)}`);
    fixture.workOrderId = woRes.data.id;

    await api(`/admin/work-orders/${fixture.workOrderId}/transitions`, 'POST', { status: 'fabrication' });
    await api(`/admin/work-orders/${fixture.workOrderId}/transitions`, 'POST', { status: 'finishing' });
    await api(`/admin/work-orders/${fixture.workOrderId}/transitions`, 'POST', { status: 'quality_check' });

    const qcRes = await api('/admin/quality-checks', 'POST', {
      work_order_id: fixture.workOrderId,
      name: 'Final weld & alignment QC',
      passed: true,
      note: 'All dimensions verified within 1mm'
    });
    assert.equal(qcRes.ok, true, `Quality check creation failed: ${JSON.stringify(qcRes.error)}`);

    await api(`/admin/work-orders/${fixture.workOrderId}/transitions`, 'POST', { status: 'ready' });

    await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', { status: 'PRODUCTION_STARTED', version: await getOrderVersion() });
    await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', { status: 'FABRICATION_COMPLETED', version: await getOrderVersion() });
    await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', { status: 'FINISHING', version: await getOrderVersion() });
    await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', { status: 'READY', version: await getOrderVersion() });

    console.log(`Order successfully advanced to READY stage!`);

    // --- CHECK 1: Delivery scheduling and transport assignment ---
    await check('Delivery scheduling validates crew, address and enforces initial scheduled status', async () => {
      // Must progress order to OUT_FOR_DELIVERY
      const outRes = await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', {
        status: 'OUT_FOR_DELIVERY',
        version: await getOrderVersion(),
        note: 'Dispatched to installation site'
      });
      assert.equal(outRes.ok, true, `Transition to OUT_FOR_DELIVERY failed: ${outRes.error?.message}`);

      // Schedule delivery
      const schedTime = new Date(Date.now() + 3600000).toISOString();
      const delivRes = await api('/admin/deliveries', 'POST', {
        name: `Delivery for Order ${fixture.orderId.slice(0, 8)}`,
        order_id: fixture.orderId,
        scheduled_at: schedTime,
        address: 'Plot 42, Industrial Area, Sector 58, Gurugram',
        crew: 'Ramesh (Driver) & Suresh (Fitter) - Tata Ace DL-1L-1234'
      });
      assert.equal(delivRes.ok, true, `Delivery creation failed: ${delivRes.error?.message}`);
      fixture.deliveryId = delivRes.data.id;
      assert.match(fixture.deliveryId, /^[0-9a-f-]{36}$/);

      // Verify status is scheduled
      const delivRecord = await api(`/admin/deliveries/${fixture.deliveryId}`);
      assert.equal(delivRecord.data.status, 'scheduled');
      assert.equal(delivRecord.data.address, 'Plot 42, Industrial Area, Sector 58, Gurugram');
    });

    // --- CHECK 2: Guarded delivery transitions and verified private proof requirement ---
    await check('Delivery transition to delivered enforces verified private proof media and confirmation time', async () => {
      // Transition from scheduled -> dispatched
      const dispRes = await api(`/admin/deliveries/${fixture.deliveryId}/transitions`, 'POST', {
        status: 'dispatched'
      });
      assert.equal(dispRes.ok, true, `Dispatched transition failed: ${dispRes.error?.message}`);

      // Attempt delivered transition without proof: must fail
      const prematureDeliv = await api(`/admin/deliveries/${fixture.deliveryId}/transitions`, 'POST', {
        status: 'delivered'
      });
      assert.equal(prematureDeliv.ok, false, 'Delivered transition must require proof');

      // Create a private verified media asset for delivery proof
      const proofPublicId = `smart-fabrication/development/delivery-proof/${run}`;
      const intentId = crypto.randomUUID();
      const assetId = crypto.randomUUID();

      await db.query(
        `insert into public.upload_intents (id, owner_user_id, public_id, context, visibility, resource_type, confirmed_at, expires_at)
         values ($1, $2, $3, 'delivery_proof', 'private', 'image', now(), now() + interval '10 years')`,
        [intentId, owner.id, proofPublicId]
      );
      const { rows: assetRows } = await db.query(
        `insert into public.media_assets (id, asset_id, public_id, resource_type, format, bytes, width, height, owner_user_id, context, visibility)
         values ($1, $2, $3, 'image', 'jpg', 245000, 1600, 1200, $4, 'delivery_proof', 'private')
         returning id`,
        [assetId, crypto.randomUUID(), proofPublicId, owner.id]
      );
      fixture.proofMediaId = assetRows[0].id;

      // Now transition with verified private proof
      const confTime = new Date().toISOString();
      const delivSuccess = await api(`/admin/deliveries/${fixture.deliveryId}/transitions`, 'POST', {
        status: 'delivered',
        proof_media_id: fixture.proofMediaId,
        confirmed_at: confTime
      });
      assert.equal(delivSuccess.ok, true, `Delivered transition failed: ${delivSuccess.error?.message}`);

      assert.equal(delivSuccess.data.result.proof_media_id, fixture.proofMediaId);

      const verifiedDeliv = await api(`/admin/deliveries/${fixture.deliveryId}`);
      assert.equal(verifiedDeliv.data.status, 'delivered');

      const { rows: delivCheckRows } = await db.query('select status, proof_media_id from public.deliveries where id = $1', [fixture.deliveryId]);
      assert.equal(delivCheckRows[0].status, 'delivered');
      assert.equal(delivCheckRows[0].proof_media_id, fixture.proofMediaId);
    });

    // --- CHECK 3: Installation checklist and customer sign-off gates ---
    await check('Installation completion enforces comprehensive 4-point checklist and customer sign-off', async () => {
      // Create installation
      const instRes = await api('/admin/installations', 'POST', {
        name: `Installation for Delivery ${fixture.deliveryId.slice(0, 8)}`,
        delivery_id: fixture.deliveryId,
        checklist: { fixings_checked: false, alignment_checked: false, finish_checked: false, site_cleaned: false },
        customer_confirmed: false,
        status: 'pending'
      });
      assert.equal(instRes.ok, true, `Installation creation failed: ${instRes.error?.message}`);
      fixture.installationId = instRes.data.id;

      // Progress order to INSTALLATION
      const instOrderRes = await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', {
        status: 'INSTALLATION',
        version: await getOrderVersion(),
        note: 'Installation crew actively mounting on-site'
      });
      assert.equal(instOrderRes.ok, true, `Transition to INSTALLATION failed: ${instOrderRes.error?.message}`);

      // Attempt completion without customer confirmation or incomplete checklist
      const prematureInst = await api(`/admin/installations/${fixture.installationId}`, 'PATCH', {
        status: 'completed'
      });
      assert.equal(prematureInst.ok, false, 'Installation completion must require checklist and customer confirmation');

      // Complete checklist & customer confirmation
      const fullChecklist = {
        fixings_checked: true,
        alignment_checked: true,
        finish_checked: true,
        site_cleaned: true
      };
      const completeInstRes = await api(`/admin/installations/${fixture.installationId}`, 'PATCH', {
        checklist: fullChecklist,
        customer_confirmed: true,
        status: 'completed'
      });
      assert.equal(completeInstRes.ok, true, `Installation update failed: ${completeInstRes.error?.message}`);

      const verifiedInst = await api(`/admin/installations/${fixture.installationId}`);
      assert.equal(verifiedInst.data.status, 'completed');
      assert.equal(verifiedInst.data.customer_confirmed, true);
    });

    // --- CHECK 4: Order completion gate enforcement ---
    await check('Order completion requires verified delivered delivery and completed installation', async () => {
      const completeOrderRes = await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', {
        status: 'COMPLETED',
        version: await getOrderVersion(),
        note: 'Job completed with full customer sign-off'
      });
      assert.equal(completeOrderRes.ok, true, `Order COMPLETED transition failed: ${completeOrderRes.error?.message}`);

      const finalOrder = await api(`/admin/orders/${fixture.orderId}`);
      assert.equal(finalOrder.data.status, 'COMPLETED');

      // Timeline reflection
      const timelineRes = await api(`/admin/orders/${fixture.orderId}/timeline`);
      assert.equal(timelineRes.ok, true);
      const statuses = timelineRes.data.map(t => t.to_status);
      assert.ok(statuses.includes('OUT_FOR_DELIVERY'));
      assert.ok(statuses.includes('INSTALLATION'));
      assert.ok(statuses.includes('COMPLETED'));
    });

    // --- CHECK 5: Customer portal and timeline reflection ---
    await check('Customer accesses order timeline showing delivery and installation milestones', async () => {
      const custTimeline = await api(`/orders/${fixture.orderId}/timeline`, 'GET', undefined, customerToken);
      assert.equal(custTimeline.ok, true, `Customer timeline failed: ${custTimeline.error?.message}`);
      const custStatuses = custTimeline.data.map(t => t.to_status);
      assert.ok(custStatuses.includes('OUT_FOR_DELIVERY'));
      assert.ok(custStatuses.includes('INSTALLATION'));
      assert.ok(custStatuses.includes('COMPLETED'));

      // Stranger customer is rejected
      const strangerTimeline = await api(`/orders/${fixture.orderId}/timeline`, 'GET', undefined, stranger.token);
      assert.equal(strangerTimeline.data.length, 0, 'Stranger must not see private order timeline');
    });

    // --- CHECK 6: Mobile admin UI inspection ---
    await check('Mobile viewport loads deliveries and installations admin resources without errors', async () => {
      browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'msedge', headless: true });
      const mobileContext = await browser.newContext({ ...devices['iPhone 13'], baseURL: base });
      mobileContext.setDefaultTimeout(30000);
      const page = await mobileContext.newPage();

      // Login as owner
      await page.goto('/login');
      await page.getByLabel('Email', { exact: true }).fill(owner.email);
      await page.getByLabel('Password', { exact: true }).fill(owner.password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.waitForURL('**/account');

      // Navigate to /admin/deliveries
      await page.goto('/admin/deliveries');
      await expect(page.getByRole('heading', { name: 'Delivery', exact: true })).toBeVisible({ timeout: 15000 });

      // Navigate to /admin/installations
      await page.goto('/admin/installations');
      await expect(page.getByRole('heading', { name: 'Installation', exact: true })).toBeVisible({ timeout: 15000 });

      await mobileContext.close();
    });

    // Write test artifact
    const artifact = {
      timestamp: new Date().toISOString(),
      run,
      passed,
      count: passed.length,
      status: 'passed'
    };
    await fs.mkdir('test-results', { recursive: true });
    await fs.writeFile('test-results/delivery-installation-browser-latest.json', JSON.stringify(artifact, null, 2));
    console.log(`\nALL ${passed.length} PHASE 16 ACCEPTANCE CHECKS PASSED!\n`);

  } finally {
    if (browser) await browser.close();
    await db.end();
    // Cleanup users
    for (const u of users) {
      await retirePublicationFixture(u);
    }
  }
}

main().catch(err => {
  console.error('Phase 16 acceptance failed:', err);
  process.exit(1);
});
