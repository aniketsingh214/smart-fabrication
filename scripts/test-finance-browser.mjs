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
const accountsAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);

const run = crypto.randomUUID();
const fixture = { run };
const users = [];
const passed = [];
let ownerToken, accountsToken;

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

async function newUser(role, auth, db) {
  const email = `sf-publication-${role}-${crypto.randomUUID()}@example.invalid`;
  const password = crypto.randomBytes(32).toString('base64url');
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Finance acceptance ${role}` },
  });
  assert.equal(created.error, null, 'Fixture creation failed');
  const user = { id: created.data.user.id, email, password, auth, admin };
  users.push(user);

  await db.query('insert into public.user_roles(user_id, role_id) values($1, $2) on conflict do nothing', [user.id, role]);

  const login = await auth.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null, 'Fixture login failed');
  return { ...user, token: login.data.session.access_token };
}

async function main() {
  console.log(`Starting Phase 17 Finance & Accounts acceptance run: ${run}`);
  const db = databaseClient();
  await db.connect();

  let browser;
  try {
    const owner = await newUser('owner', ownerAuth, db);
    ownerToken = owner.token;
    const accounts = await newUser('accounts', accountsAuth, db);
    accountsToken = accounts.token;
    await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)", [owner.id, JSON.stringify({ sub: owner.id, role: 'authenticated' })]);
    await db.query('set role authenticated');
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    // --- CHECK 1: Operating expenses, approval & reversal lifecycle ---
    await check('Operating expenses require draft-before-approval and support full reversal with audit trail', async () => {
      // 1. Create draft expense
      const expRes = await api('/admin/expenses', 'POST', {
        name: `Workshop electricity bill ${run.slice(0, 8)}`,
        category: 'electricity',
        amount_minor: 450000, // ₹4,500.00
        expense_date: today,
        mode: 'bank',
        reference: `ELEC-${run.slice(0, 6)}`
      });
      assert.equal(expRes.ok, true, `Expense creation failed: ${expRes.error?.message}`);
      fixture.expenseId = expRes.data.id;
      assert.match(fixture.expenseId, /^[0-9a-f-]{36}$/);

      // Verify status is draft
      const draftExp = await api(`/admin/expenses/${fixture.expenseId}`);
      assert.equal(draftExp.data.status, 'draft');

      // 2. Approve expense
      const appRes = await api(`/admin/expenses/${fixture.expenseId}/approve`, 'POST', {});
      assert.equal(appRes.ok, true, `Expense approval failed: ${appRes.error?.message}`);

      const approvedExp = await api(`/admin/expenses/${fixture.expenseId}`);
      assert.equal(approvedExp.data.status, 'approved');

      // 3. Reverse approved expense
      const revKey = crypto.randomUUID();
      const revRes = await api('/admin/expense-reversals', 'POST', {
        expense_id: fixture.expenseId,
        reversal_date: today,
        reason: 'Duplicate utility entry reversed with audit trail'
      }, ownerToken, { 'Idempotency-Key': revKey });
      assert.equal(revRes.ok, true, `Expense reversal failed: ${revRes.error?.message}`);

      // Verify reversal record exists and original expense cannot be reversed again
      const revCheck = await api(`/admin/expense-reversals/${revRes.data.id}`);
      assert.equal(revCheck.ok, true);
      assert.equal(revCheck.data.expense_id, fixture.expenseId);

      // Attempting to reverse the expense again fails
      const duplicateRev = await api('/admin/expense-reversals', 'POST', {
        expense_id: fixture.expenseId,
        reversal_date: today,
        reason: 'Attempted duplicate reversal'
      }, ownerToken, { 'Idempotency-Key': crypto.randomUUID() });
      assert.equal(duplicateRev.ok, false, 'Duplicate expense reversal must be rejected');
    });

    // --- CHECK 2: Owner withdrawals exclusion from operating expenses ---
    await check('Owner withdrawals are tracked separately and excluded from operating expenditure', async () => {
      // Fetch baseline summary via API
      const baseRes = await api('/reports/profit-loss?start=2000-01-01T00:00:00.000Z&end=2100-01-01T00:00:00.000Z');
      assert.equal(baseRes.ok, true, `Baseline summary failed: ${baseRes.error?.message}`);
      const baseExpenses = Number(baseRes.data.approved_expenses_minor ?? 0);
      const baseWithdrawals = Number(baseRes.data.owner_withdrawals_minor ?? 0);

      // Record owner withdrawal
      const withKey = crypto.randomUUID();
      const withRes = await api('/admin/owner-withdrawals', 'POST', {
        name: `Owner personal drawing ${run.slice(0, 8)}`,
        amount_minor: 1200000, // ₹12,000.00
        withdrawal_date: today,
        mode: 'bank',
        reason: 'Monthly personal drawings fixture'
      }, ownerToken, { 'Idempotency-Key': withKey });
      assert.equal(withRes.ok, true, `Owner withdrawal creation failed: ${withRes.error?.message}`);
      fixture.withdrawalId = withRes.data.id;

      // Verify finance_summary: withdrawals increased by 1,200,000; operating expenses unchanged
      const newRes = await api('/reports/profit-loss?start=2000-01-01T00:00:00.000Z&end=2100-01-01T00:00:00.000Z');
      assert.equal(newRes.ok, true, `Updated summary failed: ${newRes.error?.message}`);
      const newExpenses = Number(newRes.data.approved_expenses_minor ?? 0);
      const newWithdrawals = Number(newRes.data.owner_withdrawals_minor ?? 0);

      assert.equal(newExpenses, baseExpenses, 'Owner drawings must NOT increase operating expenses');
      assert.equal(newWithdrawals - baseWithdrawals, 1200000, 'Owner drawings must correctly increment withdrawals');
    });

    // --- CHECK 3: Supplier payables, material returns & supplier cash refund ---
    await check('Supplier purchases calculate tax and discounts, and support partial returns with cash refund', async () => {
      // Create supplier
      const suppRes = await api('/admin/suppliers', 'POST', {
        name: `Finance Supplier ${run.slice(0, 8)}`,
        phone: '+919876543299',
        address: 'Wholesale Steel Market, Naraina',
        gst_number: '07AAAAA0000A1Z5'
      });
      assert.equal(suppRes.ok, true, `Supplier creation failed: ${suppRes.error?.message}`);
      fixture.supplierId = suppRes.data.id;

      // Create purchase bill
      const purRes = await api('/admin/purchases', 'POST', {
        name: `Raw Steel Bill ${run.slice(0, 8)}`,
        supplier_id: fixture.supplierId,
        bill_number: `BILL-${run.slice(0, 6)}`,
        bill_date: today
      });
      assert.equal(purRes.ok, true, `Purchase creation failed: ${purRes.error?.message}`);
      fixture.purchaseId = purRes.data.id;

      // Create material for line item
      const matRes = await api('/admin/materials', 'POST', {
        name: `Structural Tube ${run.slice(0, 8)}`,
        code: `MAT-FIN-${run.slice(0, 6)}`,
        type: 'square_pipe',
        size: '40x40x2mm',
        thickness_mm: 2,
        unit: 'kg',
        weight_kg_per_unit: 2.4,
        reorder_level: 50
      });
      assert.equal(matRes.ok, true, `Material creation failed: ${matRes.error?.message}`);
      fixture.materialId = matRes.data.id;

      // Add purchase item (100 kg @ ₹70/kg = ₹7,000, discount ₹200, 18% GST on ₹6,800 = ₹1,224 -> Total = ₹8,024)
      const itemRes = await api('/admin/purchase-items', 'POST', {
        purchase_id: fixture.purchaseId,
        material_id: fixture.materialId,
        quantity: 100,
        rate_minor: 7000,
        discount_minor: 20000,
        tax_bps: 1800,
        tax_recoverable: true
      });
      assert.equal(itemRes.ok, true, `Purchase item creation failed: ${itemRes.error?.message}`);
      fixture.purchaseItemId = itemRes.data.id;

      // Receive purchase
      const recRes = await api(`/admin/purchases/${fixture.purchaseId}/receive`, 'POST', {});
      assert.equal(recRes.ok, true, `Receive purchase failed: ${recRes.error?.message}`);

      // Verify payable balance
      const payBalRes = await db.query(
        `select outstanding_minor, paid_minor from public.payable_balances() where purchase_id = $1`,
        [fixture.purchaseId]
      );
      assert.equal(Number(payBalRes.rows[0].outstanding_minor), 802400);

      // Pay bill in full
      const payKey = crypto.randomUUID();
      const suppPayRes = await api('/admin/supplier-payments', 'POST', {
        purchase_id: fixture.purchaseId,
        amount_minor: 802400,
        mode: 'bank',
        reference: `PAY-SUPP-${run.slice(0, 6)}`
      }, ownerToken, { 'Idempotency-Key': payKey });
      assert.equal(suppPayRes.ok, true, `Supplier payment failed: ${suppPayRes.error?.message}`);

      // Return 20 kg of material
      const retRes = await db.query(
        `select public.return_purchase_item($1::jsonb) as ret_id`,
        [JSON.stringify({
          purchase_item_id: fixture.purchaseItemId,
          quantity: 20,
          reason: 'Defective surface finish returned',
          idempotency_key: crypto.randomUUID()
        })]
      );
      assert.ok(retRes.rows[0].ret_id);

      // Supplier now has a negative outstanding balance (credit of ₹1,604.80)
      const creditRes = await db.query(
        `select outstanding_minor from public.payable_balances() where purchase_id = $1`,
        [fixture.purchaseId]
      );
      const creditMinor = Number(creditRes.rows[0].outstanding_minor);
      assert.equal(creditMinor, -160480);

      // Record reviewed supplier cash refund settling the credit
      const refundKey = crypto.randomUUID();
      const refAdjRes = await api('/finance/adjustments', 'POST', {
        kind: 'supplier_refund',
        source_id: fixture.purchaseId,
        amount_minor: 160480,
        posting_date: today,
        mode: 'bank',
        reference: `REF-SUPP-${run.slice(0, 6)}`,
        reason: 'Refund for 20kg returned defective stock',
        confirmed: true
      }, ownerToken, { 'Idempotency-Key': refundKey });
      assert.equal(refAdjRes.ok, true, `Supplier refund failed: ${refAdjRes.error?.message}`);

      // Balance must now be zero
      const settledRes = await db.query(
        `select outstanding_minor from public.payable_balances() where purchase_id = $1`,
        [fixture.purchaseId]
      );
      assert.equal(Number(settledRes.rows[0].outstanding_minor), 0);
    });

    // --- CHECK 4: Customer receivable reconciliation & payment reversal ---
    await check('Customer payments reduce outstanding balance and payment reversal cleanly restores receivables', async () => {
      // Create customer
      const custRes = await api('/admin/customers', 'POST', {
        name: `Finance Customer ${run.slice(0, 8)}`,
        phone: '+919876543288',
        email: `customer-${run.slice(0, 8)}@example.invalid`,
        address: 'DLF Phase 2, Gurugram'
      });
      assert.equal(custRes.ok, true);
      fixture.customerId = custRes.data.id;

      // Create lead, quote, approve, accept & convert
      const leadRes = await api('/admin/leads', 'POST', {
        name: `Finance Lead ${run.slice(0, 8)}`,
        phone: '+919876543288',
        city: 'Gurugram',
        requirement: 'Custom railing'
      });
      fixture.leadId = leadRes.data.id;

      const quoteRes = await api('/admin/quotations', 'POST', {
        name: `Finance Quote ${run.slice(0, 8)}`,
        customer_id: fixture.customerId,
        lead_id: fixture.leadId,
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString()
      });
      fixture.quotationId = quoteRes.data.id;

      await api(`/admin/quotations/${fixture.quotationId}/versions`, 'POST', {
        items: [{ description: 'Custom balcony railing', quantity: 1, unit_minor: 1000000 }],
        discount_minor: 0,
        tax_bps: 0
      });
      await api(`/admin/quotations/${fixture.quotationId}/approve`, 'POST', {});
      await api(`/quotations/${fixture.quotationId}/accept`, 'POST', {});

      const convRes = await api(`/admin/quotations/${fixture.quotationId}/convert`, 'POST', {});
      assert.equal(convRes.ok, true);
      fixture.orderId = convRes.data.result;

      // Initial receivable balance is ₹10,000.00
      let recBalRes = await db.query(
        `select outstanding_minor from public.receivable_balances() where order_id = $1`,
        [fixture.orderId]
      );
      assert.equal(Number(recBalRes.rows[0].outstanding_minor), 1000000);

      // Record customer payment of ₹4,000.00
      const custPayKey = crypto.randomUUID();
      const payRes = await api('/admin/customer-payments', 'POST', {
        order_id: fixture.orderId,
        amount_minor: 400000,
        mode: 'upi',
        reference: `REC-${run.slice(0, 6)}`
      }, ownerToken, { 'Idempotency-Key': custPayKey });
      assert.equal(payRes.ok, true);
      fixture.custPayId = payRes.data.id;

      // Outstanding balance is now ₹6,000.00
      recBalRes = await db.query(
        `select outstanding_minor from public.receivable_balances() where order_id = $1`,
        [fixture.orderId]
      );
      assert.equal(Number(recBalRes.rows[0].outstanding_minor), 600000);

      // Reverse the customer payment (e.g. UPI dishonour / error)
      const revKey = crypto.randomUUID();
      const revPayRes = await api('/finance/adjustments', 'POST', {
        kind: 'customer_payment_reversal',
        source_id: fixture.custPayId,
        posting_date: today,
        mode: 'upi',
        reference: `REV-UPI-${run.slice(0, 6)}`,
        reason: 'UPI transaction bounce reported by bank',
        confirmed: true
      }, ownerToken, { 'Idempotency-Key': revKey });
      assert.equal(revPayRes.ok, true, `Customer payment reversal failed: ${revPayRes.error?.message}`);

      // Outstanding balance restored back to ₹10,000.00
      recBalRes = await db.query(
        `select outstanding_minor from public.receivable_balances() where order_id = $1`,
        [fixture.orderId]
      );
      assert.equal(Number(recBalRes.rows[0].outstanding_minor), 1000000);
    });

    // --- CHECK 5: Financial period closures prevent backdated entries ---
    await check('Finance period closures block backdated transactions and cannot be closed unconfirmed', async () => {
      const yesterday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(Date.now() - 86400000));

      // Attempt period closure without confirmation: must fail
      const unconfRes = await api('/finance/periods/close', 'POST', {
        closed_through: yesterday,
        reason: 'Quarterly financial closure fixture',
        confirmed: false
      }, ownerToken, { 'Idempotency-Key': crypto.randomUUID() });
      assert.equal(unconfRes.ok, false, 'Unconfirmed period closure must be rejected');

      // Close period through yesterday
      const closeKey = crypto.randomUUID();
      const closeRes = await api('/finance/periods/close', 'POST', {
        closed_through: yesterday,
        reason: 'Reviewed and closed for audit',
        confirmed: true
      }, ownerToken, { 'Idempotency-Key': closeKey });
      assert.equal(closeRes.ok, true, `Period close failed: ${closeRes.error?.message}`);

      // Retrying identical period close returns same result
      const repeatClose = await api('/finance/periods/close', 'POST', {
        closed_through: yesterday,
        reason: 'Reviewed and closed for audit',
        confirmed: true
      }, ownerToken, { 'Idempotency-Key': closeKey });
      assert.equal(repeatClose.ok, true);

      // Attempt to post backdated adjustment dated on or before closed_through: must fail
      const backdatedRes = await api('/finance/adjustments', 'POST', {
        kind: 'supplier_refund',
        source_id: fixture.purchaseId,
        amount_minor: 100,
        posting_date: yesterday,
        mode: 'bank',
        reference: `BACKDATED-${run.slice(0, 6)}`,
        reason: 'Attempted backdated adjustment',
        confirmed: true
      }, ownerToken, { 'Idempotency-Key': crypto.randomUUID() });
      assert.equal(backdatedRes.ok, false, 'Backdated financial adjustment must be rejected');
    });

    // --- CHECK 6: Mobile admin UI inspection ---
    await check('Mobile viewport loads finance resources without errors', async () => {
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

      // Navigate to /admin/expenses
      await page.goto('/admin/expenses');
      await expect(page.getByRole('heading', { name: 'Business expenses', exact: true })).toBeVisible({ timeout: 15000 });

      // Navigate to /admin/owner-withdrawals
      await page.goto('/admin/owner-withdrawals');
      await expect(page.getByRole('heading', { name: 'Owner withdrawals', exact: true })).toBeVisible({ timeout: 15000 });

      // Navigate to /admin/financial-adjustments
      await page.goto('/admin/financial-adjustments');
      await expect(page.getByRole('heading', { name: 'Financial corrections', exact: true })).toBeVisible({ timeout: 15000 });

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
    await fs.writeFile('test-results/finance-browser-latest.json', JSON.stringify(artifact, null, 2));
    console.log(`\nALL ${passed.length} PHASE 17 FINANCE ACCEPTANCE CHECKS PASSED!\n`);

  } finally {
    if (browser) await browser.close();
    await db.end();
    for (const u of users) {
      await retirePublicationFixture(u);
    }
  }
}

main().catch(err => {
  console.error('Phase 17 Finance acceptance failed:', err);
  process.exit(1);
});
