'use client';
import { useRef,useState } from 'react';
import { browserClient } from '@/lib/supabase/browser';

export function SignOut(){const [busy,setBusy]=useState(false),[error,setError]=useState('');const running=useRef(false);return <div><button disabled={busy} className="text-sm text-slate-500 hover:text-orange-600" onClick={async()=>{if(running.current)return;running.current=true;setBusy(true);setError('');try{const {error:failure}=await browserClient().auth.signOut();if(failure)throw failure;location.assign(new URL('/',location.origin).href);}catch{setError('Unable to sign out. Please retry.');}finally{running.current=false;setBusy(false);}}}>{busy?'Signing out…':'Sign out'}</button>{error&&<p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}</div>;}


