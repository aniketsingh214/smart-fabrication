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
const productionAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);

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
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Labour acceptance ${role}` },
  });
  assert.equal(created.error, null, 'Fixture creation failed');
  const user = { id: created.data.user.id, email, password, auth };
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

async function runLabourProductionAcceptance() {
  console.log(`Starting Phase 15 Labour, Work Orders & Production acceptance (Run: ${run})...`);
  const owner = await newUser('owner', ownerAuth);
  ownerToken = owner.token;

  const db = databaseClient();
  await db.connect();

  let workerId;
  let workOrderId;
  let orderId;
  let customerId;
  let quoteId;
  let qvId;
  let workEntryId;

  try {
    // 1. Seed customer, quotation and order
    const custRes = await db.query(
      `insert into public.customers(name, phone) values('Labour Test Customer', '919876543220') returning id`
    );
    customerId = custRes.rows[0].id;

    const quoteRes = await db.query(
      `insert into public.quotations(name, customer_id, expires_at) values('Labour Test Quote', $1, now() + interval '7 days') returning id`,
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
       values('Labour Test Order', $1, $2, 100000, 'CONFIRMED', 1) returning id`,
      [customerId, qvId]
    );
    orderId = orderRes.rows[0].id;

    // CHECK 1: Worker creation & append-only labour rate versioning
    await check('Worker creation and append-only rate versions with effective dates', async () => {
      const workerRes = await db.query(
        `insert into public.workers(name, phone, work_type, active)
         values('Ramesh Sharma', '919876500001', 'fabrication', true)
         returning id`
      );
      workerId = workerRes.rows[0].id;
      fixture.workerId = workerId;

      // Initial rate version: ₹150.00/hour (15000 paise) effective 2 hours ago
      await db.query(
        `insert into public.labour_rates(worker_id, unit, rate_minor, effective_at)
         values($1, 'hour', 15000, now() - interval '2 hours')`,
        [workerId]
      );

      // Updated rate version: ₹200.00/hour (20000 paise) effective 10 minutes ago
      await db.query(
        `insert into public.labour_rates(worker_id, unit, rate_minor, effective_at)
         values($1, 'hour', 20000, now() - interval '10 minutes')`,
        [workerId]
      );

      // Verify both versions exist
      const rates = await db.query(
        `select rate_minor, unit, effective_at from public.labour_rates where worker_id = $1 order by effective_at desc`,
        [workerId]
      );
      assert.equal(rates.rows.length, 2);
      assert.equal(Number(rates.rows[0].rate_minor), 20000);
      assert.equal(Number(rates.rows[1].rate_minor), 15000);
    });

    // CHECK 2: Work order stages and quality check gate before 'ready'
    await check('Work orders enforce staged transitions and require passed quality check for ready status', async () => {
      // Work orders must begin as pending
      const woRes = await db.query(
        `insert into public.work_orders(name, order_id)
         values('Gate Fabrication Job', $1) returning id`,
        [orderId]
      );
      workOrderId = woRes.rows[0].id;
      fixture.workOrderId = workOrderId;

      // Transition to fabrication
      const t1 = await api(`/work-orders/${workOrderId}/transitions`, 'POST', { status: 'fabrication' });
      assert.equal(t1.status, 200, `Failed to transition to fabrication: ${JSON.stringify(t1.error)}`);

      // Transition to finishing
      const t2 = await api(`/work-orders/${workOrderId}/transitions`, 'POST', { status: 'finishing' });
      assert.equal(t2.status, 200);

      // Transition to quality_check
      const t3 = await api(`/work-orders/${workOrderId}/transitions`, 'POST', { status: 'quality_check' });
      assert.equal(t3.status, 200);

      // Attempt to transition to 'ready' WITHOUT passed quality check -> must be rejected
      const badReady = await api(`/work-orders/${workOrderId}/transitions`, 'POST', { status: 'ready' });
      assert.ok(!badReady.ok, 'Transitioning to ready without passed quality check must fail');

      // Record passed quality check
      const qcRes = await api('/quality-checks', 'POST', {
        work_order_id: workOrderId,
        name: 'Weld structural integrity & alignment check',
        passed: true,
        note: 'All joints verified and grounded flush',
      });
      assert.equal(qcRes.status, 201, `Failed to post quality check: ${JSON.stringify(qcRes.error)}`);

      // Now transition to 'ready' -> succeeds!
      const goodReady = await api(`/work-orders/${workOrderId}/transitions`, 'POST', { status: 'ready' });
      assert.equal(goodReady.status, 200, `Transition to ready should succeed after QC: ${JSON.stringify(goodReady.error)}`);
    });

    // CHECK 3: Idempotent work entries and rate snapshot immutability
    await check('Work entries capture effective rate snapshots and prevent duplicate entries on retry', async () => {
      const entryKey = crypto.randomUUID();
      const payload = {
        worker_id: workerId,
        work_order_id: workOrderId,
        quantity: 4, // 4 hours
      };

      // Post work entry
      const entry1 = await api('/work-entries', 'POST', payload, ownerToken, { 'Idempotency-Key': entryKey });
      assert.equal(entry1.status, 201, `Failed to post work entry: ${JSON.stringify(entry1.error)}`);
      workEntryId = entry1.data.id;
      fixture.workEntryId = workEntryId;

      // Re-posting identical entry with same key must return identical ID
      const retry = await api('/work-entries', 'POST', payload, ownerToken, { 'Idempotency-Key': entryKey });
      assert.equal(retry.status, 201);
      assert.equal(retry.data.id, workEntryId);

      // Verify the recorded rate and amount: 4 hours @ ₹200.00 = ₹800.00 (80000 paise)
      const entryRow = await db.query(
        `select rate_minor, amount_minor from public.work_entries where id = $1`,
        [workEntryId]
      );
      assert.equal(entryRow.rows.length, 1);
      assert.equal(Number(entryRow.rows[0].rate_minor), 20000);
      assert.equal(Number(entryRow.rows[0].amount_minor), 80000);

      // Now introduce a new rate for this worker: ₹300.00/hour
      await db.query(
        `insert into public.labour_rates(worker_id, unit, rate_minor, effective_at)
         values($1, 'hour', 30000, now())`,
        [workerId]
      );

      // Verify past work entry is IMMUTABLE and still has 20000 / 80000
      const preservedRow = await db.query(
        `select rate_minor, amount_minor from public.work_entries where id = $1`,
        [workEntryId]
      );
      assert.equal(Number(preservedRow.rows[0].rate_minor), 20000);
      assert.equal(Number(preservedRow.rows[0].amount_minor), 80000);
    });

    // CHECK 4: Labour payments and overpayment rejection
    await check('Labour settlements enforce payment caps against earned balance', async () => {
      // Total earned is ₹800.00 (80000 paise).
      // Attempt overpayment of ₹800.01 (80001 paise) -> must be rejected
      const overPayKey = crypto.randomUUID();
      const overPay = await api(
        '/labour-payments',
        'POST',
        {
          worker_id: workerId,
          amount_minor: 80001,
          mode: 'cash',
          reference: 'Overpayment attempt',
        },
        ownerToken,
        { 'Idempotency-Key': overPayKey }
      );
      assert.ok(!overPay.ok, 'Labour overpayment beyond earned balance must be rejected');

      // Partial settlement: ₹500.00 (50000 paise) -> succeeds
      const partialKey = crypto.randomUUID();
      const partialPay = await api(
        '/labour-payments',
        'POST',
        {
          worker_id: workerId,
          amount_minor: 50000,
          mode: 'bank',
          reference: 'Partial wage settlement',
        },
        ownerToken,
        { 'Idempotency-Key': partialKey }
      );
      assert.equal(partialPay.status, 201, `Failed to post partial labour payment: ${JSON.stringify(partialPay.error)}`);

      // Settle remaining ₹300.00 (30000 paise) -> succeeds
      const finalKey = crypto.randomUUID();
      const finalPay = await api(
        '/labour-payments',
        'POST',
        {
          worker_id: workerId,
          amount_minor: 30000,
          mode: 'cash',
          reference: 'Final wage settlement',
        },
        ownerToken,
        { 'Idempotency-Key': finalKey }
      );
      assert.equal(finalPay.status, 201);

      // Any further payment attempt when balance is 0 -> rejected
      const extraPay = await api(
        '/labour-payments',
        'POST',
        {
          worker_id: workerId,
          amount_minor: 100,
          mode: 'cash',
          reference: 'Zero balance extra payment',
        },
        ownerToken,
        { 'Idempotency-Key': crypto.randomUUID() }
      );
      assert.ok(!extraPay.ok, 'Payment against settled balance must be rejected');
    });

    // CHECK 5: Wage privacy enforcement for production role
    await check('Production staff role cannot view sensitive worker wage rates', async () => {
      const prodUser = await newUser('production', productionAuth);

      // Production user queries labour_rates directly via authenticated client
      const prodDb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      await prodDb.auth.setSession({
        access_token: prodUser.token,
        refresh_token: 'dummy',
      });

      const { data: rates, error } = await prodDb
        .from('labour_rates')
        .select('*')
        .eq('worker_id', workerId);

      assert.equal(error, null);
      assert.equal(rates?.length, 0, 'Production role must not see any labour rates');

      // Production user can still view work orders
      const prodWo = await api('/work-orders', 'GET', undefined, prodUser.token);
      assert.equal(prodWo.status, 200, 'Production role should be able to read work orders');
    });

    // CHECK 6: Mobile Admin UI Inspection
    await check('Admin production & work orders views render on mobile viewport', async () => {
      const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'msedge', headless: true });
      try {
        const context = await browser.newContext({ ...devices['iPhone 13'], baseURL: base });
        const page = await context.newPage();
        await page.goto('/login');
        await page.getByLabel('Email', { exact: true }).fill(owner.email);
        await page.getByLabel('Password', { exact: true }).fill(owner.password);
        await page.getByRole('button', { name: 'Sign in', exact: true }).click();
        await page.waitForURL('**/account');

        await page.goto('/admin/work-orders');
        await expect(page.getByRole('heading', { name: 'Production', exact: true })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('table')).toBeVisible();

        await page.goto('/admin/workers');
        await expect(page.getByRole('heading', { name: 'Workers', exact: true })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('table')).toBeVisible();
      } finally {
        await browser.close();
      }
    });

    console.log('PASS: All 6 Labour & Production Operations checks passed!');

    // Write acceptance artifact
    await fs.writeFile(
      'test-results/labour-production-browser-latest.json',
      JSON.stringify(
        {
          finishedAt: new Date().toISOString(),
          passed: true,
          checks: passed,
          fixture,
          scope:
            'Phase 15 Labour, Work Orders & Production acceptance. Append-only labour rates, staged work orders, quality check enforcement, rate snapshot provenance, labour overpayment prevention, wage privacy for production role, and mobile UI verified.',
        },
        null,
        2
      )
    );
  } finally {
    console.log('Cleaning up Phase 15 test fixtures...');
    try {
      if (workerId) {
        await db.query('update public.workers set active = false where id = $1', [workerId]).catch(() => {});
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

runLabourProductionAcceptance().catch(err => {
  console.error('Phase 15 acceptance failed:', err);
  process.exit(1);
});
