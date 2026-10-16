'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
export function ReadNotification({id}:{id:string}){const [busy,setBusy]=useState(false),[error,setError]=useState('');return <div><Button size="sm" variant="outline" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const r=await fetch(`/api/v1/notifications/${id}/read`,{method:'POST'});if(!r.ok)throw new Error();location.reload();}catch{setError('Unable to mark read. Please retry.');}finally{setBusy(false);}}}>Mark read</Button>{error&&<p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}</div>;}
