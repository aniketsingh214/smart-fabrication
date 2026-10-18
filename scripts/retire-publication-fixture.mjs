import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { databaseClient } from './db-client.mjs';

export async function retirePublicationFixture({ id, email, password, admin, auth }) {
  assert.match(email, /^sf-publication-(owner|sales|customer|production|accounts|content)-[0-9a-f-]{36}@example\.invalid$/);
  const db = databaseClient(); let issue;
  try {
    await db.connect(); assert.equal((await db.query('select id from auth.users where id=$1 and email=$2', [id, email])).rowCount, 1, 'Fixture identity mismatch');
    await db.query('begin'); await db.query('delete from public.user_roles where user_id=$1', [id]); await db.query('update public.profiles set disabled=true where id=$1', [id]); await db.query('commit');
    try {
      assert.equal((await auth.auth.signInWithPassword({ email, password })).error, null, 'Fixture retirement sign-in failed');
      assert.equal((await auth.auth.signOut({ scope: 'global' })).error, null, 'Fixture global sign-out failed');
    } catch (error) { issue = error; }
    // Ban even if global sign-out reports an error. Never leave generated staff enabled.
    assert.equal((await admin.auth.admin.updateUserById(id, { ban_duration: '876000h', password: crypto.randomBytes(32).toString('base64url') })).error, null, 'Fixture ban failed');
    if (issue) throw issue;
  } finally { await db.query('rollback').catch(() => {}); await db.end().catch(() => {}); }
}
