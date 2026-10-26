'use client';
import { useState,useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const subscribe=()=>()=>{};
export function AuthForm(){
  const ready=useSyncExternalStore(subscribe,()=>true,()=>false);

  const [mode,setMode]=useState<'login'|'signup'|'reset'>('login'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function submit(form:FormData){setBusy(true);setMessage('');try{const email=String(form.get('email')),password=String(form.get('password')??'');const response=await fetch('/api/v1/auth/form',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,email,...(mode!=='reset'?{password}:{}),...(mode==='signup'?{name:form.get('name')}:{})})});const body=await response.json();if(!response.ok){setMessage(body.error?.message??'Unable to save. Please retry.');return;}
    if(mode==='login'){location.assign(new URL('/account',location.origin).href);}else setMessage('Check your email for the next step.');
  }catch{setMessage('Unable to connect. Please try again.');}finally{setBusy(false);}}
  return <main className="grid min-h-screen place-items-center bg-slate-950 px-5"><section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"><Link href="/" className="inline-block"><Image src="/gatewala-logo-transparent.png" alt="GateWala - मजबूती भी, खूबसूरती भी।" width={280} height={88} unoptimized className="h-13 w-auto object-contain"/></Link><h1 className="mt-8 text-2xl font-bold">{mode==='login'?'Welcome back':mode==='signup'?'Create your account':'Reset your password'}</h1><p className="mt-2 text-sm text-slate-500">Your quotations, orders and workshop in one place.</p><form method="post" onSubmit={event=>{event.preventDefault();if(!busy)void submit(new FormData(event.currentTarget));}} className="mt-7 space-y-4">{mode==='signup'&&<label className="block">Full name<input name="name" required maxLength={120} autoComplete="name" className="mt-2"/></label>}<label className="block">Email<input name="email" type="email" required autoComplete="email" className="mt-2"/></label>{mode!=='reset'&&<label className="block">Password<input name="password" type="password" minLength={8} required autoComplete={mode==='login'?'current-password':'new-password'} className="mt-2"/></label>}{message&&<p role="status" className="rounded-lg bg-orange-50 p-3 text-sm text-orange-900">{message}</p>}<Button className="w-full" disabled={!ready||busy}>{busy?'Please wait…':mode==='login'?'Sign in':mode==='signup'?'Create account':'Send reset email'}</Button></form><div className="mt-5 flex justify-between text-xs"><button disabled={!ready||busy} onClick={()=>{setMode(mode==='signup'?'login':'signup');setMessage('');}} className="text-orange-700">{mode==='signup'?'Already have an account?':'Create customer account'}</button><button disabled={!ready||busy} onClick={()=>{setMode(mode==='reset'?'login':'reset');setMessage('');}} className="text-slate-500">{mode==='reset'?'Back to sign in':'Forgot password?'}</button></div></section></main>;
}





