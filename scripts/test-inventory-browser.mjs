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

const run = crypto.randomUUID();
const fixture = { run };
const users = [];
const passed = [];
let ownerToken;

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
  const email = `sf-publication-${role}-${run}@example.invalid`;
  const password = crypto.randomBytes(32).toString('base64url');
  console.log(`Creating auth user: ${email}...`);
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Inventory acceptance ${role}` },
  });
  assert.equal(created.error, null, 'Fixture creation failed');
  const user = { id: created.data.user.id, email, password, auth };
  users.push(user);

  console.log('Inserting user_roles...');
  const db = databaseClient();
  try {
    await db.connect();
    await db.query('insert into public.user_roles(user_id, role_id) values($1, $2) on conflict do nothing', [user.id, role]);
  } finally {
    await db.end();
  }

  console.log('Signing in fixture user...');
  const login = await auth.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null, 'Fixture login failed');
  return { ...user, token: login.data.session.access_token };
}

async function runInventoryAcceptance() {
  console.log(`Starting Phase 14 Inventory & Stock Control acceptance (Run: ${run})...`);
  const owner = await newUser('owner', ownerAuth);
  ownerToken = owner.token;
  console.log('Owner signed in successfully.');

  const db = databaseClient();
  await db.connect();

  let materialId;
  let customerId;
  let quoteId;
  let qvId;
  let orderId;
  let workOrderId;
  let reservationId;
  let initialMovementId;

  try {
    // 1. Seed test material
    const matCode = `MAT-INV-${run.slice(0, 8)}`;
    const matRes = await db.query(
      `insert into public.materials(name, code, type, size, thickness_mm, unit, weight_kg_per_unit, active)
       values($1, $2, 'square_pipe', '50x50mm', 2.0, 'kg', 12.5, true)
       returning id`,
      [`Inventory Test Pipe ${run.slice(0, 6)}`, matCode]
    );
    materialId = matRes.rows[0].id;
    fixture.materialId = materialId;

    // 2. Seed test customer, quotation, order & work order for consumption and reservation tests
    const custRes = await db.query(
      `insert into public.customers(name, phone) values('Inventory Test Customer', '919876543210') returning id`
    );
    customerId = custRes.rows[0].id;

    const quoteRes = await db.query(
      `insert into public.quotations(name, customer_id, expires_at) values('Inventory Test Quote', $1, now() + interval '7 days') returning id`,
      [customerId]
    );
    quoteId = quoteRes.rows[0].id;

    const qvRes = await db.query(
      `insert into public.quotation_versions(quotation_id, version, total_minor, snapshot)
       values($1, 1, 100000, '{"items":[]}') returning id`,
      [quoteId]
    );
    qvId = qvRes.rows[0].id;

    const orderRes = await db.query(
      `insert into public.orders(name, customer_id, quotation_version_id, total_minor, status, version)
       values('Inventory Test Order', $1, $2, 100000, 'CONFIRMED', 1) returning id`,
      [customerId, qvId]
    );
    orderId = orderRes.rows[0].id;

    const woRes = await db.query(
      `insert into public.work_orders(name, order_id)
       values('Inventory Test Job', $1) returning id`,
      [orderId]
    );
    workOrderId = woRes.rows[0].id;
    fixture.workOrderId = workOrderId;
    await db.query(`update public.work_orders set status = 'fabrication' where id = $1`, [workOrderId]);

    // CHECK 1: Stock adjustment & inventory balances reconciliation
    await check('Stock adjustment records in movement ledger and reconciles inventory balances', async () => {
      const key = crypto.randomUUID();
      const payload = {
        material_id: materialId,
        quantity: 20,
        unit_cost_minor: 5000, // ₹50.00
        kind: 'adjustment',
        note: `Initial stock receipt ${run.slice(0, 6)}`,
      };

      const res = await api('/inventory/adjustments', 'POST', payload, ownerToken, { 'Idempotency-Key': key });
      assert.equal(res.status, 201, `Failed to post stock adjustment: ${JSON.stringify(res.error)}`);
      assert.ok(res.data?.id, 'Expected movement id');
      initialMovementId = res.data.id;

      // Verify balances endpoint
      const balRes = await api('/inventory/balances', 'GET');
      assert.equal(balRes.status, 200);
      assert.ok(Array.isArray(balRes.data), 'Expected balances array');
      const row = balRes.data.find(b => b.material_id === materialId);
      assert.ok(row, 'Expected material in inventory balances');
      assert.equal(Number(row.on_hand), 20);
      assert.equal(Number(row.reserved), 0);
      assert.equal(Number(row.available), 20);
    });

    // CHECK 2: Idempotent stock movement & conflicting key rejection
    await check('Stock movement is idempotent on exact retry and rejects conflicting payload', async () => {
      const key = crypto.randomUUID();
      const payload = {
        material_id: materialId,
        quantity: 10,
        unit_cost_minor: 5000,
        kind: 'adjustment',
        note: `Idempotency test movement ${run.slice(0, 6)}`,
      };

      // First post
      const first = await api('/inventory/adjustments', 'POST', payload, ownerToken, { 'Idempotency-Key': key });
      assert.equal(first.status, 201);
      const movementId = first.data.id;

      // Re-post identical payload with same key
      const retry = await api('/inventory/adjustments', 'POST', payload, ownerToken, { 'Idempotency-Key': key });
      assert.equal(retry.status, 201);
      assert.equal(retry.data.id, movementId, 'Expected identical movement ID returned');

      // Conflicting payload with same key must be rejected
      const conflicting = await api(
        '/inventory/adjustments',
        'POST',
        { ...payload, quantity: 99 },
        ownerToken,
        { 'Idempotency-Key': key }
      );
      assert.ok(conflicting.status === 409 || conflicting.status === 422 || conflicting.status === 500, 'Conflicting idempotency key must be rejected');

      // Verify on-hand is 30 (20 + 10), not 40
      const bal = await api('/inventory/balances', 'GET');
      const row = bal.data.find(b => b.material_id === materialId);
      assert.equal(Number(row.on_hand), 30);
      assert.equal(Number(row.available), 30);
    });

    // CHECK 3: Negative stock prevention and stock reservation bounds
    await check('Negative stock is rejected and stock reservations reduce available quantity', async () => {
      // 1. Attempt negative stock adjustment exceeding current stock (30 on hand, try -35)
      const negKey = crypto.randomUUID();
      const negRes = await api(
        '/inventory/adjustments',
        'POST',
        {
          material_id: materialId,
          quantity: -35,
          unit_cost_minor: 5000,
          kind: 'adjustment',
          note: 'Invalid excessive negative stock',
        },
        ownerToken,
        { 'Idempotency-Key': negKey }
      );
      assert.ok(!negRes.ok, 'Negative stock exceeding on-hand must be rejected');

      // 2. Reserve stock for work order
      const resPayload = {
        material_id: materialId,
        work_order_id: workOrderId,
        quantity: 12,
      };
      const reserveRes = await api('/stock-reservations', 'POST', resPayload, ownerToken);
      assert.equal(reserveRes.status, 201, `Failed to reserve stock: ${JSON.stringify(reserveRes.error)}`);
      assert.ok(reserveRes.data?.id, 'Expected reservation ID');
      reservationId = reserveRes.data.id;
      fixture.reservationId = reservationId;

      // Check balances: on_hand=30, reserved=12, available=18
      const balRes = await api('/inventory/balances', 'GET');
      const row = balRes.data.find(b => b.material_id === materialId);
      assert.equal(Number(row.on_hand), 30);
      assert.equal(Number(row.reserved), 12);
      assert.equal(Number(row.available), 18);

      // 3. Attempt adjustment that attempts to reduce on_hand below reserved (e.g. deduct -20 when available is 18)
      const overKey = crypto.randomUUID();
      const overRes = await api(
        '/inventory/adjustments',
        'POST',
        {
          material_id: materialId,
          quantity: -20,
          unit_cost_minor: 5000,
          kind: 'adjustment',
          note: 'Attempt to deduct into reserved stock',
        },
        ownerToken,
        { 'Idempotency-Key': overKey }
      );
      assert.ok(!overRes.ok, 'Deducting reserved stock via adjustment must be rejected');
    });

    // CHECK 4: Server-derived valuation on job consumption
    await check('Job consumption derives cost from movement ledger rather than client input', async () => {
      const consumeKey = crypto.randomUUID();
      const consumePayload = {
        material_id: materialId,
        quantity: -4,
        unit_cost_minor: 1, // Client sends spoofed ₹0.01
        kind: 'consumption',
        work_order_id: workOrderId,
        note: `Job partial consumption ${run.slice(0, 6)}`,
      };

      const consumeRes = await api('/inventory/adjustments', 'POST', consumePayload, ownerToken, { 'Idempotency-Key': consumeKey });
      assert.equal(consumeRes.status, 201, `Failed to post consumption: ${JSON.stringify(consumeRes.error)}`);
      const consumeMovementId = consumeRes.data.id;

      // Verify the recorded movement in DB has derived unit_cost_minor = 5000, NOT 1
      const mvRow = await db.query(
        'select unit_cost_minor, kind, work_order_id from public.stock_movements where id = $1',
        [consumeMovementId]
      );
      assert.equal(mvRow.rows.length, 1);
      assert.equal(Number(mvRow.rows[0].unit_cost_minor), 5000, 'Expected ledger-derived unit cost (5000), not spoofed client cost (1)');
      assert.equal(mvRow.rows[0].kind, 'consumption');
      assert.equal(mvRow.rows[0].work_order_id, workOrderId);

      // Check balances: on_hand=26 (30 - 4), reserved=8 (12 - 4), available=18
      const balRes = await api('/inventory/balances', 'GET');
      const row = balRes.data.find(b => b.material_id === materialId);
      assert.equal(Number(row.on_hand), 26);
      assert.equal(Number(row.reserved), 8);
      assert.equal(Number(row.available), 18);
    });

    // CHECK 5: Reservation release preserves on-hand and restores available
    await check('Reservation release is idempotent and restores available stock to on-hand', async () => {
      // Release remaining 8 units of reservation
      const releaseRes = await api(
        `/stock-reservations/${reservationId}/release`,
        'POST',
        { reason: 'Job finished with leftover material' },
        ownerToken
      );
      assert.equal(releaseRes.status, 200, `Failed to release reservation: ${JSON.stringify(releaseRes.error)}`);

      // Balances: on_hand=26, reserved=0, available=26
      const balRes = await api('/inventory/balances', 'GET');
      const row = balRes.data.find(b => b.material_id === materialId);
      assert.equal(Number(row.on_hand), 26);
      assert.equal(Number(row.reserved), 0);
      assert.equal(Number(row.available), 26);

      // Idempotent re-release
      const retryRelease = await api(
        `/stock-reservations/${reservationId}/release`,
        'POST',
        { reason: 'Job finished with leftover material' },
        ownerToken
      );
      assert.equal(retryRelease.status, 200);
    });

    // CHECK 6: Inventory Admin UI renders accurately
    await check('Admin inventory dashboard renders balance table and operational stock form', async () => {
      const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'msedge', headless: true });
      try {
        const context = await browser.newContext({ ...devices['iPhone 13'], baseURL: base });
        const page = await context.newPage();
        await page.goto('/login');
        await page.getByLabel('Email', { exact: true }).fill(owner.email);
        await page.getByLabel('Password', { exact: true }).fill(owner.password);
        await page.getByRole('button', { name: 'Sign in', exact: true }).click();
        await page.waitForURL('**/account');

        await page.goto('/admin/inventory');
        await expect(page.getByRole('heading', { name: 'Inventory control' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Post a stock movement' })).toBeVisible();
      } finally {
        await browser.close();
      }
    });

    console.log('PASS: All 6 Inventory & Stock Control checks passed!');

    // Write acceptance artifact
    await fs.writeFile(
      'test-results/inventory-browser-latest.json',
      JSON.stringify(
        {
          finishedAt: new Date().toISOString(),
          passed: true,
          checks: passed,
          fixture,
          scope:
            'Phase 14 Inventory & Stock Control acceptance. Balances ledger reconciliation, idempotent movements, negative stock prevention, reservation bounds, server-authoritative consumption costing, and reservation release verified.',
        },
        null,
        2
      )
    );
  } finally {
    console.log('Cleaning up Phase 14 test fixtures...');
    try {
      if (reservationId) {
        await db.query('delete from public.stock_reservations where id = $1', [reservationId]).catch(() => {});
      }
      if (materialId) {
        await db.query('update public.materials set active = false where id = $1', [materialId]).catch(() => {});
      }
    } catch (err) {
      console.warn('DB cleanup warning:', err.message);
    }
    await db.end();

    for (const u of users) {
      await retirePublicationFixture({ ...u, admin });
    }
  }
}

runInventoryAcceptance().catch(err => {
  console.error('Phase 14 acceptance failed:', err);
  process.exit(1);
});
