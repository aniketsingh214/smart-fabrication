'use client';
import { SnapshotTable } from '@/components/snapshot-table';
import { useRef,useState } from 'react';
import Link from 'next/link';
import { ReferenceInput } from '@/features/operations/reference-input';
import { Button } from '@/components/ui/button';
import { estimatePreviewResultSchema } from '@/contracts/estimates';
import { money } from '@/lib/utils';
import type { z } from 'zod';
export function CalculationPreview({product,rule}:{product?:string;rule?:string}){
 const pending=useRef(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<z.infer<typeof estimatePreviewResultSchema>|null>(null);
 return <><p className="mb-6 text-sm text-slate-500">Review a draft or published configuration before issuing an estimate. Preview saves no estimate history and changes no published prices.</p><form className="card max-w-2xl p-6" onSubmit={async event=>{event.preventDefault();if(pending.current)return;const form=new FormData(event.currentTarget);pending.current=true;setBusy(true);setError('');setResult(null);try{
 const response=await fetch('/api/v1/estimates/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:form.get('product_id'),bom_id:form.get('bom_id'),rule_id:form.get('rule_id'),width_mm:Number(form.get('width_mm')),height_mm:Number(form.get('height_mm'))})});const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'Preview unavailable');setResult(estimatePreviewResultSchema.parse(body.data));
 }catch(failure){setError(failure instanceof Error?failure.message:'Preview unavailable');}finally{pending.current=false;setBusy(false);}}}><fieldset disabled={busy} className="space-y-5">
 {([{key:'product_id',label:'Product',reference:'products',initial:product},{key:'bom_id',label:'BOM version',reference:'bom-versions'},{key:'rule_id',label:'Pricing rule',reference:'calculation-rules',initial:rule}]).map(field=><div key={field.key}><label htmlFor={field.key}>{field.label}</label><ReferenceInput field={{...field,type:'reference',required:true}} initial={field.initial}/></div>)}
 <div className="grid grid-cols-2 gap-4"><label>Width (mm)<input name="width_mm" type="number" min={100} max={20000} required/></label><label>Height (mm)<input name="height_mm" type="number" min={100} max={10000} required/></label></div><Button>{busy?'Previewing…':'Preview estimate'}</Button></fieldset></form>
 {error&&<p role="alert" className="mt-5 text-red-700">{error}</p>}{result&&<section aria-label="Configuration preview result" className="card mt-6 max-w-2xl p-6"><h2 className="text-lg font-bold">Draft calculation preview</h2><p className="mt-3 text-2xl font-bold">{money(result.min_minor)} – {money(result.max_minor)}</p><p className="mt-3 text-sm">Preview only. No estimate was saved.</p><p className="mt-2 text-sm">BOM version {result.bom_version} · Pricing version {result.rule_version}</p><div className="mt-4 overflow-x-auto"><SnapshotTable><thead><tr><th>Material</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>{result.materials.map(line=><tr key={line.material_id}><td>{line.name}</td><td data-sort-value={line.quantity}>{line.quantity} {line.unit}</td><td data-sort-value={line.amount_minor}>{money(line.amount_minor)}</td></tr>)}</tbody></SnapshotTable></div><p className="mt-4 text-sm">{result.notice}</p></section>}<Link href="/admin/estimate-history" className="mt-6 inline-block text-sm underline">View issued estimate history</Link></>;
}
