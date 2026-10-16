import { expect, it, vi } from 'vitest';
import { InvoicePosting } from '@/features/media/invoice-posting';
const file = () => new File(['synthetic'], 'invoice.pdf', { type: 'application/pdf' });
it('retries the original asset and note after a lost association response without uploading twice', async () => {
  const command = new InvoicePosting(), upload = vi.fn().mockResolvedValue({ id: 'asset' });
  const send = vi.fn().mockRejectedValueOnce(new TypeError('Response lost')).mockResolvedValueOnce(Response.json({ data: { id: 'attachment' } }));
  await expect(command.post('/attachments', file(), ' original ', upload, send)).rejects.toThrow('Response lost');
  expect(command.pending).toBe(true);
  await expect(command.post('/another-purchase/attachments', null, '', upload, send)).rejects.toThrow('original purchase');
  await expect(command.post('/attachments', null, 'changed note', upload, send)).resolves.toBe('attachment');
  expect(upload).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][1]).toEqual(send.mock.calls[1][1]);
  expect(JSON.parse(send.mock.calls[1][1].body)).toEqual({ media_id: 'asset', note: 'original' });
  expect(command.pending).toBe(false);
});
it('preserves a pending asset on malformed success or permission failure', async () => {
  const command = new InvoicePosting(), upload = vi.fn().mockResolvedValue({ id: 'asset' });
  await expect(command.post('/attachments', file(), '', upload, vi.fn().mockResolvedValue(Response.json({ data: {} })))).rejects.toThrow('confirmation');
  await expect(command.post('/attachments', null, '', upload, vi.fn().mockResolvedValue(Response.json({ error: { message: 'Forbidden' } }, { status: 403 })))).rejects.toThrow('Forbidden');
  expect(command.pending).toBe(true); expect(upload).toHaveBeenCalledTimes(1);
});
it('blocks concurrent submission before upload completes and releases after upload failure', async () => {
  const command = new InvoicePosting(); let reject!: (error: Error) => void;
  const upload = vi.fn(() => new Promise<{ id: string }>((_resolve, fail) => { reject = fail; })), send = vi.fn();
  const first = command.post('/attachments', file(), '', upload, send);
  await expect(command.post('/attachments', file(), '', upload, send)).rejects.toThrow('already in progress');
  reject(new Error('Upload interrupted')); await expect(first).rejects.toThrow('Upload interrupted');
  expect(command.pending).toBe(false); expect(send).not.toHaveBeenCalled();
  await expect(command.post('/attachments', null, '', upload, send)).rejects.toThrow('Choose an invoice');
});
