'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ValidatedForm } from '@/components/validated-form';
import { Button } from '@/components/ui/button';
import { resourceMap } from '@/contracts/resources';
import { salesSearchRPC,salesSearchHint } from '@/contracts/sales-search';

type Preview={slug:string;rows:{id:string;name?:string;lead_id?:string;customer_id?:string}[];more:boolean;error?:string};
export function SalesWorkspaceSearch({permissions,initialQuery=''}:{permissions:string[];initialQuery?:string}){
 const router=useRouter();
 const [query,setQuery]=useState(initialQuery),[search,setSearch]=useState(initialQuery),[results,setResults]=useState<Preview[]>([]),[busy,setBusy]=useState(Boolean(initialQuery)),[generation,setGeneration]=useState(0);
 const permitted=Object.keys(salesSearchRPC).filter(slug=>permissions.includes(resourceMap[slug]!.domain+'.read')).join(',');
 useEffect(()=>{
  if(!search)return;
  const controller=new AbortController();
  void Promise.all(permitted.split(',').filter(Boolean).map(async slug=>{try{const response=await fetch('/api/v1/admin/'+slug+'?'+new URLSearchParams({q:search,limit:'5'}),{signal:controller.signal});const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'Search could not be completed');return {slug,rows:body.data,more:Boolean(body.meta?.nextCursor)} as Preview;}catch(error){return {slug,rows:[],more:false,error:error instanceof Error?error.message:'Search unavailable'};}})).then(rows=>{if(!controller.signal.aborted){setResults(rows);setBusy(false);}});
  return()=>controller.abort();
 },[search,permitted,generation]);
 return <section className="card my-4 p-4" aria-label="Search Sales and Customers">
  <h2 className="text-sm font-semibold">Find connected records</h2><p className="mt-1 text-xs text-slate-500">Search follows saved relationships. Verify contact identity before changing a linked customer.</p>
  <ValidatedForm role="search" className="mt-3 flex flex-wrap gap-2" onSubmit={event=>{event.preventDefault();if(!query.trim())return;setBusy(true);setResults([]);setSearch(query.trim());setGeneration(value=>value+1);router.replace('/admin/workspaces/sales?'+new URLSearchParams({q:query.trim()}));}}>
   <input aria-label="Search Sales and Customers" placeholder={salesSearchHint} value={query} maxLength={120} required onChange={event=>setQuery(event.target.value)} className="min-w-0 basis-full !w-full sm:basis-auto sm:flex-1 sm:!w-auto"/>
   <Button type="submit" className="flex-1 sm:flex-none">Search workspace</Button>{(query||search)&&<Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={()=>{setQuery('');setSearch('');setResults([]);setBusy(false);router.replace('/admin/workspaces/sales');}}>Clear</Button>}
  </ValidatedForm>
  {busy&&<p role="status" className="mt-3 text-xs">Searching permitted records...</p>}
  {!busy&&search&&<div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{results.map(result=><section key={result.slug} className="min-w-0 rounded-lg border border-slate-200 bg-white/70 p-3"><h3 className="text-xs font-semibold">{resourceMap[result.slug]!.title}</h3>{result.error?<p role="alert" className="mt-2 text-xs text-red-700">{result.error}</p>:<>{!result.rows.length?<p className="mt-2 text-xs text-slate-500">No linked records match.</p>:<ul className="mt-2 space-y-2">{result.rows.map(row=><li key={row.id}><Link className="block break-words text-xs text-orange-700 hover:underline" href={'/admin/'+result.slug+'?'+new URLSearchParams({record:row.id,q:search})}>{row.name??row.id}<span className="mt-0.5 block text-[10px] text-slate-500">{row.id}</span></Link></li>)}</ul>}<Link className="mt-3 inline-block text-xs font-semibold text-orange-700" href={'/admin/'+result.slug+'?'+new URLSearchParams({q:search})}>{result.more?'More matches':'Open filtered list'} &rarr;</Link></>}</section>)}</div>}
 </section>;
}
