'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useId } from 'react';
import { FaIcon } from '@/components/fa-icon';
import { SignOut } from '@/features/auth/sign-out';
import { browserClient } from '@/lib/supabase/browser';

type Identity = { display_name?: string; permissions: string[] };
export function AccountMenu({identity, label='My account', variant='public'}:{identity?:Identity;label?:string;variant?:'admin'|'public'}) {
 const [open,setOpen]=useState(false),[customer,setCustomer]=useState<Identity|null>(null);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),id=useId();
 const person=identity??customer;
 useEffect(()=>{
  if(variant==='admin')return;
  let live=true;
  async function resolve(){try{const {data:{user}}=await browserClient().auth.getUser();if(!live)return;if(!user){setCustomer(null);return;}const response=await fetch('/api/v1/me',{cache:'no-store'});if(response.ok){const result=await response.json();if(live)setCustomer(result.data);}}catch{if(live)setCustomer(null);}}
  void resolve();
  const {data:{subscription}}=browserClient().auth.onAuthStateChange(()=>{queueMicrotask(()=>{if(live)void resolve();});});
  return()=>{live=false;subscription.unsubscribe();};
 },[variant]);
 useEffect(()=>{if(!open)return;function outside(event:PointerEvent){if(!root.current?.contains(event.target as Node))setOpen(false);}function escape(event:KeyboardEvent){if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}}document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[open]);
 const links=variant==='admin'?[{href:'/account',label:'My account',icon:'user'},...(person?.permissions.includes('settings.read')?[{href:'/admin/workspaces/settings',label:'Settings',icon:'gear'}]:[]),...(person?.permissions.includes('users.read')?[{href:'/admin/users',label:'Staff & permissions',icon:'user-shield'}]:[])]:[{href:'/account',label:person?'My account':'Sign in / My account',icon:'user'},{href:'/wishlist',label:'Saved designs',icon:'heart'},{href:'/cart',label:'Project cart',icon:'cart-shopping'},...(person?.permissions.length?[{href:'/admin',label:'Admin workspace',icon:'gauge-high'}]:[])];
 return <div ref={root} className={'royal-account royal-account-'+variant} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
  <button ref={trigger} type="button" className="royal-account-trigger" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setOpen(true);requestAnimationFrame(()=>root.current?.querySelector<HTMLAnchorElement>('.royal-account-panel a')?.focus());}}}>
   {variant==='admin'?<span className="admin-avatar">{person?.display_name?.slice(0,2).toUpperCase()||'RG'}</span>:<FaIcon name="user"/>}
   <span className="royal-account-label">{variant==='admin'?person?.display_name||label:label}</span><FaIcon name="chevron-down"/>
  </button>
  {open&&<div id={id} className="royal-account-panel"><div className="royal-account-heading"><strong>{person?.display_name||'Welcome to Royal Gates'}</strong><span>{variant==='admin'?'Workshop account':'Your designs and project'}</span></div><nav aria-label="Account options">{links.map(link=><Link key={link.href} href={link.href} onClick={()=>setOpen(false)}><FaIcon name={link.icon}/>{link.label}</Link>)}</nav>{person&&<div className="royal-account-signout"><SignOut/></div>}</div>}
 </div>;
}
