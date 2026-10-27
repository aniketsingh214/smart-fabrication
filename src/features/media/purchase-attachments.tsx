'use client';
import { validatedFormData,apiFormError,reportFormError } from '@/lib/form-errors';
import { ValidatedForm } from '@/components/validated-form';
import { notify } from '@/lib/notify';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { uploadInvoice } from './upload';
import { InvoicePosting } from './invoice-posting';
type Attachment = { id: string; media_id: string; note: string };
export function PurchaseAttachments({ purchaseId, canAttach }: { purchaseId: string; canAttach: boolean }) {
  const [items, setItems] = useState<Attachment[]>([]), [error, setError] = useState('');
  const [busy, setBusy] = useState(false), [pending, setPending] = useState(false);
  const [next, setNext] = useState<string | null>(null), [loadingMore, setLoadingMore] = useState(false);
  const [delivery, setDelivery] = useState<{ id: string; url: string }>();
  const command = useRef(new InvoicePosting()), loading = useRef(false);
  const endpoint = `/api/v1/purchases/${purchaseId}/attachments`;
  const load = useCallback(async (signal?: AbortSignal, cursor?: string) => {
    const response = await fetch(endpoint + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''), { signal });
    const body = await response.json();
    if (!response.ok) throw apiFormError(body.error,'Invoices could not be loaded');
    setItems(previous => cursor ? [...previous, ...body.data.filter((item: Attachment) => !previous.some(saved => saved.id === item.id))] : body.data);
    setNext(body.meta.nextCursor);
  }, [endpoint]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(endpoint, { signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw apiFormError(body.error,'Invoices could not be loaded');
      if (!controller.signal.aborted) { setItems(body.data); setNext(body.meta.nextCursor); }
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [endpoint]);
  return <section className="mt-6 space-y-3 border-t pt-5">
    <h3 className="font-semibold">Private invoices</h3>
    {!items.length && <p className="text-xs text-slate-500">No invoices attached.</p>}
    {items.map((item, i) => <div key={item.id}>
      <Button variant="outline" size="sm" onClick={async () => {
        setError(''); setDelivery(undefined);
        try {
          const response = await fetch(`/api/v1/uploads/${item.media_id}`), body = await response.json();
          if (!response.ok) throw apiFormError(body.error,'Invoice unavailable');
          const url = new URL(body.data.url);
          if (url.protocol !== 'https:') throw new Error('Invalid invoice download URL');
          setDelivery({ id: item.id, url: url.href });
        } catch (e) { setError(e instanceof Error ? e.message : 'Invoice unavailable'); }
      }}>Prepare invoice {i + 1}</Button>
      {delivery?.id === item.id && <a href={delivery.url} target="_blank" rel="noopener noreferrer" className="ml-3 text-sm underline">Open invoice {i + 1} (expires shortly)</a>}
      {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
    </div>)}
    {next && <Button disabled={loadingMore} variant="outline" size="sm" onClick={async () => {
      if (loading.current) return;
      loading.current = true; setLoadingMore(true); setError('');
      try { await load(undefined, next); } catch (e) { setError(e instanceof Error ? e.message : 'Invoices could not be loaded'); }
      finally { loading.current = false; setLoadingMore(false); }
    }}>{loadingMore ? 'Loading invoices…' : 'More invoices'}</Button>}
    {canAttach && <ValidatedForm className="space-y-3 rounded-lg bg-slate-50 p-4" onSubmit={async event => {
      event.preventDefault();
      const form = event.currentTarget, data = validatedFormData(form);
      setBusy(true); setError('');
      try {
        const file = data.get('file');
        await command.current.post(endpoint, file instanceof File ? file : null, String(data.get('note') ?? ''), uploadInvoice);
        notify('Invoice attached successfully.');
        form.reset();
        await load();
      } catch (e) { if(reportFormError(form,e))return;notify(e instanceof Error ? e.message : 'Invoice could not be attached','error');setError(e instanceof Error ? e.message : 'Invoice could not be attached'); }
      finally { setPending(command.current.pending); setBusy(false); }
    }}>
      <label className="block text-sm">Invoice image or PDF<input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy || pending} required={!pending} className="mt-2" /></label>
      <label className="block text-sm">Invoice note<input name="note" maxLength={500} className="mt-2" disabled={busy || pending} /></label>
      <p className="text-xs text-slate-500">JPG, PNG, WebP or PDF up to 10 MB. Attachments preserve history; uploading does not change bill totals.</p>
      {pending && <p role="status" className="text-sm">The verified file and original note are retained for retry. Keep this page open until confirmed.</p>}
      <Button disabled={busy} variant="outline">{busy ? 'Attaching…' : pending ? 'Retry attachment' : 'Upload and attach invoice'}</Button>
    </ValidatedForm>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </section>;
}
