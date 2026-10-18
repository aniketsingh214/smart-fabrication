import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';
import { databaseClient } from './db-client.mjs';

// Execute the shipped SDK, not a duplicate HTTP implementation. No web UI or cookies.
const source = await fs.readFile('src/contracts/client.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { SmartFabricationClient } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options);
const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const base = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Acceptance target must be local');
const email = `sf-mobile-client-${crypto.randomUUID()}@example.invalid`, password = crypto.randomBytes(24).toString('base64url');
const db = databaseClient(), passed = []; let fixture, token;
const client = new SmartFabricationClient(base + '/api/v1', async () => token);
async function check(name, run) { await run(); passed.push(name); console.log(`PASS: ${name}`); }
async function cleanFixture(id, expectedEmail) {
  assert.match(expectedEmail, /^sf-mobile-client-[0-9a-f-]{36}@example\.invalid$/);
  const match = await db.query('select id from auth.users where id=$1 and email=$2', [id, expectedEmail]); assert.equal(match.rowCount, 1, 'Fixture identity mismatch');
  const references = await db.query('select count(*)::int count from public.audit_logs where actor_id=$1', [id]);
  await db.query('begin'); await db.query('delete from public.notifications where user_id=$1', [id]); await db.query('delete from public.user_roles where user_id=$1', [id]);
  if (references.rows[0].count) {
    await db.query('update public.profiles set disabled=true where id=$1', [id]); await db.query('commit');
    assert.equal((await admin.auth.admin.updateUserById(id, { ban_duration: '876000h', password: crypto.randomBytes(32).toString('base64url') })).error, null, 'Fixture retirement failed');
    console.log('Generated fixture disabled/banned; author identity retained for immutable audit references.');
    return 'retired-audit-author';
  }
  await db.query('delete from public.profiles where id=$1', [id]); await db.query('commit');
  assert.equal((await admin.auth.admin.deleteUser(id)).error, null, 'Auth cleanup failed');
  console.log('Only generated mobile fixture removed; immutable audit retained.'); return 'removed';
}
let cleanup;
try {
  if (process.argv.includes('--cleanup-fixtures')) {
    await db.connect();
    const candidates = await db.query("select u.id,u.email from auth.users u join public.profiles p on p.id=u.id where u.email ~ '^sf-mobile-client-[0-9a-f-]{36}@example[.]invalid$' and p.display_name='Mobile acceptance fixture' and p.disabled=true");
    assert.ok(candidates.rows.length <= 10, 'Unexpected fixture count; refusing broad cleanup');
    for (const candidate of candidates.rows) await cleanFixture(candidate.id, candidate.email);
    console.log(`Processed ${candidates.rows.length} precisely identified generated fixtures.`);
  } else {
  const health = await fetch(base + '/api/v1/health', { signal: AbortSignal.timeout(10000) }); assert.equal(health.status, 200);
  await db.connect();
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true }); assert.equal(created.error, null, 'Auth fixture creation failed'); fixture = created.data.user.id;
  const login = await auth.auth.signInWithPassword({ email, password }); assert.equal(login.error, null, 'Fixture login failed'); token = login.data.session.access_token;
  await check('SDK authenticates without a browser and exposes only current customer identity', async () => {
    const { data } = await client.request('/me'); assert.equal(data.id, fixture); assert.equal(data.permissions.includes('users.write'), false);
  });
  await check('SDK updates its own profile and rejects privilege overposting', async () => {
    const { data } = await client.request('/me', { method: 'PATCH', body: { display_name: 'Mobile acceptance fixture' } }); assert.equal(data.id, fixture); assert.equal(data.display_name, 'Mobile acceptance fixture');
    await assert.rejects(client.request('/me', { method: 'PATCH', body: { display_name: 'Mobile fixture', disabled: false, role: 'owner' } }), error => error.status === 422);
  });
  const stamp = new Date().toISOString();
  await db.query("insert into public.notifications(user_id,name,body,created_at) values($1,'Mobile fixture A','Synthetic acceptance',$2),($1,'Mobile fixture B','Synthetic acceptance',$2)", [fixture, stamp]);
  await check('SDK follows notification cursors and mark-read retries retain the original timestamp', async () => {
    const first = await client.request('/notifications?limit=1'); assert.equal(first.data.length, 1); assert.ok(first.meta.nextCursor);
    const second = await client.request('/notifications?limit=1&cursor=' + encodeURIComponent(first.meta.nextCursor)); assert.equal(second.data.length, 1); assert.notEqual(second.data[0].id, first.data[0].id); assert.equal(second.meta.nextCursor, null);
    const path = `/notifications/${first.data[0].id}/read`, one = await client.request(path, { method: 'POST' }), two = await client.request(path, { method: 'POST' }); assert.equal(one.data.read_at, two.data.read_at); assert.ok(one.data.read_at);
  });
  await check('SDK preserves unknown-object and staff-permission denials', async () => {
    await assert.rejects(client.request(`/notifications/${crypto.randomUUID()}/read`, { method: 'POST' }), error => error.status === 404 && error.code === 'NOT_FOUND');
    await assert.rejects(client.request('/admin/users'), error => error.status === 403);
  });
  await check('A separate anonymous SDK cannot inherit the signed-in session', async () => {
    await assert.rejects(new SmartFabricationClient(base + '/api/v1').request('/me'), error => error.status === 401);
  });
  await check('SDK token supplier uses a refreshed Supabase access token', async () => {
    const refreshed = await auth.auth.refreshSession(); assert.equal(refreshed.error, null, 'Fixture refresh failed'); token = refreshed.data.session.access_token; assert.equal((await client.request('/me')).data.id, fixture);
  });
  await check('Current disabled-profile checks deny an otherwise valid SDK token', async () => {
    await db.query('update public.profiles set disabled=true where id=$1', [fixture]); await assert.rejects(client.request('/me'), error => error.status === 403);
  });
  assert.equal((await auth.auth.signOut({ scope: 'global' })).error, null, 'Fixture global sign-out failed');
  }
} catch (error) { console.error(`Mobile SDK acceptance failed: ${error.message}`); process.exitCode = 1; }
finally {
  if (fixture) {
    try {
      cleanup = await cleanFixture(fixture, email);
    } catch (error) { await db.query('rollback').catch(() => {}); console.error(`Mobile fixture cleanup failed: ${error.message}`); process.exitCode = 1; }
  }
  await db.end().catch(() => {});
  await fs.mkdir('test-results', { recursive: true });
  if (!process.argv.includes('--cleanup-fixtures')) await fs.writeFile('test-results/mobile-client-latest.json', JSON.stringify({ finishedAt: new Date().toISOString(), passed: !process.exitCode, checks: passed, cleanup, scope: 'Real shipped SDK, development Auth/API/profile/notification writes; no financial or stock entries. Immutable audit author fixtures are disabled/banned, not deleted.' }, null, 2));
  if (!process.exitCode && !process.argv.includes('--cleanup-fixtures')) console.log(`PASS: ${passed.length} independent live mobile SDK checks.`);
}
