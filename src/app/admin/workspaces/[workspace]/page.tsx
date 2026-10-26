import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight,FolderOpen } from 'lucide-react';
import { adminWorkspaces,workspaceLinks } from '@/contracts/admin-navigation';
import { serverClient } from '@/lib/supabase/server';
export default async function WorkspacePage({params}:{params:Promise<{workspace:string}>}){
 const {workspace:key}=await params,workspace=adminWorkspaces.find(item=>item.key===key);if(!workspace)notFound();
 const db=await serverClient(),{data,error}=await db.rpc('my_permissions');if(error)return <p role="alert">Workspace permissions could not be loaded.</p>;
 const permissions:string[]=data??[],all=workspaceLinks(workspace,permissions),preferred=workspaceLinks(workspace,permissions,true),primary=preferred.length?preferred:all.slice(0,3);
 if(!all.length)return <section className="card p-6"><h1 className="text-xl font-bold">Access restricted</h1><p className="mt-3 text-sm">Your role has no access to this workspace.</p></section>;
 return <><p className="eyebrow">WORKSPACE</p><h1 className="mt-2 text-2xl font-bold">{workspace.label}</h1><p className="mt-2 text-sm text-slate-500">{workspace.description}</p><section aria-label="Workspace main lists" className="my-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{primary.map(link=><Link key={link.slug} href={link.path} className="card flex items-center justify-between gap-3 p-5 hover:border-blue-300"><span className="flex items-center gap-3 text-sm font-semibold"><FolderOpen size={19} className="text-blue-600"/>{link.label}</span><ArrowUpRight size={16}/></Link>)}</section><section className="card p-5" aria-label="All workspace lists and history"><h2 className="text-base font-bold">All lists & history</h2><p className="mt-2 text-xs text-slate-500">Global collections remain available here. Open an individual record for its linked notes, items, rates and workflow tabs.</p><div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{all.map(link=><Link key={link.slug} href={link.path} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-sm hover:bg-blue-50">{link.label}<ArrowUpRight size={13}/></Link>)}</div></section></>;
}
