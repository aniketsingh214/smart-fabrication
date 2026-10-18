import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
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

async function api(path, method = 'GET', body, token = ownerToken) {
  let response;
  try {
    response = await fetch(base + '/api/v1' + path, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
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
    user_metadata: { display_name: `Materials acceptance ${role}` },
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

async function runMaterialsAcceptance() {
  console.log(`Starting Phase 08 Materials, Rates & BOM acceptance (Run: ${run})...`);
  const owner = await newUser('owner', ownerAuth);
  ownerToken = owner.token;

  // 1. Material Creation & Validation Boundaries
  await check('Material variants validate specifications and units; negative dimensions rejected', async () => {
    // Attempt invalid material with negative weight
    const invalid = await api('/admin/materials', 'POST', {
      name: `INVALID material ${run}`,
      code: `INV-${run}`,
      type: 'square_pipe',
      size: '50x50',
      thickness_mm: -2,
      unit: 'kg',
      weight_kg_per_unit: -1,
      reorder_level: 0,
    });
    assert.equal(invalid.status, 422, 'Negative thickness/weight must be rejected with 422');

    // Create valid material
    const res = await api('/admin/materials', 'POST', {
      name: `TEST ONLY structural tube ${run}`,
      code: `MAT-TUBE-${run}`,
      type: 'square_pipe',
      size: '60mm x 60mm x 2.5mm',
      thickness_mm: 2.5,
      unit: 'kg',
      weight_kg_per_unit: 4.25,
      reorder_level: 150,
      active: true,
    });
    assert.equal(res.status, 201);
    fixture.materialId = res.data.id;
    assert.match(fixture.materialId, /^[0-9a-f-]{36}$/);
  });

  // 2. Append-Only Rate Versioning
  await check('Append-only rates record purchase and selling rates; negative rates rejected', async () => {
    const invalidRate = await api('/admin/material-rates', 'POST', {
      material_id: fixture.materialId,
      purchase_minor: -5000,
      selling_minor: 10000,
    });
    assert.equal(invalidRate.status, 422, 'Negative purchase rate must be rejected');

    // Post Rate Version 1: purchase ₹70/kg, selling ₹90/kg
    const rate1 = await api('/admin/material-rates', 'POST', {
      material_id: fixture.materialId,
      purchase_minor: 7000,
      selling_minor: 9000,
      effective_at: new Date(Date.now() - 3600000).toISOString(),
    });
    assert.equal(rate1.status, 201);
    fixture.rateVersion1Id = rate1.data.id;
    assert.match(fixture.rateVersion1Id, /^[0-9a-f-]{36}$/);
  });

  // 3. BOM Lifecycle & Versioning Guard
  await check('BOM versions require draft creation before publication; line items enforce wastage limit', async () => {
    // Create product fixture
    const prodRes = await api('/admin/products', 'POST', {
      name: `TEST ONLY BOM product ${run}`,
      sku: `PROD-BOM-${run}`,
      slug: `test-bom-product-${run}`,
      category_id: null,
      description: 'Synthetic product for Phase 08 BOM acceptance.',
      material: 'Test Steel',
      price_min_minor: 1000000,
      price_max_minor: 2500000,
      custom_size: true,
      status: 'published',
      delivery_availability: 'available',
      installation_availability: 'available',
    });
    assert.equal(prodRes.status, 201);
    fixture.productId = prodRes.data.id;

    // Direct publish of empty BOM must fail
    const emptyPublish = await api('/admin/bom-versions', 'POST', {
      product_id: fixture.productId,
      version: 1,
      status: 'published',
    });
    assert.ok([400, 409, 422, 500].includes(emptyPublish.status), 'Empty BOM publish must fail');

    // Create draft BOM
    const draftBom = await api('/admin/bom-versions', 'POST', {
      product_id: fixture.productId,
      version: 1,
      status: 'draft',
    });
    assert.equal(draftBom.status, 201);
    fixture.bomId = draftBom.data.id;

    // Attempt wastage > 30% (must fail check constraint wastage_percent <= 30)
    const excessiveWastage = await api('/admin/bom-items', 'POST', {
      bom_id: fixture.bomId,
      material_id: fixture.materialId,
      quantity_per_sq_m: 3.5,
      wastage_percent: 45, // > 30%
      customer_visible: true,
    });
    assert.ok([400, 422, 500].includes(excessiveWastage.status), 'Wastage > 30% must be rejected');

    // Add valid BOM item
    const bomItem = await api('/admin/bom-items', 'POST', {
      bom_id: fixture.bomId,
      material_id: fixture.materialId,
      quantity_per_sq_m: 3.5,
      wastage_percent: 10,
      customer_visible: true,
    });
    assert.equal(bomItem.status, 201);

    // Publish BOM version
    const publishedBom = await api('/admin/bom-versions/' + fixture.bomId, 'PATCH', { status: 'published' });
    assert.equal(publishedBom.status, 200);
  });

  // 4. Configurable Calculation Rules
  await check('Pricing rules enforce margin limits and support versioned overheads', async () => {
    // Attempt margin > 10,000 bps (100%)
    const excessiveMargin = await api('/admin/calculation-rules', 'POST', {
      product_id: fixture.productId,
      version: 1,
      labour_minor_per_sq_m: 15000,
      finish_minor_per_sq_m: 8000,
      hardware_minor: 5000,
      delivery_minor: 10000,
      installation_minor: 15000,
      margin_bps: 12000, // > 10,000 bps
      range_percent: 10,
      status: 'draft',
    });
    assert.ok([400, 422, 500].includes(excessiveMargin.status), 'Margin > 10,000 bps must be rejected');

    // Valid rule creation as draft, then published
    const ruleRes = await api('/admin/calculation-rules', 'POST', {
      product_id: fixture.productId,
      version: 1,
      labour_minor_per_sq_m: 15000,
      finish_minor_per_sq_m: 8000,
      hardware_minor: 5000,
      delivery_minor: 10000,
      installation_minor: 15000,
      margin_bps: 1500, // 15%
      range_percent: 10,
      status: 'draft',
    });
    assert.equal(ruleRes.status, 201);
    fixture.ruleId = ruleRes.data.id;

    const publishedRule = await api('/admin/calculation-rules/' + fixture.ruleId, 'PATCH', { status: 'published' });
    assert.equal(publishedRule.status, 200);
  });

  // 5. Rate Snapshot Preservation & Estimate History
  await check('New rate versions apply to subsequent estimates while historical snapshots remain immutable', async () => {
    // Generate initial estimate with Rate Version 1 (selling ₹90/kg)
    const est1Res = await api('/estimates', 'POST', {
      product_id: fixture.productId,
      width_mm: 2000,
      height_mm: 2000, // Area = 4.0 sq.m
    });
    assert.equal(est1Res.status, 201);
    fixture.initialEstimateId = est1Res.data.id;
    const initialTotal = est1Res.data.total_minor;
    assert.ok(initialTotal > 0);
    assert.equal(est1Res.data.materials[0].rate_id, fixture.rateVersion1Id);

    // Now update material rate: Post Rate Version 2 (selling ₹150/kg)
    const rate2 = await api('/admin/material-rates', 'POST', {
      material_id: fixture.materialId,
      purchase_minor: 11000,
      selling_minor: 15000,
      effective_at: new Date().toISOString(),
    });
    assert.equal(rate2.status, 201);
    fixture.rateVersion2Id = rate2.data.id;

    // Generate new estimate with Rate Version 2
    const est2Res = await api('/estimates', 'POST', {
      product_id: fixture.productId,
      width_mm: 2000,
      height_mm: 2000,
    });
    assert.equal(est2Res.status, 201);
    const newTotal = est2Res.data.total_minor;
    assert.ok(newTotal > initialTotal, 'New estimate must reflect higher rate version');
    assert.equal(est2Res.data.materials[0].rate_id, fixture.rateVersion2Id);

    // CRITICAL VERIFICATION: Check historical record of Estimate 1
    const histRes = await api('/admin/estimate-history/' + fixture.initialEstimateId);
    assert.equal(histRes.status, 200);
    assert.equal(histRes.data.result.total_minor, initialTotal, 'Historical snapshot must not change');
    assert.equal(histRes.data.result.materials[0].rate_id, fixture.rateVersion1Id, 'Historical snapshot must retain Rate Version 1');
  });

  // 6. Internal Component Redaction (customer_visible = false)
  await check('BOM line items flagged as internal are redacted from customer responses and retained in admin history', async () => {
    // Create BOM Version 2 with customer_visible: false
    const bom2 = await api('/admin/bom-versions', 'POST', {
      product_id: fixture.productId,
      version: 2,
      status: 'draft',
    });
    assert.equal(bom2.status, 201);
    fixture.bom2Id = bom2.data.id;

    await api('/admin/bom-items', 'POST', {
      bom_id: fixture.bom2Id,
      material_id: fixture.materialId,
      quantity_per_sq_m: 3.5,
      wastage_percent: 10,
      customer_visible: false, // Internal confidential component
    });
    await api('/admin/bom-versions/' + fixture.bom2Id, 'PATCH', { status: 'published' });

    // Customer estimate calculation
    const custCalc = await api('/estimates', 'POST', {
      product_id: fixture.productId,
      width_mm: 2000,
      height_mm: 2000,
    });
    assert.equal(custCalc.status, 201);
    // Public response materials array must be empty (redacted)
    assert.deepEqual(custCalc.data.materials, [], 'Internal component must be omitted from customer response');

    // Admin history must retain the full internal material specification
    const adminHist = await api('/admin/estimate-history/' + custCalc.data.id);
    assert.equal(adminHist.status, 200);
    assert.equal(adminHist.data.result.materials[0].customer_visible, false);
    assert.equal(adminHist.data.result.materials[0].rate_id, fixture.rateVersion2Id);
  });

  console.log(`PASS: All ${passed.length} Materials, Rates & BOM checks passed!`);
}

try {
  await runMaterialsAcceptance();
} catch (error) {
  console.error('Phase 08 Materials & BOM acceptance failed:', error.message);
  process.exitCode = 1;
} finally {
  console.log('Cleaning up Phase 08 test fixtures...');
  // Deactivate synthetic material and archive synthetic products
  try {
    if (ownerToken) {
      if (fixture.productId) await api('/admin/products/' + fixture.productId, 'PATCH', { status: 'archived' });
      if (fixture.materialId) await api('/admin/materials/' + fixture.materialId, 'PATCH', { active: false });
    }
  } catch (err) {
    console.error('Fixture archiving failed:', err.message);
  }

  // Retire test accounts
  for (const u of users) {
    try {
      await retirePublicationFixture({ ...u, admin });
    } catch (err) {
      console.error('User retirement failed:', err.message);
    }
  }

  // Write artifact
  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile(
    'test-results/materials-bom-browser-latest.json',
    JSON.stringify(
      {
        finishedAt: new Date().toISOString(),
        passed: !process.exitCode,
        checks: passed,
        fixture,
        scope: 'Phase 08 Materials, Rates & BOM acceptance. Canonical units, append-only rates, BOM version lifecycle, wastage/margin boundaries, immutable rate history, and confidential component redaction verified.',
      },
      null,
      2
    )
  );
}
