import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { RoleEditor } from '@/features/auth/role-editor';
import { PermissionEditor } from '@/features/auth/permission-editor';
import { AccountStatus } from '@/features/auth/account-status';
import { userPage,type StaffRow } from '@/features/auth/user-page';
export default async function Users({searchParams}:{searchParams:Promise<{cursor?:string}>}){
 const {cursor}=await searchParams,db=await serverClient();
 const {data:allowed}=await db.rpc('has_permission',{requested:'users.read'});
 if(!allowed)return <p>Staff permissions are restricted to the owner.</p>;
 const [page,{data:permissions},{data:grants},{data:canWrite}]=await Promise.all([
  userPage(db,new URLSearchParams({limit:'25',...(cursor?{cursor}:{})})).then(value=>({value,error:false})).catch(()=>({value:{items:[] as StaffRow[],nextCursor:null},error:true})),
  db.from('permissions').select('id').order('id'),db.from('role_permissions').select('role_id,permission_id'),db.rpc('has_permission',{requested:'users.write'}),
 ]);
 return <><p className="eyebrow text-orange-600">System</p><h1 className="mb-3 mt-3 text-3xl font-bold">Staff & permissions</h1><p className="mb-7 text-sm text-slate-500">New accounts start as customers. Staff access is explicitly assigned and can be revoked immediately.</p>
 {page.error?<p role="alert">Staff could not be loaded. Return to the first page to retry.</p>:<section className="card divide-y divide-slate-100">{page.value.items.map(user=><article key={user.id} className="p-5"><h2 className="font-semibold">{user.display_name||'Unnamed account'}</h2><p className="mt-1 text-[10px] text-slate-400">{user.id}</p>{canWrite&&<><RoleEditor id={user.id} current={user.user_roles.map(r=>r.role_id)}/><AccountStatus id={user.id} disabled={user.disabled}/></>}</article>)}</section>}
 <nav aria-label="Staff pages" className="my-5 flex gap-4 text-sm text-orange-700">{(cursor||page.error)&&<Link href="/admin/users">First staff page</Link>}{page.value.nextCursor&&<Link href={'/admin/users?cursor='+encodeURIComponent(page.value.nextCursor)}>Older accounts</Link>}</nav>
 {canWrite&&permissions&&grants&&<PermissionEditor permissions={permissions} grants={grants}/>}</>;
}
