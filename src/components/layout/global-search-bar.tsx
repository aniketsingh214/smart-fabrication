'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import dynamic from 'next/dynamic';
import {Search,ArrowRight} from 'lucide-react';
import {useLocale} from '@/lib/i18n/locale-context';
const UnifiedSearchModal=dynamic(()=>import('@/features/search/unified-search-modal').then(module=>module.UnifiedSearchModal),{ssr:false});
export function GlobalSearchBar(){const {locale}=useLocale(),router=useRouter(),[query,setQuery]=useState(''),[open,setOpen]=useState(false);return <div className="relative w-full"><form className="royal-global-search flex items-center gap-2" onSubmit={event=>{event.preventDefault();router.push('/catalog'+(query.trim()?'?q='+encodeURIComponent(query.trim()):''));}}><div><Search size={17} aria-hidden="true"/></div><input aria-label="Search gates, railings and designs" placeholder={locale==='hi'?'\u0917\u0947\u091f, \u0930\u0947\u0932\u093f\u0902\u0917 \u092f\u093e \u0921\u093f\u091c\u093c\u093e\u0907\u0928 \u0916\u094b\u091c\u0947\u0902...':'Search gates, railings, designs...'} value={query} onChange={event=>setQuery(event.target.value)} onClick={()=>setOpen(true)} autoComplete="off"/><button type="submit" aria-label="Search catalogue"><ArrowRight size={16}/></button></form>{open&&<UnifiedSearchModal isOpen onClose={()=>setOpen(false)} initialQuery={query}/>}</div>;}
