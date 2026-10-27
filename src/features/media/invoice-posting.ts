import { apiFormError } from '@/lib/form-errors';
type PendingInvoice = { media_id: string; note: string };

/** Keep the verified asset and exact association payload when a response is lost. */
export class InvoicePosting {
  private command?: PendingInvoice;
  private target?: string;
  private sending = false;
  get pending() { return Boolean(this.command); }

  async post(endpoint: string, file: File | null, note: string,
    upload: (file: File) => Promise<{ id: string }>, send: typeof fetch = fetch) {
    if (this.sending) throw new Error('Invoice attachment is already in progress');
    this.sending = true;
    try {
      if (this.command && this.target !== endpoint) throw new Error('Resolve the pending invoice on its original purchase first');
      if (!this.command) {
        if (!file?.size) throw new Error('Choose an invoice image or PDF');
        const asset = await upload(file);
        this.command = { media_id: asset.id, note: note.trim() };
        this.target = endpoint;
      }
      const response = await send(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.command) });
      const body = await response.json();
      if (!response.ok) throw apiFormError(body.error,'Invoice could not be attached');
      if (typeof body.data?.id !== 'string' || !body.data.id) throw new Error('Invoice confirmation is missing. Retry the same attachment.');
      this.command = undefined;
      this.target = undefined;
      return body.data.id as string;
    } finally { this.sending = false; }
  }
}
