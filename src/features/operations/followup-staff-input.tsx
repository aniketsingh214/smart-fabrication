'use client';
import { useEffect,useState } from 'react';
import type { Field } from '@/contracts/resources';
import { Button } from '@/components/ui/button';
type Staff={id:string;display_name:string;disabled?:boolean;user_roles?:{role_id:string}[]};
export function FollowupStaffInput({field,initial}:{field:Field;initial?:unknown}){
 const [value,setValue]=useState(String(initial??'')),[staff,setStaff]=useState<Staff[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(true),[retry,setRetry]=useState(0),[next,setNext]=useState<string|null>(null);
 useEffect(()=>{const controller=new AbortController();setBusy(true);setError('');
 void (async()=>{const response=await fetch('/api/v1/me',{signal:controller.signal}),body=await response.json();if(!response.ok)throw new Error(body.error?.message??'Unable to load your account');
 let choices:Staff[]=[{id:body.data.id,display_name:(body.data.display_name||'My account')+' (me)'}];
 if(body.data.permissions.includes('users.write')&&body.data.permissions.includes('users.read')){
  setStaff(choices);
  const result:Response=await fetch('/api/v1/admin/users?limit=100',{signal:controller.signal}),page:{data:Staff[];meta?:{nextCursor?:string|null};error?:{message?:string}}=await result.json();if(!result.ok)throw new Error(page.error?.message??'Unable to load staff');choices.push(...page.data.filter((user:Staff)=>!user.disabled&&user.user_roles?.some(role=>['owner','sales'].includes(role.role_id))));if(!controller.signal.aborted)setNext(page.meta?.nextCursor??null);
 }
 if(!controller.signal.aborted)setStaff([...new Map(choices.map(user=>[user.id,user])).values()]);
 })().catch(failure=>{if(!controller.signal.aborted)setError(failure.message);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});return()=>controller.abort();},[retry]);
 return <><select id={field.key} name={field.key} value={value} onChange={event=>setValue(event.target.value)}><option value="">Use lead assignment / owner reminder fallback</option>{value&&!staff.some(user=>user.id===value)&&<option value={value}>Previous assignment (not in active choices)</option>}{staff.map(user=><option key={user.id} value={user.id}>{user.display_name||'Unnamed staff'}</option>)}</select><p className="mt-2 text-xs text-slate-500">Select active sales/owner staff. Only staff administrators can assign another person. Clear an obsolete assignment to use the lead's reminder routing.</p>{next&&<Button type="button" variant="outline" size="sm" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const response=await fetch('/api/v1/admin/users?limit=100&cursor='+encodeURIComponent(next));const page=await response.json();if(!response.ok)throw new Error(page.error?.message??'Unable to load staff');setStaff(previous=>[...new Map([...previous,...page.data.filter((user:Staff)=>!user.disabled&&user.user_roles?.some(role=>['owner','sales'].includes(role.role_id)))].map(user=>[user.id,user])).values()]);setNext(page.meta?.nextCursor??null);}catch(error){setError(error instanceof Error?error.message:'Unable to load staff');}finally{setBusy(false);}}}>More active staff</Button>}{busy&&<p role="status" className="mt-2 text-xs">Loading active staff...</p>}{error&&<><p role="alert" className="mt-2 text-xs text-red-600">{error}</p><Button type="button" variant="outline" size="sm" onClick={()=>setRetry(value=>value+1)}>Retry staff</Button></>}</>;
}
