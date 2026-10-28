'use client';
import { validatedFormData,apiFormError,reportFormError } from '@/lib/form-errors';
import { ValidatedForm } from '@/components/validated-form';
import { safeReturnPath } from '@/lib/return-path';
import { useState,useSyncExternalStore } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { FaIcon } from '@/components/fa-icon';
import { Button } from '@/components/ui/button';

const subscribe=()=>()=>{};
export function AuthForm(){
  const ready=useSyncExternalStore(subscribe,()=>true,()=>false);

  const [mode,setMode]=useState<'login'|'signup'|'reset'>('login'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function submit(form:FormData){setBusy(true);setMessage('');try{const email=String(form.get('email')),password=String(form.get('password')??'');const response=await fetch('/api/v1/auth/form',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,email,...(mode!=='reset'?{password}:{}),...(mode==='signup'?{name:form.get('name')}:{})})});const body=await response.json();if(!response.ok){if(reportFormError(form,apiFormError(body.error,'Check your details.')))return;setMessage(body.error?.message??'Unable to save. Please retry.');return;}
    if(mode==='login'){location.assign(new URL(safeReturnPath(new URLSearchParams(location.search).get('next')),location.origin).href);}else setMessage('Check your email for the next step.');
  }catch{setMessage('Unable to connect. Please try again.');}finally{setBusy(false);}}
  return <main className="royal-auth"><aside className="royal-auth-brand"><Link href="/" aria-label="Royal Gates home"><BrandLogo variant="auth" background/></Link><div><p className="eyebrow">ROYAL GATES WORKSPACE</p><h2>Every detail.<br/>One workspace.</h2><p>Your designs, customer conversations and workshop operations, connected.</p><span><FaIcon name="shield-halved"/> Account access is protected</span></div></aside><section className="royal-auth-card"><Link href="/" className="royal-auth-mobile-brand" aria-label="Royal Gates home"><BrandLogo/></Link><h1 className="mt-8 text-2xl font-bold">{mode==='login'?'Welcome back':mode==='signup'?'Create your account':'Reset your password'}</h1><p className="mt-2 text-sm text-slate-500">Your quotations, orders and workshop in one place.</p><ValidatedForm method="post" onSubmit={event=>{event.preventDefault();if(!busy)void submit(validatedFormData(event.currentTarget));}} className="mt-7 space-y-4">{mode==='signup'&&<label className="block">Full name<input name="name" required maxLength={120} autoComplete="name" className="mt-2"/></label>}<label className="block">Email<input name="email" type="email" required autoComplete="email" className="mt-2"/></label>{mode!=='reset'&&<label className="block">Password<input name="password" type="password" minLength={8} required autoComplete={mode==='login'?'current-password':'new-password'} className="mt-2"/></label>}{message&&<p role="status" className="rounded-lg bg-orange-50 p-3 text-sm text-orange-900">{message}</p>}<Button className="w-full" disabled={!ready||busy}>{busy?'Please wait…':mode==='login'?'Sign in':mode==='signup'?'Create account':'Send reset email'}</Button></ValidatedForm><div className="mt-5 flex justify-between text-xs"><button disabled={!ready||busy} onClick={()=>{setMode(mode==='signup'?'login':'signup');setMessage('');}} className="text-orange-700">{mode==='signup'?'Already have an account?':'Create customer account'}</button><button disabled={!ready||busy} onClick={()=>{setMode(mode==='reset'?'login':'reset');setMessage('');}} className="text-slate-500">{mode==='reset'?'Back to sign in':'Forgot password?'}</button></div></section></main>;
}





