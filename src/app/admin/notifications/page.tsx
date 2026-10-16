import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { dateTime } from '@/lib/utils';
import { ReadNotification } from '@/features/notifications/read-notification';
import { notificationPage } from '@/features/notifications/service';
export default async function Notifications({searchParams}:{searchParams:Promise<{cursor?:string}>}){
 const {cursor}=await searchParams;const db=await serverClient();const {data:{user}}=await db.auth.getUser();
 const result=await Promise.allSettled([user?notificationPage(db,user.id,new URLSearchParams(cursor?{cursor}:{})):Promise.reject(new Error('Unauthenticated'))]);const page=result[0];
 return <><p className="eyebrow text-orange-600">Your workspace</p><h1 className="mb-7 mt-3 text-3xl font-bold">Notifications</h1>{page.status==='rejected'?<p role="alert">Notifications could not be loaded. Return to the first page to retry.</p>:<section className="card divide-y divide-slate-100">{page.value.items.map(n=><article key={n.id} className="flex items-center justify-between gap-4 p-5"><div><h2 className="text-sm font-semibold">{n.name}</h2><p className="mt-2 text-xs text-slate-500">{n.body}</p><p className="mt-2 text-[10px] text-slate-400">{dateTime(n.created_at)}</p></div>{!n.read_at&&<ReadNotification id={n.id}/>}</article>)}{!page.value.items.length&&<p className="p-10 text-center text-sm text-slate-400">You are all caught up.</p>}</section>}<nav aria-label="Notification pages" className="mt-5 flex gap-4 text-sm text-orange-700">{(cursor||page.status==='rejected')&&<Link href="/admin/notifications">First page</Link>}{page.status==='fulfilled'&&page.value.nextCursor&&<Link href={'/admin/notifications?cursor='+encodeURIComponent(page.value.nextCursor)}>Older notifications</Link>}</nav></>;
}
