import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { databaseClient } from './db-client.mjs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, options);
const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000';
const db = databaseClient();
const email = `sf-session-${crypto.randomUUID()}@example.invalid`;
const password = crypto.randomBytes(24).toString('base64url');
let fixture, checks = 0;
async function check(name, action) { await action(); checks++; console.log(`PASS: ${name}`); }
const request = (path, token, body) => fetch(`${base}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) });
try {
  await db.connect();
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(created.error, null, 'Fixture creation failed');
  fixture = created.data.user.id;
  await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner')", [fixture]);
  const signed = await client.auth.signInWithPassword({ email, password });
  assert.equal(signed.error, null, 'Fixture sign-in failed');
  let session = signed.data.session;
  await check('Cookie-independent bearer identity and owner authorization', async () => {
    const response = await request('/api/v1/me', session.access_token);
    assert.equal(response.status, 200);
    const { data } = await response.json();
    assert.equal(data.id, fixture);
    assert.equal((await request('/api/v1/admin/permissions', session.access_token)).status, 200);
  });
  await check('Native refresh produces a usable authenticated session', async () => {
    const refreshed = await client.auth.refreshSession({ refresh_token: session.refresh_token });
    assert.equal(refreshed.error, null, 'Refresh failed');
    session = refreshed.data.session;
    assert.equal((await request('/api/v1/me', session.access_token)).status, 200);
  });
  await check('Tampered bearer signature is rejected', async () => {
    const parts = session.access_token.split('.');
    parts[2] = `${parts[2][0] === 'a' ? 'b' : 'a'}${parts[2].slice(1)}`;
    assert.equal((await request('/api/v1/me', parts.join('.'))).status, 401);
  });
  await check('Role removal revokes privileged access for an already issued token', async () => {
    try {
      await db.query("delete from public.user_roles where user_id=$1 and role_id='owner'", [fixture]);
      assert.equal((await request('/api/v1/admin/permissions', session.access_token)).status, 403);
      assert.equal((await request('/api/v1/me', session.access_token)).status, 200);
    } finally {
      await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner') on conflict do nothing", [fixture]);
    }
  });
  await check('Disabled profile blocks an already issued token; re-enable restores access', async () => {
    try {
      await db.query('update public.profiles set disabled=true where id=$1', [fixture]);
      assert.equal((await request('/api/v1/me', session.access_token)).status, 403);
    } finally {
      await db.query('update public.profiles set disabled=false where id=$1', [fixture]);
    }
    assert.equal((await request('/api/v1/me', session.access_token)).status, 200);
  });
  const { rows: roles } = await db.query('select id from public.roles order by id');
  for (const role of roles) {
    await check(`Live read-permission matrix for ${role.id}`, async () => {
      try {
        await db.query('begin');
        await db.query('delete from public.user_roles where user_id=$1', [fixture]);
        await db.query('insert into public.user_roles(user_id,role_id) values($1,$2)', [fixture, role.id]);
        await db.query('commit');
        const { rows: grants } = await db.query('select permission_id from public.role_permissions where role_id=$1 order by permission_id', [role.id]);
        const permissions = grants.map(grant => grant.permission_id);
        const identity = await request('/api/v1/me', session.access_token);
        assert.equal(identity.status, 200);
        assert.deepEqual((await identity.json()).data.permissions.sort(), permissions);
        for (const [path, required] of [
          ['/api/v1/admin/permissions', ['users.read']],
          ['/api/v1/admin/leads', ['leads.read']],
          ['/api/v1/inventory/balances', ['inventory.read']],
          ['/api/v1/finance/payables?limit=1', ['finance.read', 'purchases.read']],
          ['/api/v1/reports/trends', ['reports.read']],
        ]) assert.equal((await request(path, session.access_token)).status, required.every(permission => permissions.includes(permission)) ? 200 : 403, `${role.id}: ${path}`);
        await check(`Live write-permission boundaries for ${role.id} without lasting records`, async () => {
          const missing = crypto.randomUUID();
          const { rows: absent } = await db.query('select exists(select 1 from public.categories where id=$1) or exists(select 1 from public.orders where id=$1) or exists(select 1 from public.purchases where id=$1) found', [missing]);
          assert.equal(absent[0].found, false, 'Boundary targets must not exist');
          const { rows: dates } = await db.query("select (now() at time zone 'Asia/Kolkata')::date::text as business_day");
          const attempts = [
            ['/api/v1/admin/products', 'catalog.write', 422, { name: 'Rejected FK fixture', sku: `session-${missing}`, slug: `session-${missing}`, category_id: missing, material: 'Mild steel', price_min_minor: 0, price_max_minor: 0, custom_size: true, status: 'draft' }],
            ['/api/v1/customer-payments', 'finance.write', 409, { order_id: missing, amount_minor: 1, mode: 'bank', reference: `Missing target ${missing}` }],
            ['/api/v1/finance/adjustments', 'finance.approve', 409, { kind: 'supplier_refund', source_id: missing, posting_date: dates[0].business_day, amount_minor: 1, mode: 'bank', reference: `Missing source ${missing}`, reason: 'Permission boundary against nonexistent source', confirmed: true }],
          ];
          for (const [path, permission, authorizedStatus, body] of attempts) assert.equal((await request(path, session.access_token, body)).status, permissions.includes(permission) ? authorizedStatus : 403, `${role.id}: ${path}`);
          const { rows: leftovers } = await db.query('select count(*)::integer count from public.products where sku=$1', [`session-${missing}`]);
          assert.equal(leftovers[0].count, 0);
        });
      } finally {
        await db.query('rollback').catch(() => {});
        await db.query('begin');
        await db.query('delete from public.user_roles where user_id=$1', [fixture]);
        await db.query("insert into public.user_roles(user_id,role_id) values($1,'owner'),($1,'customer')", [fixture]);
        await db.query('commit');
      }
    });
  }
  await check('Global sign-out prevents reuse of the revoked refresh session', async () => {
    const refreshToken = session.refresh_token;
    assert.equal((await client.auth.signOut({ scope: 'global' })).error, null);
    const fresh = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
    const revoked = await fresh.auth.refreshSession({ refresh_token: refreshToken });
    assert.ok(revoked.error, 'Revoked refresh token must fail');
    assert.equal(revoked.data.session, null);
  });
  console.log(`PASS: ${checks} live bearer/session checks. Natural JWT expiry and all-device browser logout are separate acceptance gates.`);
} catch (error) {
  console.error(`Session verification failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.auth.signOut().catch(() => {});
  if (fixture) {
    try {
      const match = await db.query('select id from auth.users where id=$1 and email=$2', [fixture, email]);
      assert.equal(match.rowCount, 1, 'Fixture identity mismatch');
      await db.query('begin');
      await db.query('delete from public.user_roles where user_id=$1', [fixture]);
      await db.query('delete from public.profiles where id=$1', [fixture]);
      await db.query('commit');
      assert.equal((await admin.auth.admin.deleteUser(fixture)).error, null, 'Fixture cleanup failed');
      console.log('Session fixture cleaned up; immutable audit history retained.');
    } catch (error) {
      await db.query('rollback').catch(() => {});
      console.error(`Session fixture cleanup failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
  await db.end().catch(() => {});
}

