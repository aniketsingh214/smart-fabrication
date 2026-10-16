'use client';
import { useState } from 'react';
import { browserClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
export default function Reset(){const router=useRouter();const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);return <main className="mx-auto max-w-md p-8"><h1 className="mb-6 text-2xl font-bold">Choose a new password</h1><form action={async(f)=>{setBusy(true);try{const {error}=await browserClient().auth.updateUser({password:String(f.get('password'))});if(error)setMessage(error.message);else{router.replace('/account');router.refresh();}}catch{setMessage('Unable to update password. Please try again.');}finally{setBusy(false);}}} className="space-y-4"><label>New password<input name="password" type="password" minLength={8} required autoComplete="new-password"/></label><Button disabled={busy}>Update password</Button><p role="status">{message}</p></form></main>;}
