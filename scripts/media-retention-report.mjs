import fs from 'node:fs/promises';
import { databaseClient } from './db-client.mjs';
import { retentionOptions } from './media-retention-options.mjs';

// A review report only. There is deliberately no provider deletion or application mutation.
const db = databaseClient();
try {
  const { hours, limit, cursor } = retentionOptions(process.argv.slice(2));
  await db.connect(); await db.query('begin isolation level repeatable read read only');
  const { rows } = await db.query(`
    select i.id,i.context,i.visibility,i.resource_type,i.created_at,i.expires_at
    from public.upload_intents i
    where i.confirmed_at is null and i.expires_at < now() - ($1 * interval '1 hour')
      and ($2::uuid is null or i.id > $2::uuid)
      and not exists (select 1 from public.media_assets m where m.public_id=i.public_id)
    order by i.id limit $3`, [hours, cursor, limit + 1]);
  await db.query('commit');
  const items = rows.slice(0, limit), nextCursor = rows.length > limit ? items.at(-1).id : null;
  const report = {
    capturedAt: new Date().toISOString(), mode: 'review-only', minimumHoursPastExpiry: hours,
    policyApproved: false, providerPresence: 'not-queried', nextCursor, items,
    warning: 'These are expired unconfirmed intents without a verified media row, not confirmed deletable provider assets. Revalidate provenance, references, legal hold, audit and approved retention before any separately reviewed deletion. No files or database records were changed.',
  };
  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/media-retention-latest.json', JSON.stringify(report, null, 2));
  console.log(`PASS: read-only review report: ${items.length} expired unconfirmed intents; continuation ${nextCursor ? 'available' : 'none'}. No provider queries or deletion. Local report: test-results/media-retention-latest.json`);
} catch (error) { await db.query('rollback').catch(() => {}); console.error(`Media review failed: ${error.message}`); process.exitCode = 1; }
finally { await db.end().catch(() => {}); }
