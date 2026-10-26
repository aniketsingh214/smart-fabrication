'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutGrid,List,ChevronLeft,ChevronRight } from 'lucide-react';
import { workspaceForPath,workspaceLinks,primaryParents } from '@/contracts/admin-navigation';
import { resourceMap } from '@/contracts/resources';
export function WorkspaceTabs({permissions}:{permissions:string[]}){
 const pathname=usePathname(),[collapsed,setCollapsed]=useState(false),workspace=workspaceForPath(pathname);if(!workspace)return null;
 const current=pathname.split('/')[2],links=workspaceLinks(workspace,permissions,true),active=primaryParents[current]??current;
 const resource=resourceMap[current];if(resource&&permissions.includes(resource.domain+'.read')&&!links.some(link=>link.slug===active))links.push({slug:current,label:resource.title,path:'/admin/'+current,permission:resource.domain+'.read'});
 return <aside className="admin-secondary-sidebar" data-collapsed={collapsed} aria-label="Workspace menu"><div className="admin-secondary-heading"><div><strong>{workspace.label}</strong><p>Workspace pages</p></div><button onClick={()=>setCollapsed(!collapsed)} aria-label={collapsed?'Expand section menu':'Collapse section menu'} aria-expanded={!collapsed}>{collapsed?<ChevronRight size={18}/>:<ChevronLeft size={18}/>}</button></div><div className="admin-secondary-body"><p className="admin-secondary-caption">MANAGEMENT</p><nav aria-label={workspace.label+' sections'}><Link href={'/admin/workspaces/'+workspace.key} aria-current={pathname==='/admin/workspaces/'+workspace.key?'page':undefined} className="workspace-tab"><LayoutGrid size={17}/>Overview & all lists</Link>{links.map(link=><Link key={link.slug} href={link.path} aria-current={link.slug===active||link.slug===current?'page':undefined} className="workspace-tab"><List size={17}/>{link.label}</Link>)}</nav><Link href={'/admin/workspaces/'+workspace.key+'#workspace-history'} className="admin-secondary-history">All lists & history &rarr;</Link></div></aside>;
}
