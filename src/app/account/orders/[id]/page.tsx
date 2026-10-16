import { notFound,redirect } from 'next/navigation';
import { serverClient } from '@/lib/supabase/server';
import { PublicHeader } from '@/components/layout/public-header';
import { dateTime,money } from '@/lib/utils';
import Link from 'next/link';
export default async function Timeline({params}:{params:Promise<{id:string}>}){const {id}=await params;const db=await serverClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login');const {data:owned}=await db.rpc('my_orders',{target:id});const order=owned?.[0];if(!order)notFound();const {data:history,error}=await db.rpc('customer_order_timeline',{target:id});return <><PublicHeader/><main className="mx-auto max-w-2xl px-5 py-12"><Link href="/account" className="text-xs text-orange-600">← My account</Link><h1 className="mt-6 text-3xl font-bold">{order.name}</h1><p className="mt-3 text-lg font-semibold">{money(order.total_minor)}</p><h2 className="mt-8 text-lg font-bold">Project timeline</h2>{error?<p className="mt-5 text-red-600">Timeline could not be loaded.</p>:<ol className="mt-6 space-y-5 border-l-2 border-orange-200 pl-6">{history?.map((h:{id:string;to_status:string;created_at:string})=><li key={h.id}><p className="text-sm font-semibold">{h.to_status.replaceAll('_',' ')}</p><p className="mt-2 text-xs text-slate-400">{dateTime(h.created_at)}</p></li>)}</ol>}</main></>;}

