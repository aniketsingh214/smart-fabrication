'use client';
import { useEffect,useState } from 'react';
import { nextStates,leadStates,orderStates } from '@/contracts/workflows';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';
type Lead={id:string;name:string;status:string;version:number};
export function LeadStatusSelect({lead,busy,onChange}:{lead:Lead;busy:boolean;onChange:(status:string)=>void}){
 return <label className="block max-w-md text-sm font-semibold">Lead status<select aria-label={'Lead status for '+lead.name} className="mt-2" value={lead.status} disabled={busy} onChange={event=>onChange(event.target.value)}>{[...new Set([...(leadStates as readonly string[]),'LOST',lead.status])].map(status=><option key={status} value={status} disabled={status!==lead.status&&!nextStates(lead.status,'lead').includes(status)}>{status.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase())}</option>)}</select><span className="mt-2 block text-xs font-normal text-slate-500">Select the next stage for this enquiry.</span></label>;
}
type Order={id:string;name?:string;status?:string;version?:number};
export function OrderStatusSelect({order,busy,onChange}:{order:Order;busy:boolean;onChange:(status:string)=>void}){
 const currentStatus=order.status??'CONFIRMED';
 const validNext=nextStates(currentStatus,'order');
 const allStates=[...new Set([...(orderStates as readonly string[]),'CANCELLED',currentStatus])];
 return <label className="block max-w-md text-sm font-semibold">Order status<select aria-label={'Order status for '+(order.name??order.id)} className="mt-2" value={currentStatus} disabled={busy} onChange={event=>{if(event.target.value!==currentStatus)onChange(event.target.value);}}>{allStates.map(status=><option key={status} value={status} disabled={status!==currentStatus&&!validNext.includes(status)}>{status.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase())}</option>)}</select><span className="mt-2 block text-xs font-normal text-slate-500">Select the next order stage. 100% payment (PAID – ALL DONE) is strictly required before dispatch. Delivery &amp; installation sign-offs are required before completion.</span></label>;
}
type WorkOrder={id:string;name?:string;status?:string};
export function WorkOrderStatusSelect({workOrder,busy,onChange}:{workOrder:WorkOrder;busy:boolean;onChange:(status:string)=>void}){
 const currentStatus=workOrder.status??'pending';
 const stages=['pending','fabrication','finishing','ready'];
 const transitions:Record<string,string[]>={pending:['fabrication'],fabrication:['finishing'],finishing:['ready'],quality_check:['ready'],ready:[]};
 const validNext=transitions[currentStatus]??[];
 return <label className="block max-w-md text-sm font-semibold">Work order stage<select aria-label={'Work order stage for '+(workOrder.name??workOrder.id)} className="mt-2" value={currentStatus} disabled={busy} onChange={event=>{if(event.target.value!==currentStatus)onChange(event.target.value);}}>{stages.map(status=><option key={status} value={status} disabled={status!==currentStatus&&!validNext.includes(status)}>{status.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase())}</option>)}</select><span className="mt-2 block text-xs font-normal text-slate-500">Select the next workshop stage for this job card.</span></label>;
}
type Quotation={id:string;name?:string;status?:string};
export function QuotationStatusSelect({quotation,busy,canApprove,canOrder,onAction}:{quotation:Quotation;busy:boolean;canApprove:boolean;canOrder:boolean;onAction:(action:string)=>void}){
 const status=quotation.status??'draft';
 const stageOptions=[
  {id:'draft',label:'Draft'},
  {id:'approved',label:'Approved',action:'approve',allowed:status==='draft'&&canApprove},
  {id:'accepted',label:'Accepted by customer',action:'accept',allowed:status==='approved'&&canApprove},
  {id:'rejected',label:'Rejected by customer',action:'reject',allowed:status==='approved'&&canApprove},
  {id:'converted',label:'Converted to order',action:'convert',allowed:status==='accepted'&&canOrder},
 ];
 return <label className="block max-w-md text-sm font-semibold">Quotation stage<select aria-label={'Quotation stage for '+(quotation.name??quotation.id)} className="mt-2" value={status==='converted'?'converted':status} disabled={busy} onChange={event=>{const target=stageOptions.find(opt=>opt.id===event.target.value);if(target?.action)onAction(target.action);}}>{stageOptions.map(opt=><option key={opt.id} value={opt.id} disabled={opt.id!==status&&!opt.allowed}>{opt.label}{opt.id===status?' (Current)':''}</option>)}</select><span className="mt-2 block text-xs font-normal text-slate-500">Select the next quotation stage.</span></label>;
}
type DeliveryRecord={id:string;name?:string;status?:string};
export function DeliveryStatusSelect({delivery,busy,onChange}:{delivery:DeliveryRecord;busy:boolean;onChange:(status:string)=>void}){
 const currentStatus=delivery.status??'scheduled';
 const stages=['scheduled','dispatched','delivered'];
 const validNext=currentStatus==='scheduled'?['dispatched']:[];
 return <label className="block max-w-md text-sm font-semibold">Delivery stage<select aria-label={'Delivery stage for '+(delivery.name??delivery.id)} className="mt-2" value={currentStatus} disabled={busy} onChange={event=>{if(event.target.value!==currentStatus)onChange(event.target.value);}}>{stages.map(status=><option key={status} value={status} disabled={status!==currentStatus&&!validNext.includes(status)}>{status.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase())}{status===currentStatus?' (Current)':''}</option>)}</select><span className="mt-2 block text-xs font-normal text-slate-500">Select the next delivery stage.</span></label>;
}
export function CustomerLeadStatuses({customerId,canWrite}:{customerId:string;canWrite:boolean}){
 const [leads,setLeads]=useState<Lead[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[next,setNext]=useState<string|null>(null),[retry,setRetry]=useState(0);
 const endpoint='/api/v1/admin/leads?limit=25&context=customers&context_id='+encodeURIComponent(customerId);
 useEffect(()=>{const controller=new AbortController();setError('');fetch(endpoint,{signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'Enquiries could not be loaded');setLeads(body.data);setNext(body.meta?.nextCursor??null);}).catch(error=>{if(!controller.signal.aborted)setError(error.message);});return()=>controller.abort();},[endpoint,retry]);
 async function update(lead:Lead,status:string){setBusy(true);setError('');try{const response=await fetch('/api/v1/admin/leads/'+lead.id+'/transitions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,version:lead.version})});const result=await response.json();if(!response.ok)throw new Error(result.error?.message??'Status could not be saved');const latest=await fetch('/api/v1/admin/leads/'+lead.id);const body=await latest.json();if(!latest.ok)throw new Error('Status saved, but latest record could not be loaded. Refresh enquiries.');setLeads(previous=>previous.map(row=>row.id===lead.id?body.data:row));notify('Lead status saved successfully.');}catch(error){const message=error instanceof Error?error.message:'Unable to update status';setError(message);notify(message,'error');}finally{setBusy(false);}}
 return <section className="mt-6 space-y-4 border-t pt-5" aria-label="Customer enquiry statuses"><h3 className="font-semibold">Enquiry status</h3>{!leads.length&&!error&&<p className="text-sm text-slate-500">No enquiries linked to this customer.</p>}{leads.map(lead=><div key={lead.id} className="rounded-lg border p-4"><a href={'/admin/leads?record='+lead.id} className="mb-3 block text-sm font-semibold underline">{lead.name}</a><LeadStatusSelect lead={lead} busy={busy||!canWrite} onChange={status=>void update(lead,status)}/></div>)}{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<Button type="button" variant="outline" disabled={busy} onClick={()=>setRetry(value=>value+1)}>Refresh enquiries</Button>{next&&<Button type="button" variant="outline" disabled={busy} onClick={async()=>{setBusy(true);try{const response=await fetch(endpoint+'&cursor='+encodeURIComponent(next));const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'More enquiries could not be loaded');setLeads(previous=>[...new Map([...previous,...body.data].map(row=>[row.id,row])).values()]);setNext(body.meta?.nextCursor??null);}catch(error){setError(error instanceof Error?error.message:'Enquiries could not be loaded');}finally{setBusy(false);}}}>More enquiries</Button>}</section>;
}
