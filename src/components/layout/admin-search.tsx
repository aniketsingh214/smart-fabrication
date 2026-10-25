'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
export function AdminSearch({targets}:{targets:{slug:string;label:string}[]}){
 const pathname=usePathname();
 const [target,setTarget]=useState(()=>targets.find(item=>pathname==='/admin/'+item.slug)?.slug??targets[0]?.slug??'leads');
 if(!targets.length)return <p className="text-sm font-semibold text-slate-600">Workshop workspace</p>;
 return <form action={'/admin/'+target} className="admin-header-search"><Search size={16} aria-hidden="true"/><input aria-label="Search admin records" name="q" type="search" placeholder="Search records..." required maxLength={120}/><select aria-label="Search module" value={target} onChange={event=>setTarget(event.target.value)}>{targets.map(item=><option key={item.slug} value={item.slug}>{item.label}</option>)}</select><button type="submit" className="sr-only">Search records</button></form>;
}
