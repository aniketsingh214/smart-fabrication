'use client';
import { useRef,useState,type ReactNode } from 'react';
import Link from 'next/link';
import { resourceMap } from '@/contracts/resources';
import { recordRelations,type RecordContext } from '@/contracts/record-context';
import { PurchaseAttachments } from '@/features/media/purchase-attachments';
export function RecordContextPanel({parent,id,name,permissions,children,renderRelated}:{parent:string;id:string;name:string;permissions:string[];children:ReactNode;renderRelated:(slug:string,context:RecordContext)=>ReactNode}){
 const [active,setActive]=useState('details'),tabsRef=useRef<HTMLDivElement>(null);
 const related=recordRelations.filter(relation=>relation.parent===parent&&!relation.hidden&&permissions.includes(resourceMap[relation.child]!.domain+'.read'));
 const invoice=parent==='purchases'&&permissions.includes('finance.read');
 if(!related.length&&!invoice)return <>{children}</>;
 const tabs=[{key:'details',label:parent==='orders'?'Overview':'Details'},...related.map(relation=>({key:relation.child,label:relation.label}))];
 if(invoice)tabs.splice(Math.min(2,tabs.length),0,{key:'invoice',label:'Invoice'});
 return <><div ref={tabsRef} role="tablist" aria-label="Record sections" className="record-context-tabs" onKeyDown={event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();const position=tabs.findIndex(tab=>tab.key===active),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(position+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;setActive(tabs[next].key);tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus();}}>{tabs.map(tab=><button key={tab.key} type="button" id={`tab-${id}-${tab.key}`} aria-controls={`panel-${id}`} role="tab" aria-selected={active===tab.key} tabIndex={active===tab.key?0:-1} onClick={()=>setActive(tab.key)}>{tab.label}</button>)}</div><div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}-${active}`} className="min-w-0 pt-5">{active==='details'?children:active==='invoice'?<PurchaseAttachments purchaseId={id} canAttach={permissions.includes('purchases.write')&&permissions.includes('finance.write')}/>:<><div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><span>Linked to: <strong>{name}</strong></span><Link className="font-semibold text-blue-700" href={'/admin/'+active}>Open all {resourceMap[active]?.title.toLowerCase()}</Link></div>{active==='purchase-returns'&&<p className="mb-4 text-xs text-slate-500">To post a return, open Items and view the relevant purchase item.</p>}{renderRelated(active,{parent,id,name})}</>}</div></>;
}
