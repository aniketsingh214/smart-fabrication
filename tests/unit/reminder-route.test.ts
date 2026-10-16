import { afterEach, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/internal/reminders/route';
import { createClient } from '@supabase/supabase-js';
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
function configured() { vi.stubEnv('CRON_SECRET', 'fixture-key'); vi.stubEnv('SUPABASE_SECRET_KEY', 'fixture-admin'); }
it('fails closed when the scheduler is not configured', async () => {
  vi.stubEnv('CRON_SECRET', '');
  expect((await GET(new Request('http://localhost/api/internal/reminders'))).status).toBe(503);
  expect(createClient).not.toHaveBeenCalled();
});
it('rejects same-character-length Unicode credentials without throwing', async () => {
  configured();
  const response = await GET(new Request('http://localhost/api/internal/reminders', { headers: { Authorization: 'Bearer fixturé-key' } }));
  expect(response.status).toBe(401);
  expect(createClient).not.toHaveBeenCalled();
});
it('invokes the dispatcher only after scheduler authentication', async () => {
  configured();
  const rpc = vi.fn(async () => ({ data: 2, error: null }));
  vi.mocked(createClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createClient>);
  const response = await GET(new Request('http://localhost/api/internal/reminders', { headers: { Authorization: 'Bearer fixture-key' } }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ processed: 2 });
  expect(rpc).toHaveBeenCalledWith('dispatch_due_notifications');
});
