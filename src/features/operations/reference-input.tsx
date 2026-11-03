'use client';
import {recordLabel} from '@/contracts/record-identity';
import { useEffect, useRef, useState } from 'react';
import type { RecordContext } from '@/contracts/record-context';
import type { Field } from '@/contracts/resources';
import { FollowupStaffInput } from './followup-staff-input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MaterialQuickAddModal } from '@/features/materials/material-quick-add-modal';
import type { MaterialItem } from '@/features/materials/material-catalog-data';
type Choice = { id: string; sku?:string; record_code?:string; name?: string; heading?: string; code?: string; public_id?: string; version?: number; context?: string; visibility?: string; resource_type?: string; format?: string };
function CollectionReferenceInput({ field, initial, initialOptions = [], publicList = false, onSelectionChange, invalid, describedBy, context }: { field: Field; initial?: unknown; initialOptions?: Choice[]; publicList?: boolean; onSelectionChange?: (id: string) => void; invalid?: boolean; describedBy?: string; context?: RecordContext }) {
  const [selected, setSelected] = useState(String(initial ?? '')), [options, setOptions] = useState<Choice[]>(initialOptions), [next, setNext] = useState<string | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(true);
  const [showMaterialQuickAdd, setShowMaterialQuickAdd] = useState(false);
  const loadingMore = useRef(false);
  const latest = useRef(0), [refresh, setRefresh] = useState(0);
  const baseEndpoint = field.reference === 'media-assets' ? '/api/v1/uploads/mine?limit=100' : `/api/v1/${publicList ? '' : 'admin/'}${field.reference}?limit=100`;
  const endpoint=baseEndpoint+(context?'&'+new URLSearchParams({context:context.parent,context_id:context.id}):'');
  const choices = field.mediaFilter ? options.filter(option => option.context === 'product' && option.visibility === 'public' && ((option.resource_type === 'image' && ['jpg','jpeg','png','webp'].includes(option.format ?? '')) || (field.mediaFilter === 'public-catalog' && option.resource_type === 'video' && ['mp4','webm','mov'].includes(option.format ?? '')))) : options;
  useEffect(() => {
    const controller = new AbortController();
    const generation = latest;
    const load = () => { const version = ++latest.current; void fetch(endpoint, { signal: controller.signal }).then(async response => {
      const body = await response.json(); if (!response.ok) throw new Error(body.error?.message ?? 'Unable to load options for your role');
      if (!Array.isArray(body.data) || body.data.some((choice: Choice) => !choice || typeof choice.id !== 'string')) throw new Error('Reference options are invalid');
      if (body.meta?.nextCursor != null && typeof body.meta.nextCursor !== 'string') throw new Error('Reference continuation is invalid');
      if (!controller.signal.aborted && version === latest.current) { setOptions(body.data); setNext(body.meta?.nextCursor ?? null); setError(''); setBusy(false); }
    }).catch(failure => { if (!controller.signal.aborted && version === latest.current) { setError(failure instanceof Error ? failure.message : 'Unable to load options'); setBusy(false); } }); };
    const reload = () => { setBusy(true); load(); };
    load(); window.addEventListener('smartfabrication:media-updated', reload);
    return () => { controller.abort(); generation.current++; window.removeEventListener('smartfabrication:media-updated', reload); };
  }, [endpoint, refresh]);
  return <>
    <select aria-invalid={invalid||undefined} aria-describedby={describedBy} name={field.key} id={field.key} required={field.required} value={selected} onChange={event => { setSelected(event.target.value); onSelectionChange?.(event.target.value); }}>
      <option value="">Select {field.label.toLowerCase()}</option>
      {selected && !choices.some(option => option.id === selected) && <option value={selected}>Saved selection (not in loaded options)</option>}
      {choices.map(option => <option key={option.id} value={option.id}>{recordLabel(option as unknown as Record<string,unknown>, 'Saved record')}{option.version ? ` · v${option.version}` : ''}</option>)}
    </select>
    {busy && <p role="status" className="mt-2 text-xs text-slate-500">Loading {field.label.toLowerCase()} options…</p>}
    {next && <Button type="button" variant="outline" size="sm" className="mt-2" disabled={busy} onClick={async () => {
      if (loadingMore.current) return; loadingMore.current = true; setBusy(true); setError('');
      const version = ++latest.current;
      try {
        const response = await fetch(endpoint + '&cursor=' + encodeURIComponent(next)), body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? 'Unable to load more options');
        if (!Array.isArray(body.data) || body.data.some((choice: Choice) => !choice || typeof choice.id !== 'string') || (body.meta?.nextCursor != null && typeof body.meta.nextCursor !== 'string')) throw new Error('Reference options are invalid');
        if (version === latest.current) { setOptions(previous => [...previous, ...body.data.filter((choice: Choice) => !previous.some(saved => saved.id === choice.id))]); setNext(body.meta?.nextCursor ?? null); }
      } catch (failure) { if (version === latest.current) setError(failure instanceof Error ? failure.message : 'Unable to load options'); }
      finally { loadingMore.current = false; if (version === latest.current) setBusy(false); }
    }}>More {field.label.toLowerCase()} options</Button>}
    {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    {error && !next && <Button type="button" variant="outline" size="sm" className="mt-2" disabled={busy} onClick={() => { setBusy(true); setError(''); setRefresh(value => value + 1); }}>Retry {field.label.toLowerCase()} options</Button>}
    {field.reference === 'materials' && (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs font-semibold text-teal-800 border-teal-300 bg-teal-50/80 hover:bg-teal-100 gap-1.5"
          onClick={() => setShowMaterialQuickAdd(true)}
        >
          <Plus size={13} />
          + नया मटेरियल (Quick Add)
        </Button>
        <MaterialQuickAddModal
          isOpen={showMaterialQuickAdd}
          onClose={() => setShowMaterialQuickAdd(false)}
          onCreated={(item) => {
            const newOpt = {
              id: item.code,
              name: `${item.name} (${item.name_hi})`,
              code: item.code,
            };
            setOptions(prev => [newOpt, ...prev]);
            setSelected(item.code);
            onSelectionChange?.(item.code);
            setShowMaterialQuickAdd(false);
          }}
        />
      </div>
    )}
    {field.reference === 'suppliers' && (
      <p className="mt-1 text-[11px] text-slate-500">
        सप्लायर नहीं मिला? <a href="/admin/suppliers?new=1" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline font-semibold">नया सप्लायर जोड़ें</a>
      </p>
    )}
  </>;
}

export function ReferenceInput(props:Parameters<typeof CollectionReferenceInput>[0]){return props.field.reference==='followup-staff'?<FollowupStaffInput field={props.field} initial={props.initial}/>:<CollectionReferenceInput {...props}/>;}
