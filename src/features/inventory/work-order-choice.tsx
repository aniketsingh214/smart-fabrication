'use client';
import {recordLabel} from '@/contracts/record-identity';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
type Choice = { id: string; name: string;record_code?:string };
export function WorkOrderChoice({ jobs, cursor, selected }: { jobs: Choice[]; cursor?: string | null; selected?: string | null }) {
  const [choices, setChoices] = useState(jobs), [next, setNext] = useState(cursor), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const loading = useRef(false);
  return <div><label>Work order<select aria-label="Work order" className="mt-2" name="work_order_id" defaultValue={selected ?? ''}>
    <option value="">Not linked to a job</option>
    {selected && !choices.some(job => job.id === selected) && <option value={selected}>Saved work order (not in loaded page)</option>}
    {choices.map(job => <option key={job.id} value={job.id}>{recordLabel(job,'Work order')}</option>)}
  </select></label>
    {next && <Button type="button" className="mt-2" variant="outline" size="sm" disabled={busy} onClick={async () => {
      if (loading.current) return;
      loading.current = true; setBusy(true); setError('');
      try {
        const response = await fetch('/api/v1/admin/work-orders?limit=100&cursor=' + encodeURIComponent(next));
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? 'Work orders could not be loaded');
        if (!Array.isArray(body.data) || body.data.some((job: Choice) => !job || typeof job.id !== 'string' || typeof job.name !== 'string') || (body.meta?.nextCursor != null && typeof body.meta.nextCursor !== 'string')) throw new Error('Work order response is invalid');
        setChoices(previous => [...previous, ...body.data.filter((job: Choice) => !previous.some(saved => saved.id === job.id))]);
        setNext(body.meta?.nextCursor ?? null);
      } catch (failure) { setError(failure instanceof Error ? failure.message : 'Work orders could not be loaded'); }
      finally { loading.current = false; setBusy(false); }
    }}>{busy ? 'Loading work orders…' : 'More work orders'}</Button>}
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
  </div>;
}
