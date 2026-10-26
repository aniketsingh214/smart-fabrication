'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { workspaceForPath,workspaceLinks,primaryParents } from '@/contracts/admin-navigation';
import { resourceMap } from '@/contracts/resources';
export function WorkspaceTabs({permissions}:{permissions:string[]}){
 const pathname=usePathname(),workspace=workspaceForPath(pathname);if(!workspace)return null;
 const current=pathname.split('/')[2],links=workspaceLinks(workspace,permissions,true),active=primaryParents[current]??current;
 const resource=resourceMap[current];if(resource&&permissions.includes(resource.domain+'.read')&&!links.some(link=>link.slug===active))links.push({slug:current,label:resource.title,path:'/admin/'+current,permission:resource.domain+'.read'});
 return <div className="mb-6 min-w-0"><Link href={'/admin/workspaces/'+workspace.key} className="mb-3 inline-block text-xs font-semibold text-blue-700">{workspace.label}</Link><nav aria-label={workspace.label+' sections'} className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5"><Link href={'/admin/workspaces/'+workspace.key} aria-current={pathname==='/admin/workspaces/'+workspace.key?'page':undefined} className="workspace-tab">Workspace</Link>{links.map(link=><Link key={link.slug} href={link.path} aria-current={link.slug===active||link.slug===current?'page':undefined} className="workspace-tab">{link.label}</Link>)}</nav></div>;
}
