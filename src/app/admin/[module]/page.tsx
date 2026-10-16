import { notFound } from 'next/navigation';
import { resourceMap } from '@/contracts/resources';
import { serverClient } from '@/lib/supabase/server';
import { ResourceWorkspace } from '@/features/operations/resource-workspace';
export default async function ModulePage({params}:{params:Promise<{module:string}>}){const {module}=await params;const resource=resourceMap[module];if(!resource)notFound();const db=await serverClient();const {data:permissions}=await db.rpc('my_permissions');const p:string[]=permissions??[];if(!p.includes(`${resource.domain}.read`))return <div className="card p-8"><h1 className="text-xl font-bold">Access restricted</h1><p className="mt-3 text-sm text-slate-500">Your role does not include access to {resource.title.toLowerCase()}.</p></div>;return <ResourceWorkspace key={resource.slug} resource={resource} permissions={p}/>;}
