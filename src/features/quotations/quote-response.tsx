'use client';
import { useRef,useState } from 'react';
import { Button } from '@/components/ui/button';
export function QuoteResponse({id,status}:{id:string;status:string}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');const running=useRef(false);
 async function respond(action:string){if(running.current)return;running.current=true;setBusy(true);setMessage('');try{const r=await fetch(`/api/v1/quotations/${id}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const result=await r.json();if(!r.ok)throw new Error(result.error?.message??'Unable to save');location.reload();}catch(e){setMessage(e instanceof Error?e.message:'Unable to save. Please retry.');}finally{running.current=false;setBusy(false);}}
 return <>{status==='approved'&&<div className="flex gap-2"><Button size="sm" disabled={busy} onClick={()=>void respond('accept')}>Accept</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>void respond('reject')}>Reject</Button></div>}{message&&<p role="alert" className="mt-2 text-xs text-red-600">{message}</p>}</>;
}
