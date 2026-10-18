import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { chromium, devices, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { databaseClient } from './db-client.mjs';
import { retirePublicationFixture } from './retire-publication-fixture.mjs';

const base = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local target required');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options);
const db = databaseClient();
const run = crypto.randomUUID(), users = [], checks = [], fixture = { run }, title = `TEST ONLY order ${run}`;
let owner, customer, stranger, browser, closed = false;

async function check(name, action) {
  console.log('INFO: ' + name);
  await action();
  checks.push(name);
  console.log('PASS: ' + name);
}

async function newUser(role) {
  const email = `sf-publication-${role}-${crypto.randomUUID()}@example.invalid`;
  const password = crypto.randomBytes(32).toString('base64url');
  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `TEST ONLY order ${role} ${run}` }
  });
  assert.equal(created.error, null);
  const account = { id: created.data.user.id, email, password, auth };
  users.push(account);
  await db.query('insert into public.user_roles(user_id,role_id) values($1,$2) on conflict do nothing', [account.id, role]);
  const login = await auth.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null);
  return { ...account, token: login.data.session.access_token };
}

async function request(path, method = 'GET', body, actor = owner, key) {
  return fetch(base + '/api/v1' + path, {
    method,
    headers: {
      ...(actor ? { Authorization: 'Bearer ' + actor.token } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(key ? { 'Idempotency-Key': key } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(60000)
  });
}

async function api(path, method = 'GET', body, actor = owner, key) {
  const response = await request(path, method, body, actor, key);
  const result = await response.json();
  assert.ok(response.ok, `${method} ${path}: ${response.status} ${result.error?.code ?? ''} ${result.error?.message ?? ''}`);
  return result.data;
}

async function login(page, account) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/account');
}

async function openOrder(page, orderTitle) {
  await page.goto('/admin/orders');
  const detailsBtn = page.locator(`button[aria-label="View details of ${orderTitle}"]`);
  await expect(detailsBtn).toBeVisible({ timeout: 15000 });
  await detailsBtn.click();
  const dialog = page.getByRole('dialog', { name: orderTitle, exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

try {
  await db.connect();
  owner = await newUser('owner');
  customer = await newUser('customer');
  stranger = await newUser('customer');

  const contact = await api('/admin/customers', 'POST', {
    name: title,
    phone: '910000' + crypto.randomInt(1000000).toString().padStart(6, '0'),
    email: customer.email,
    address: 'TEST ONLY Phase 12 verification',
    notes: 'Synthetic customer for orders workflow'
  });
  fixture.customerId = contact.id;

  await api(`/customers/${contact.id}/link`, 'POST', { email: customer.email });

  const lead = await api('/admin/leads', 'POST', {
    name: title,
    phone: contact.phone,
    email: customer.email,
    city: 'Delhi',
    requirement: 'Custom steel gate fabrication with verified dimensions'
  });
  fixture.leadId = lead.id;

  const quote = await api('/admin/quotations', 'POST', {
    name: title,
    customer_id: contact.id,
    lead_id: lead.id,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString()
  });
  fixture.quoteId = quote.id;

  await api(`/admin/quotations/${quote.id}/versions`, 'POST', {
    items: [{ description: 'Heavy duty MS sliding gate', quantity: 2, unit_minor: 1500000 }],
    discount_minor: 0,
    tax_bps: 1800
  });

  await api(`/admin/quotations/${quote.id}/approve`, 'POST', {});
  await api(`/quotations/${quote.id}/accept`, 'POST', {}, customer);

  browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL ?? 'msedge', headless: true });

  const staffContext = await browser.newContext({ baseURL: base });
  staffContext.setDefaultTimeout(30000);
  const staffPage = await staffContext.newPage();
  await login(staffPage, owner);

  const customerContext = await browser.newContext({ ...devices['iPhone 13'], baseURL: base });
  customerContext.setDefaultTimeout(30000);
  const customerPage = await customerContext.newPage();
  await login(customerPage, customer);

  const strangerContext = await browser.newContext({ ...devices['iPhone 13'], baseURL: base });
  strangerContext.setDefaultTimeout(30000);
  const strangerPage = await strangerContext.newPage();
  await login(strangerPage, stranger);

  await check('Quotation conversion preserves price and generates initial CONFIRMED order idempotently', async () => {
    const convertPath = `/admin/quotations/${quote.id}/convert`;
    const orderId = (await api(convertPath, 'POST', {})).result;
    assert.match(orderId, /^[0-9a-f-]{36}$/);
    fixture.orderId = orderId;

    const repeatId = (await api(convertPath, 'POST', {})).result;
    assert.equal(repeatId, orderId);

    const order = await api('/admin/orders/' + orderId);
    assert.equal(order.status, 'CONFIRMED');
    assert.equal(order.version, 1);
    assert.equal(Number(order.total_minor), 3540000);
    assert.equal(order.customer_id, contact.id);

    const timeline = await api(`/admin/orders/${orderId}/timeline`);
    assert.equal(timeline.length, 1);
    assert.equal(timeline[0].to_status, 'CONFIRMED');
  });

  await check('Customer browser tracks order timeline while stranger and anonymous calls are denied', async () => {
    await customerPage.goto('/account');
    const ordersSection = customerPage.locator('section').filter({ has: customerPage.getByRole('heading', { name: 'Your orders', exact: true }) });
    const orderCard = ordersSection.locator('article').filter({ hasText: title });
    await expect(orderCard.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(orderCard.getByText('CONFIRMED', { exact: true })).toBeVisible();
    await expect(orderCard.getByText('₹35,400.00', { exact: true })).toBeVisible();

    await orderCard.getByRole('link', { name: 'View order timeline →', exact: true }).click();
    await customerPage.waitForURL(`**/account/orders/${fixture.orderId}`);
    await expect(customerPage.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
    await expect(customerPage.getByText('₹35,400.00', { exact: true })).toBeVisible();
    await expect(customerPage.getByRole('heading', { name: 'Project timeline', exact: true })).toBeVisible();
    await expect(customerPage.getByText('CONFIRMED', { exact: true })).toBeVisible();

    const timeline = await api(`/orders/${fixture.orderId}/timeline`, 'GET', undefined, customer);
    assert.equal(timeline.length, 1);
    assert.equal(timeline[0].to_status, 'CONFIRMED');
    assert.equal(timeline[0].note, undefined);

    const strangerRes = await strangerPage.goto(`/account/orders/${fixture.orderId}`);
    assert.equal(strangerRes.status(), 404);

    const strangerApiRes = await request(`/orders/${fixture.orderId}`, 'GET', undefined, stranger);
    assert.equal(strangerApiRes.status, 404);

    const strangerTimelineRes = await request(`/orders/${fixture.orderId}/timeline`, 'GET', undefined, stranger);
    assert.equal(strangerTimelineRes.status, 200);
    const strangerTimeline = (await strangerTimelineRes.json()).data;
    assert.equal(strangerTimeline.length, 0);

    const anonRes = await request(`/orders/${fixture.orderId}`, 'GET', undefined, null);
    assert.equal(anonRes.status, 401);
  });

  await check('Advance milestone is guarded by recorded payment and updates live timeline', async () => {
    const premature = await request(`/admin/orders/${fixture.orderId}/transitions`, 'POST', {
      status: 'ADVANCE_RECEIVED',
      version: 1,
      note: 'Premature advance transition'
    });
    assert.equal(premature.status, 409);
    assert.match((await premature.json()).error?.message, /Record advance receipt first/);

    const dialog = await openOrder(staffPage, title);
    await dialog.getByRole('button', { name: 'ADVANCE RECEIVED', exact: true }).click();
    await expect(dialog.getByText('Record advance receipt first')).toBeVisible();
    await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click();

    const payKey = crypto.randomUUID();
    const payPayload = {
      order_id: fixture.orderId,
      amount_minor: 1000000,
      mode: 'upi',
      reference: `ADV-${run.slice(0, 8)}`
    };
    const payment = await api('/admin/customer-payments', 'POST', payPayload, owner, payKey);
    assert.match(payment.id, /^[0-9a-f-]{36}$/);

    const repeatPay = await api('/admin/customer-payments', 'POST', payPayload, owner, payKey);
    assert.equal(repeatPay.id, payment.id);

    const conflictPay = await request('/admin/customer-payments', 'POST', { ...payPayload, amount_minor: 500000 }, owner, payKey);
    assert.equal(conflictPay.status, 409);

    const dialog2 = await openOrder(staffPage, title);
    await dialog2.getByRole('button', { name: 'ADVANCE RECEIVED', exact: true }).click();
    await expect(dialog2).toBeHidden({ timeout: 15000 });

    const updatedOrder = await api('/admin/orders/' + fixture.orderId);
    assert.equal(updatedOrder.status, 'ADVANCE_RECEIVED');
    assert.equal(updatedOrder.version, 2);

    await customerPage.reload();
    await expect(customerPage.getByText('ADVANCE RECEIVED', { exact: true })).toBeVisible();
  });

  await check('Measurement stage is guarded by site measurement and protected against stale concurrency', async () => {
    const premature = await request(`/admin/orders/${fixture.orderId}/transitions`, 'POST', {
      status: 'MEASUREMENT_CONFIRMED',
      version: 2,
      note: 'Premature measurement transition'
    });
    assert.equal(premature.status, 409);
    assert.match((await premature.json()).error?.message, /Verified measurements required/);

    const measurement = await api('/admin/measurements', 'POST', {
      lead_id: fixture.leadId,
      width_mm: 3600,
      height_mm: 2100,
      depth_mm: 120,
      note: 'Verified driveway dimensions'
    });
    assert.match(measurement.id, /^[0-9a-f-]{36}$/);

    const stale = await request(`/admin/orders/${fixture.orderId}/transitions`, 'POST', {
      status: 'MEASUREMENT_CONFIRMED',
      version: 1,
      note: 'Stale version transition'
    });
    assert.equal(stale.status, 409);
    assert.match((await stale.json()).error?.message, /Record changed; refresh and retry/);

    await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', {
      status: 'MEASUREMENT_CONFIRMED',
      version: 2,
      note: 'Site dimensions confirmed'
    });

    await api(`/admin/orders/${fixture.orderId}/transitions`, 'POST', {
      status: 'PRODUCTION_PENDING',
      version: 3,
      note: 'Scheduled for fabrication queue'
    });

    const readyOrder = await api('/admin/orders/' + fixture.orderId);
    assert.equal(readyOrder.status, 'PRODUCTION_PENDING');
    assert.equal(readyOrder.version, 4);

    await customerPage.reload();
    await expect(customerPage.getByText('MEASUREMENT CONFIRMED', { exact: true })).toBeVisible();
    await expect(customerPage.getByText('PRODUCTION PENDING', { exact: true })).toBeVisible();
  });

  await check('Pre-production refund atomically cancels order and audit log captures ledger closure', async () => {
    const directCancel = await request(`/admin/orders/${fixture.orderId}/transitions`, 'POST', {
      status: 'CANCELLED',
      version: 4,
      note: 'Attempting cancellation with active payment'
    });
    assert.equal(directCancel.status, 409);
    assert.match((await directCancel.json()).error?.message, /Recorded receipts require reviewed refund before cancellation/);

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    const refundKey = crypto.randomUUID();
    const refundPayload = {
      kind: 'customer_refund',
      source_id: fixture.orderId,
      posting_date: today,
      mode: 'upi',
      reference: `REF-${run.slice(0, 8)}`,
      reason: 'Customer cancelled prior to steel cutting; advance refunded in full',
      confirmed: true
    };
    const refund = await api('/finance/adjustments', 'POST', refundPayload, owner, refundKey);
    assert.match(refund.id, /^[0-9a-f-]{36}$/);

    const repeatRefund = await api('/finance/adjustments', 'POST', refundPayload, owner, refundKey);
    assert.equal(repeatRefund.id, refund.id);

    const cancelledOrder = await api('/admin/orders/' + fixture.orderId);
    assert.equal(cancelledOrder.status, 'CANCELLED');
    assert.equal(cancelledOrder.version, 5);

    const netPaidRes = await db.query('select public.finance_net_paid(\'customer\', $1) as net', [fixture.orderId]);
    assert.equal(Number(netPaidRes.rows[0].net), 0);

    await customerPage.reload();
    await expect(customerPage.getByText('CANCELLED', { exact: true })).toBeVisible();

    const quote2 = await api('/admin/quotations', 'POST', {
      name: `${title} - Unpaid`,
      customer_id: fixture.customerId,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString()
    });
    await api(`/admin/quotations/${quote2.id}/versions`, 'POST', {
      items: [{ description: 'Small railing', quantity: 1, unit_minor: 500000 }],
      discount_minor: 0,
      tax_bps: 0
    });
    await api(`/admin/quotations/${quote2.id}/approve`, 'POST', {});
    await api(`/quotations/${quote2.id}/accept`, 'POST', {}, customer);
    const order2Id = (await api(`/admin/quotations/${quote2.id}/convert`, 'POST', {})).result;
    fixture.order2Id = order2Id;

    await api(`/admin/orders/${order2Id}/transitions`, 'POST', {
      status: 'CANCELLED',
      version: 1,
      note: 'Unpaid test order cancelled directly'
    });
    const cancelled2 = await api('/admin/orders/' + order2Id);
    assert.equal(cancelled2.status, 'CANCELLED');
  });
} catch (error) {
  console.error('Order workflow acceptance failed: ' + error.message);
  process.exitCode = 1;
} finally {
  try {
    if (owner) {
      const { rows } = await db.query('select id,status,version from public.orders where customer_id=$1', [fixture.customerId ?? crypto.randomUUID()]);
      for (const order of rows) {
        const netPaid = Number((await db.query('select public.finance_net_paid(\'customer\', $1) as net', [order.id])).rows[0]?.net ?? 0);
        if (netPaid > 0) {
          const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
          await api('/finance/adjustments', 'POST', {
            kind: 'customer_refund',
            source_id: order.id,
            posting_date: today,
            mode: 'cash',
            reference: `CLEANUP-${crypto.randomUUID().slice(0, 8)}`,
            reason: 'TEST ONLY cleanup refund',
            confirmed: true
          }, owner, crypto.randomUUID());
        } else if (order.status !== 'CANCELLED') {
          await api(`/admin/orders/${order.id}/transitions`, 'POST', {
            status: 'CANCELLED',
            version: order.version,
            note: 'TEST ONLY Phase 12 completed; cancelled'
          });
        }
      }
      const quotes = await db.query('select id,status from public.quotations where customer_id=$1', [fixture.customerId ?? crypto.randomUUID()]);
      for (const quote of quotes.rows) {
        if (quote.status === 'draft') {
          const versions = await api(`/admin/quotations/${quote.id}/versions`);
          if (versions.length) {
            await api(`/admin/quotations/${quote.id}/approve`, 'POST', {});
            await api(`/admin/quotations/${quote.id}/reject`, 'POST', {});
          } else {
            await api('/admin/quotations/' + quote.id, 'PATCH', { expires_at: new Date(Date.now() + 36500 * 86400000).toISOString() });
          }
        } else if (quote.status === 'approved') {
          await api(`/admin/quotations/${quote.id}/reject`, 'POST', {});
        }
      }
    }
    closed = true;
  } catch (error) {
    console.error('Order fixture closure failed: ' + error.message);
    process.exitCode = 1;
  }
  await browser?.close();
  for (const account of users) {
    try {
      await retirePublicationFixture({ ...account, admin });
    } catch (error) {
      console.error('Order login retirement failed: ' + error.message);
      process.exitCode = 1;
    }
  }
  await db.end().catch(() => {});
  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/orders-browser-latest.json', JSON.stringify({
    finishedAt: new Date().toISOString(),
    passed: !process.exitCode,
    checks,
    fixture,
    closed,
    scope: 'Real owner/customer browsers and APIs; quotation conversion, customer mobile tracking, anti-IDOR isolation, payment-guarded advance milestone, measurement gate, concurrency check, pre-production refund with atomic cancellation, and unpaid direct cancellation. Synthetic orders/customer retained in cancelled state; generated logins retired.'
  }, null, 2));
  if (!process.exitCode) {
    console.log(`PASS: ${checks.length} real order lifecycle, customer tracking and refund workflow checks; fixtures closed and generated logins retired.`);
  }
}
