import { expect, it, vi } from 'vitest';
import { referenceUpload } from '@/features/media/reference-upload';
const file = () => new File(['synthetic'], 'reference.png', { type: 'image/png' });
const signed = () => Response.json({ data: { apiKey: 'fixture', signature: 'fixture', params: {}, intentId: 'intent', uploadUrl: 'https://example.invalid/provider' } });
it('retries only confirmation after provider success and a lost confirmation response', async () => {
  const send = vi.fn().mockResolvedValueOnce(signed()).mockResolvedValueOnce(new Response('', { status: 200 })).mockRejectedValueOnce(new TypeError('Lost response')).mockResolvedValueOnce(Response.json({ data: { id: 'asset' } }));
  const upload = referenceUpload(file(), 'capability', send);
  await expect(upload()).rejects.toThrow('Lost response'); await expect(upload()).resolves.toEqual({ id: 'asset' }); await upload();
  expect(send).toHaveBeenCalledTimes(4); expect(send.mock.calls[2]).toEqual(send.mock.calls[3]);
  expect(send.mock.calls[3][0]).toBe('/api/v1/uploads/guest/confirm');
  expect(send.mock.calls[1][1].headers).toBeUndefined(); // Capability is never sent to the provider.
});
it('rejects invalid file types without allocating an intent and blocks concurrent calls', async () => {
  const send = vi.fn(); await expect(referenceUpload(new File(['x'], 'bad.pdf', { type: 'application/pdf' }), 'token', send)()).rejects.toThrow('Choose a JPG'); expect(send).not.toHaveBeenCalled();
  let finish!: (response: Response) => void;
  send.mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve; }));
  const upload = referenceUpload(file(), 'token', send), first = upload();
  await expect(upload()).rejects.toThrow('already in progress'); finish(Response.json({ error: { message: 'Expired' } }, { status: 401 })); await expect(first).rejects.toThrow('Expired');
});
