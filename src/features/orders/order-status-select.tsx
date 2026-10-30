'use client';
import {nextStates,orderStates} from '@/contracts/workflows';
export function OrderStatusSelect({status,busy,onChange}:{status:string;busy:boolean;onChange:(status:string)=>void}){
 const allowed=nextStates(status,'order');
 return <label className="block max-w-md text-sm font-semibold">Order stage<select aria-label="Order stage" className="mt-2" value={status} disabled={busy||!allowed.length} onChange={event=>{if(allowed.includes(event.target.value))onChange(event.target.value);}}>{[...new Set([...(orderStates as readonly string[]),status])].map(stage=><option key={stage} value={stage} disabled={stage!==status&&!allowed.includes(stage)}>{stage.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase())}{stage===status?' (Current)':''}</option>)}</select><span className="mt-2 block text-xs font-normal text-slate-500">{allowed.length?'All stages are shown. Only the next stage is available; payment, measurement and workshop checks apply.':'No further stage is available for this order.'}</span></label>;
}
