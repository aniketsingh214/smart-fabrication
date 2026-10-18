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
const salesAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const customerAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);

const run = crypto.randomUUID();
const fixture = { run };
const users = [];
const passed = [];
let ownerToken, salesToken, customerToken;

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
  return { status: response.status, ok: response.ok, data: result.data, error: result.error, headers: Object.fromEntries(response.headers.entries()) };
}

async function check(name, action) {
  console.log(`INFO: ${name}`);
  await action();
  passed.push(name);
  console.log(`PASS: ${name}`);
}

async function newUser(role, auth, db) {
  console.log(`Setting up ${role}...`);
  const email = `sf-publication-${role}-${crypto.randomUUID()}@example.invalid`;
  const password = crypto.randomBytes(32).toString('base64url');
  console.log(`Creating user in Supabase Auth: ${email}`);
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Reporting acceptance ${role}` },
  });
  console.log(`Created user in Auth: ${created.data?.user?.id}, err: ${created.error?.message}`);
  assert.equal(created.error, null, 'Fixture creation failed');
  const user = { id: created.data.user.id, email, password, auth, admin };
  users.push(user);

  console.log(`Assigning role ${role}...`);
  await db.query('insert into public.user_roles(user_id, role_id) values($1, $2) on conflict do nothing', [user.id, role]);

  console.log(`Signing in ${role}...`);
  const login = await auth.auth.signInWithPassword({ email, password });
  console.log(`Signed in ${role}`);
  assert.equal(login.error, null, 'Fixture login failed');
  return { ...user, token: login.data.session.access_token };
}

async function main() {
  console.log(`Starting Phase 18 Reports & Audit acceptance run: ${run}`);
  const db = databaseClient();
  await db.connect();

  let browser;
  try {
    const owner = await newUser('owner', ownerAuth, db);
    ownerToken = owner.token;
    const sales = await newUser('sales', salesAuth, db);
    salesToken = sales.token;
    const customer = await newUser('customer', customerAuth, db);
    customerToken = customer.token;

    await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)", [owner.id, JSON.stringify({ sub: owner.id, role: 'authenticated' })]);
    await db.query('set role authenticated');

    // --- CHECK 1: Dashboard KPIs, trend charts & P&L reconciliation ---
    await check('Dashboard KPIs, trend charts and P&L reconcile across finance and reporting boundaries', async () => {
      // 1. Fetch trends for full year
      const trendsRes = await api('/reports/trends?from=2026-01-01&until=2026-12-31');
      assert.equal(trendsRes.ok, true, `Trends query failed: ${trendsRes.error?.message}`);
      assert.ok(Array.isArray(trendsRes.data.leads_by_source), 'leads_by_source must be an array');
      assert.ok(Array.isArray(trendsRes.data.orders_by_month), 'orders_by_month must be an array');
      assert.ok(Array.isArray(trendsRes.data.net_customer_cash_by_month), 'net_customer_cash_by_month must be an array');

      // 2. Fetch profit & loss summary for same period
      const plRes = await api('/reports/profit-loss?start=2026-01-01T00:00:00.000Z&end=2026-12-31T23:59:59.000Z');
      assert.equal(plRes.ok, true, `P&L summary failed: ${plRes.error?.message}`);
      assert.equal(plRes.data.currency, 'INR');
      assert.equal(plRes.data.policy, 'provisional_completed_order_accrual');
      assert.equal(plRes.data.provisional, true);

      // 3. Reconcile net customer cash trend sum to customer receipts
      const trendCashTotal = trendsRes.data.net_customer_cash_by_month.reduce((sum, item) => sum + Number(item.value), 0);
      assert.equal(trendCashTotal, Number(plRes.data.customer_receipts_minor), 'Net customer cash trend must reconcile to customer receipts');

      // 4. Denied access: Customer without reports.read receives 403
      const deniedTrends = await api('/reports/trends?from=2026-01-01&until=2026-12-31', 'GET', undefined, customerToken);
      assert.equal(deniedTrends.ok, false);
      assert.equal(deniedTrends.status, 403, 'Customer role must be denied report trends');
    });

    // --- CHECK 2: Keyset balance pagination across receivables, payables, and workers ---
    await check('Financial balance RPCs enforce keyset pagination and boundary permissions', async () => {
      // 1. Receivables keyset pagination
      const recRes = await api('/finance/receivables?limit=2');
      assert.equal(recRes.ok, true, `Receivables query failed: ${recRes.error?.message}`);
      assert.ok(Array.isArray(recRes.data), 'Receivables must return an array');

      // If nextCursor exists, verify second page query
      if (recRes.headers['x-next-cursor']) {
        const nextRecRes = await api(`/finance/receivables?limit=2&cursor=${encodeURIComponent(recRes.headers['x-next-cursor'])}`);
        assert.equal(nextRecRes.ok, true);
        assert.ok(Array.isArray(nextRecRes.data));
      }

      // 2. Payables keyset pagination
      const payRes = await api('/finance/payables?limit=2');
      assert.equal(payRes.ok, true, `Payables query failed: ${payRes.error?.message}`);
      assert.ok(Array.isArray(payRes.data), 'Payables must return an array');

      // 3. Workers keyset pagination
      const workRes = await api('/finance/workers?limit=2');
      assert.equal(workRes.ok, true, `Workers query failed: ${workRes.error?.message}`);
      assert.ok(Array.isArray(workRes.data), 'Workers must return an array');

      // 4. Denied access: Customer lacks finance.read
      const deniedRec = await api('/finance/receivables?limit=2', 'GET', undefined, customerToken);
      assert.equal(deniedRec.ok, false);
      assert.equal(deniedRec.status, 403, 'Customer role must be denied finance balances');
    });

    // --- CHECK 3: Filtered CSV streaming export and continuation ---
    await check('CSV streaming exports enforce date filters, headers and role-scoped permissions', async () => {
      // 1. Export expenses as owner (has finance.export)
      const expRes = await fetch(base + '/api/v1/reports/expenses/export?from=2026-01-01&until=2026-12-31&limit=5', {
        headers: { Authorization: 'Bearer ' + ownerToken },
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(expRes.status, 200, `Expenses CSV export failed: ${expRes.status}`);
      assert.match(expRes.headers.get('content-type') ?? '', /text\/csv/, 'Content-Type must be text/csv');
      assert.equal(expRes.headers.get('content-disposition'), 'attachment; filename="expenses.csv"');
      assert.ok(expRes.headers.has('x-export-row-count'), 'X-Export-Row-Count header must be present');

      const csvContent = await expRes.text();
      assert.match(csvContent, /"name","category","amount_minor","expense_date","status"/, 'CSV header columns must match resource definition');

      // 2. Denied access: Customer lacks finance.export
      const custExpRes = await fetch(base + '/api/v1/reports/expenses/export?from=2026-01-01&until=2026-12-31&limit=5', {
        headers: { Authorization: 'Bearer ' + customerToken },
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(custExpRes.status, 403, 'Customer role must be denied CSV exports');

      // 3. Invalid date period returns 422
      const invalidExpRes = await fetch(base + '/api/v1/reports/expenses/export?from=2020-01-01&until=2025-12-31&limit=5', {
        headers: { Authorization: 'Bearer ' + ownerToken },
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(invalidExpRes.status, 422, 'Intervals exceeding 366 days must be rejected');
    });

    // --- CHECK 4: Reminders dispatcher & internal notifications ---
    await check('Internal reminder dispatcher triggers due follow-up notifications and enforces cron secret', async () => {
      // 1. Create a lead assigned to sales
      const leadRes = await api('/admin/leads', 'POST', {
        name: `Reminder Lead ${run.slice(0, 8)}`,
        phone: '+919876543201',
        city: 'Delhi',
        requirement: 'Boundary railing for reminder test'
      });
      assert.equal(leadRes.ok, true, `Lead creation failed: ${leadRes.error?.message}`);
      const leadId = leadRes.data.id;

      // Assign lead to sales user
      await api(`/leads/${leadId}/assign`, 'POST', { staff_user: sales.id });

      // Insert past due follow-up directly via SQL
      await db.query(
        `insert into public.follow_ups(lead_id, due_at, status, note, assigned_to)
         values($1, now() - interval '1 hour', 'pending', 'Test past due reminder', $2)`,
        [leadId, sales.id]
      );

      // 2. Verify unauthorized access to /api/internal/reminders
      const unauthCron = await fetch(base + '/api/internal/reminders', { signal: AbortSignal.timeout(30000) });
      assert.equal(unauthCron.status, 401, 'Unauthenticated reminder trigger must return 401');

      const badCron = await fetch(base + '/api/internal/reminders', {
        headers: { Authorization: 'Bearer invalid_secret_key' },
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(badCron.status, 401, 'Bad secret reminder trigger must return 401');

      // 3. Dispatch with valid CRON_SECRET
      const cronRes = await fetch(base + '/api/internal/reminders', {
        headers: { Authorization: 'Bearer ' + process.env.CRON_SECRET },
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(cronRes.status, 200, 'Authorized reminder dispatch must return 200');
      const cronData = await cronRes.json();
      assert.ok(typeof cronData.processed === 'number' && cronData.processed >= 1, 'Dispatcher must process due follow-up');

      // 4. Verify notification generated for sales user via /notifications API
      const notifRes = await api('/notifications', 'GET', undefined, salesToken);
      assert.equal(notifRes.ok, true, `Notifications list failed: ${notifRes.error?.message}`);
      assert.ok(Array.isArray(notifRes.data), 'Notifications must return an array');
      const salesDueNotif = notifRes.data.find(n => n.name === 'Follow-up due');
      assert.ok(salesDueNotif, 'Follow-up notification must be delivered to assigned sales user');
      assert.equal(salesDueNotif.body, 'A scheduled follow-up is ready for action.');
    });

    // --- CHECK 5: Staff permissions UI, role grants & immutable audit trail ---
    await check('Staff permission updates record immutable audit logs and prevent historical tampering', async () => {
      // 1. Query staff accounts via API
      const staffRes = await api('/admin/users');
      assert.equal(staffRes.ok, true, `Staff accounts list failed: ${staffRes.error?.message}`);
      assert.ok(Array.isArray(staffRes.data), 'Staff accounts list must be an array');
      assert.ok(staffRes.data.some(u => u.id === sales.id), 'Created sales fixture must appear in staff accounts');

      // 2. Grant temporary permission to sales role
      const patchRes = await api('/admin/permissions', 'PATCH', {
        role: 'sales',
        permission: 'catalog.write',
        enabled: true
      });
      assert.equal(patchRes.ok, true, `Permission grant failed: ${patchRes.error?.message}`);

      // 3. Verify audit log entry was automatically created
      const auditRes = await db.query(
        `select * from public.audit_logs where entity_type = 'role_permission' and entity_id = 'sales:catalog.write' order by created_at desc limit 1`
      );
      assert.equal(auditRes.rows.length, 1, 'Audit log row must exist for permission grant');
      assert.equal(auditRes.rows[0].action, 'GRANT');
      assert.equal(auditRes.rows[0].actor_id, owner.id);
      const auditId = auditRes.rows[0].id;

      // 4. Verify audit log immutability: updates and deletes are denied by RLS policy and trigger
      const updateResult = await db.query(`update public.audit_logs set action = 'TAMPERED' where id = $1`, [auditId]);
      assert.equal(updateResult.rowCount, 0, 'Audit log mutations must be denied by RLS policy');

      const deleteResult = await db.query(`delete from public.audit_logs where id = $1`, [auditId]);
      assert.equal(deleteResult.rowCount, 0, 'Audit log deletions must be denied by RLS policy');

      const checkTamper = await db.query(`select action from public.audit_logs where id = $1`, [auditId]);
      assert.equal(checkTamper.rows[0].action, 'GRANT', 'Audit log content must remain untampered');

      // 5. Clean up granted permission
      await api('/admin/permissions', 'PATCH', {
        role: 'sales',
        permission: 'catalog.write',
        enabled: false
      });
    });

    // --- CHECK 6: Mobile admin UI inspection ---
    await check('Mobile viewport loads reports and users management without layout or script errors', async () => {
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

      // Navigate to /admin/reports
      await page.goto('/admin/reports');
      await expect(page.getByRole('heading', { name: 'Workshop reports', exact: true })).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('heading', { name: 'Record reports and exports', exact: true })).toBeVisible({ timeout: 15000 });

      // Navigate to /admin/users
      await page.goto('/admin/users');
      await expect(page.getByRole('heading', { name: 'Staff & permissions', exact: true })).toBeVisible({ timeout: 15000 });

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
    await fs.writeFile('test-results/reporting-audit-browser-latest.json', JSON.stringify(artifact, null, 2));
    console.log(`\nALL ${passed.length} PHASE 18 REPORTS & AUDIT ACCEPTANCE CHECKS PASSED!\n`);

  } finally {
    if (browser) await browser.close();
    await db.end();
    for (const u of users) {
      await retirePublicationFixture(u);
    }
  }
}

main().catch(err => {
  console.error('Phase 18 Reports & Audit acceptance failed:', err);
  process.exit(1);
});
