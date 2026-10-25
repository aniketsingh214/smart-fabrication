import { AdminCollection } from '@/components/admin-collection';
import { serverClient } from '@/lib/supabase/server';
import { notificationPage } from '@/features/notifications/service';
export default async function Notifications({searchParams}:{searchParams:Promise<{cursor?:string}>}){
 const {cursor}=await searchParams;const db=await serverClient();const {data:{user}}=await db.auth.getUser();
 const result=await Promise.allSettled([user?notificationPage(db,user.id,new URLSearchParams(cursor?{cursor}:{})):Promise.reject(new Error('Unauthenticated'))]);const page=result[0];
 return <><p className="eyebrow text-orange-600">Your workspace</p><h1 className="mb-7 mt-3 text-3xl font-bold">Notifications</h1>{page.status==='rejected'?<p role="alert">Notifications could not be loaded. Return to the first page to retry.</p>:<AdminCollection kind="notifications" initial={page.value.items} nextCursor={page.value.nextCursor} initialCursor={cursor}/>}</>;
}
