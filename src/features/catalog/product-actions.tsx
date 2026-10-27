'use client';
import { validatedFormData,apiFormError,reportFormError } from '@/lib/form-errors';
import { ValidatedForm } from '@/components/validated-form';
import { notify } from '@/lib/notify';
import { useRef,useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { duplicateProductSchema } from '@/contracts/catalog';
export function ProductActions({id,canWrite,onCopied}:{id:string;canWrite:boolean;onCopied:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');const key=useRef<string|null>(null);
 async function duplicate(form:FormData){setBusy(true);setError('');try{const payload=duplicateProductSchema.parse(Object.fromEntries(form));key.current??=crypto.randomUUID();const r=await fetch(`/api/v1/admin/products/${id}/duplicate`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key.current},body:JSON.stringify(payload)});const result=await r.json();if(!r.ok)throw apiFormError(result.error,'Unable to duplicate product');notify('Product draft saved successfully.');onCopied();}catch(e){if(reportFormError(form,e))return;notify(e instanceof Error?e.message:'Unable to complete the action.','error');setError(e instanceof Error?e.message:'Unable to duplicate product');}finally{setBusy(false);}}
 return <section className="mt-5 space-y-4 border-t border-slate-100 pt-5"><Button asChild variant="outline"><Link href={`/admin/products/${id}/preview`} target="_blank" rel="noopener noreferrer">Open private preview</Link></Button>{canWrite&&<ValidatedForm className="space-y-3 rounded-lg bg-slate-50 p-4" onSubmit={e=>{e.preventDefault();void duplicate(validatedFormData(e.currentTarget));}}><h3 className="text-sm font-semibold">Duplicate as a new draft</h3><p className="text-xs text-slate-500">Copies product details, images and unarchived choices. BOM and calculation rules require separate review and configuration.</p><label className="block">New product name<input className="mt-2" name="name" required maxLength={200}/></label><label className="block">New SKU<input className="mt-2" name="sku" required maxLength={100}/></label><label className="block">New URL slug<input className="mt-2" name="slug" required maxLength={200} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="custom-steel-gate"/></label>{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<Button disabled={busy}>{busy?'Copying…':'Create product draft'}</Button></ValidatedForm>}</section>;
}
