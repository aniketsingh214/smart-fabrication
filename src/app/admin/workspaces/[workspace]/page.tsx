import { SalesWorkspaceSearch } from '@/features/leads/sales-workspace-search';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight,FolderOpen } from 'lucide-react';
import { adminWorkspaces,workspaceLinks } from '@/contracts/admin-navigation';
import { serverClient } from '@/lib/supabase/server';
import { PurchasesDashboard } from '@/features/procurement/purchases-dashboard';

export default async function WorkspacePage({params,searchParams}:{params:Promise<{workspace:string}>;searchParams:Promise<{q?:string}>}){
 const filters=await searchParams;
 const {workspace:key}=await params,workspace=adminWorkspaces.find(item=>item.key===key);if(!workspace)notFound();
 const db=await serverClient(),{data,error}=await db.rpc('my_permissions');if(error)return <p role="alert">Workspace permissions could not be loaded.</p>;
 const permissions:string[]=data??[],all=workspaceLinks(workspace,permissions),preferred=workspaceLinks(workspace,permissions,true),primary=preferred.length?preferred:all.slice(0,3);
 if(!all.length)return <section className="card p-6"><h1 className="text-xl font-bold">Access restricted</h1><p className="mt-3 text-sm">Your role has no access to this workspace.</p></section>;

 if(key==='inventory'){
  const now=new Date();
  const startOfMonth=new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10);
  const {data:purchases}=await db.from('purchases').select('id,name,supplier_id,bill_number,bill_date,total_minor,status,created_at').order('created_at',{ascending:false}).limit(10);
  const {data:suppliers}=await db.from('suppliers').select('id,name,phone');
  const {data:payables}=await db.rpc('payable_balances');
  const {data:payments}=await db.from('supplier_payments').select('amount_minor,created_at');

  const supplierMap=new Map((suppliers??[]).map((s:any)=>[s.id,s]));
  const recentPurchases=(purchases??[]).map((p:any)=>({
    id:p.id,
    bill_number:p.bill_number,
    supplier_name:supplierMap.get(p.supplier_id)?.name||'Supplier',
    bill_date:p.bill_date,
    total_minor:p.total_minor,
    status:p.status
  }));

  const thisMonthPurchases=(purchases??[]).filter((p:any)=>p.bill_date>=startOfMonth).reduce((sum:number,p:any)=>sum+Number(p.total_minor),0);
  const thisMonthPayments=(payments??[]).filter((pay:any)=>pay.created_at>=startOfMonth).reduce((sum:number,pay:any)=>sum+Number(pay.amount_minor),0);

  let totalDue=0;
  const dueMap=new Map<string,number>();
  for(const pay of payables??[]){
    const due=Number(pay.outstanding_minor);
    if(due>0){
      totalDue+=due;
      dueMap.set(pay.supplier_id,(dueMap.get(pay.supplier_id)??0)+due);
    }
  }

  const suppliersWithDue=Array.from(dueMap.entries()).map(([supId,due])=>{
    const sup=supplierMap.get(supId);
    return {id:supId,name:sup?.name||'Supplier',phone:sup?.phone,outstanding_minor:due};
  });

  return <PurchasesDashboard data={{
    thisMonthPurchasesMinor:thisMonthPurchases,
    thisMonthPaymentsMinor:thisMonthPayments,
    totalDueMinor:totalDue,
    totalSuppliersCount:suppliers?.length??0,
    recentPurchases,
    suppliersWithDue,
  }}/>;
 }

 return <><p className="eyebrow">WORKSPACE</p><h1 className="mt-2 text-2xl font-bold">{workspace.label}</h1><p className="mt-2 text-sm text-slate-500">{workspace.description}</p>{key==='sales'&&<SalesWorkspaceSearch key={filters.q??''} permissions={permissions} initialQuery={typeof filters.q==='string'?filters.q.slice(0,120):''}/>}<section aria-label="Workspace main lists" className="admin-workspace-launchers my-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{primary.map(link=><Link key={link.slug} href={link.path} className="card flex items-center justify-between gap-3 p-5 hover:border-blue-300"><span className="flex items-center gap-3 text-sm font-semibold"><FolderOpen size={19} className="text-blue-600"/>{link.label}</span><ArrowUpRight size={16}/></Link>)}</section><section className="card p-5" id="workspace-history" aria-label="All workspace lists and history"><h2 className="text-base font-bold">All lists & history</h2><p className="mt-2 text-xs text-slate-500">Global collections remain available here. Open an individual record for its linked notes, items, rates and workflow tabs.</p><div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{all.map(link=><Link key={link.slug} href={link.path} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-sm hover:bg-blue-50">{link.label}<ArrowUpRight size={13}/></Link>)}</div></section></>;
}
