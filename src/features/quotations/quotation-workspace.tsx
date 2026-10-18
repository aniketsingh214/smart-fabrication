'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
import { Button } from '@/components/ui/button';
import { money,dateTime } from '@/lib/utils';
import { quotationTotals,type QuoteInput,type QuoteVersion } from '@/contracts/quotation';
import { quoteVersionSchema,roundedQuoteLine } from '@/contracts/workflows';

export function QuotationWorkspace({id,status,canWrite,canRevise,onChanged}:{id:string;status:string;canWrite:boolean;canRevise:boolean;onChanged:()=>void}){
 const [versions,setVersions]=useState<QuoteVersion[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[share,setShare]=useState('');
 const revisionKey=useRef<string|null>(null);
 const load=useCallback(async(signal?:AbortSignal)=>{const r=await fetch(`/api/v1/admin/quotations/${id}/versions`,{signal});const body=await r.json();if(!r.ok)throw new Error(body.error?.message??'Unable to load quotation versions');return body.data as QuoteVersion[];},[id]);
 useEffect(()=>{const controller=new AbortController();load(controller.signal).then(data=>{if(!controller.signal.aborted)setVersions(data);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[load]);
 async function save(payload:QuoteInput){
  const r=await fetch(`/api/v1/admin/quotations/${id}/versions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(quoteVersionSchema.parse(payload))});
  const body=await r.json();if(!r.ok)throw new Error(body.error?.message??'Unable to save version');setVersions(await load());setMessage('New immutable version saved. Previous versions remain available.');
 }
 async function revise(form:FormData){setBusy(true);setError('');try{
  revisionKey.current??=crypto.randomUUID();
  const r=await fetch(`/api/v1/admin/quotations/${id}/revise`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':revisionKey.current},body:JSON.stringify({expires_at:new Date(String(form.get('expires_at'))).toISOString(),reason:form.get('reason')})});
  const body=await r.json();if(!r.ok)throw new Error(body.error?.message??'Unable to create revision');onChanged();
 }catch(e){setError(e instanceof Error?e.message:'Unable to create revision');}finally{setBusy(false);}}
 async function copyLink(){const url=`${location.origin}/account?quotation=${id}#quotation-${id}`;setShare(url);try{await navigator.clipboard.writeText(url);setMessage('Customer account link copied. Only the linked customer or permitted staff can access the quotation.');}catch{setMessage('Copy the customer account link below.');}}
 return <section className="mt-6 space-y-4 border-t border-slate-100 pt-5" aria-label="Quotation versions">
  <h3 className="font-semibold">Price versions</h3>
  {loading?<p role="status" className="text-sm text-slate-500">Loading price history…</p>:versions.length?versions.map((version)=><details key={version.id} open className="rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Version {version.version} · {money(version.total_minor)} · {dateTime(version.created_at)}</summary><div className="mt-4 space-y-2 text-sm">{version.snapshot.items.map((line,j)=><div key={j} className="flex justify-between gap-4"><span>{line.description} · {line.quantity} × {money(line.unit_minor)}</span><span>{money(roundedQuoteLine(line.quantity,line.unit_minor))}</span></div>)}<Totals input={version.snapshot}/><a className="inline-block font-semibold text-orange-700 underline" href={`/api/v1/quotations/${id}/pdf?version=${version.version}`}>Download version {version.version} PDF</a></div></details>):<p className="text-sm text-slate-500">No price version yet. Add line items before approval.</p>}
  {!loading&&!error&&canWrite&&status==='draft'&&<QuoteVersionForm key={versions[0]?.id??'new'} initial={versions[0]?.snapshot} onSubmit={save}/>}
  {canWrite&&canRevise&&['approved','rejected','expired'].includes(status)&&<form className="space-y-3 rounded-lg bg-slate-50 p-4" onSubmit={e=>{e.preventDefault();void revise(new FormData(e.currentTarget));}}><h4 className="font-semibold">Create a revised quotation</h4><p className="text-xs text-slate-500">The current quotation will be superseded. Its price history remains unchanged. The new draft must be reviewed and approved again.</p><label className="block text-sm">New expiry<input className="mt-2" type="datetime-local" name="expires_at" required/></label><label className="block text-sm">Revision summary (customer-visible)<textarea className="mt-2" name="reason" minLength={3} maxLength={500} required/></label><Button disabled={busy} variant="outline">{busy?'Creating revisionâ€¦':'Create revision draft'}</Button></form>}
  {['approved','accepted','rejected','expired','superseded'].includes(status)&&<Button variant="outline" type="button" onClick={()=>void copyLink()}>Copy customer link</Button>}
  {share&&<input aria-label="Customer quotation link" readOnly value={share} onFocus={e=>e.currentTarget.select()}/>}
  {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}{message&&<p role="status" className="text-sm text-orange-800">{message}</p>}
 </section>;
}

function Totals({input}:{input:QuoteInput}){let totals;try{totals=quotationTotals(input);}catch{return <p className="text-xs text-slate-500">Enter valid items and a discount within the subtotal to calculate totals.</p>;}
 return <dl className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm">{[['Subtotal',totals.subtotal_minor],['Discount',-totals.discount_minor],[`Tax (${(input.tax_bps??0)/100}%)`,totals.tax_minor],['Total (INR)',totals.total_minor]].map(([label,value])=><div key={label} className="flex justify-between gap-4"><dt>{label}</dt><dd className="font-semibold">{money(Number(value))}</dd></div>)}</dl>;
}

export function QuoteVersionForm({initial,onSubmit}:{initial?:QuoteInput;onSubmit:(payload:QuoteInput)=>Promise<void>}){
 const [lines,setLines]=useState(initial?.items??[{description:'',quantity:1,unit_minor:0}]),[discount,setDiscount]=useState(initial?.discount_minor??0),[tax,setTax]=useState(initial?.tax_bps??0),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const input={items:lines,discount_minor:discount,tax_bps:tax};
 async function submit(){setBusy(true);setError('');try{const parsed=quoteVersionSchema.safeParse(input);if(!parsed.success)throw new Error(parsed.error.issues[0]?.message??'Check the quotation fields');await onSubmit(parsed.data);}catch(e){setError(e instanceof Error?e.message:'Unable to save version');}finally{setBusy(false);}}
 return <form className="space-y-4 rounded-lg bg-slate-50 p-4" onSubmit={e=>{e.preventDefault();void submit();}}><h4 className="text-sm font-semibold">{initial?'Revise draft prices':'Create price version'}</h4>{lines.map((line,i)=><fieldset key={i} className="min-w-0 space-y-2 border-b border-slate-200 pb-3"><legend className="text-xs text-slate-500">Item {i+1}</legend><label className="block text-sm">Description<input aria-label={`Item ${i+1} description`} required maxLength={200} value={line.description} onChange={e=>setLines(lines.map((l,j)=>j===i?{...l,description:e.target.value}:l))}/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm">Quantity<input aria-label={`Item ${i+1} quantity`} type="number" required min="0.001" max="1000000" step="any" value={line.quantity} onChange={e=>setLines(lines.map((l,j)=>j===i?{...l,quantity:Number(e.target.value)}:l))}/></label><label className="text-sm">Rate (INR)<input aria-label={`Item ${i+1} rate in rupees`} type="number" required min="0" max="10000000000" step="0.01" value={line.unit_minor/100} onChange={e=>setLines(lines.map((l,j)=>j===i?{...l,unit_minor:Math.round(Number(e.target.value)*100)}:l))}/></label></div>{lines.length>1&&<Button type="button" variant="ghost" size="sm" onClick={()=>setLines(lines.filter((_,j)=>j!==i))}>Remove item {i+1}</Button>}</fieldset>)}<div className="grid grid-cols-2 gap-3"><label className="text-sm">Discount (INR)<input type="number" required min="0" step="0.01" value={discount/100} onChange={e=>setDiscount(Math.round(Number(e.target.value)*100))}/></label><label className="text-sm">Tax (%)<input type="number" required min="0" max="100" step="0.01" value={tax/100} onChange={e=>setTax(Math.round(Number(e.target.value)*100))}/></label></div><Totals input={input}/>{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={busy||lines.length>=100} onClick={()=>setLines([...lines,{description:'',quantity:1,unit_minor:0}])}>Add item</Button><Button size="sm" disabled={busy}>{busy?'Savingâ€¦':'Save version'}</Button></div></form>;
}


