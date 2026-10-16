'use client';
import { useRef,useState } from 'react';
export function RoleEditor({id,current}:{id:string;current:string[]}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');const running=useRef(false);
 async function change(role:string,enabled:boolean){if(running.current)return;running.current=true;setBusy(true);setError('');try{const res=await fetch(`/api/v1/admin/users/${id}/roles`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role,enabled})});const result=await res.json();if(!res.ok)throw new Error(result.error?.message??'Unable to update role');location.reload();}catch(e){setError(e instanceof Error?e.message:'Unable to update role. Please retry.');}finally{running.current=false;setBusy(false);}}
 return <div className="mt-4"><div className="flex flex-wrap gap-4">{['owner','sales','production','accounts','content','customer'].map(role=><label key={role} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={current.includes(role)} disabled={busy} onChange={e=>void change(role,e.target.checked)}/>{role}</label>)}</div>{error&&<p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}</div>;
}
