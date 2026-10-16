import Link from 'next/link';
import { redirect } from 'next/navigation';
import { serverClient } from '@/lib/supabase/server';
import { PublicHeader } from '@/components/layout/public-header';
import { SignOut } from '@/features/auth/sign-out';
import { AccountProjects,type AccountFilters } from '@/features/account/account-projects';
import { ProfileEditor } from '@/features/auth/profile-editor';

export const dynamic='force-dynamic';
export default async function Account({searchParams}:{searchParams:Promise<AccountFilters>}){const filters=await searchParams;const db=await serverClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login');const {data:profile}=await db.from('profiles').select('display_name,disabled').eq('id',user.id).single();if(profile?.disabled)return <main className="p-10">Your account is disabled. Contact the workshop.</main>;const {data:permissions}=await db.rpc('my_permissions');return <><PublicHeader/><main className="mx-auto max-w-6xl px-5 py-12"><div className="mb-8 flex items-center justify-between"><div><p className="eyebrow text-orange-600">Customer account</p><h1 className="mt-3 text-3xl font-bold">Welcome, {profile?.display_name||'there'}</h1></div><SignOut/></div>{permissions?.length>0&&<Link href="/admin" className="mb-6 inline-block rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Open workshop workspace →</Link>}<ProfileEditor name={profile?.display_name??''}/><AccountProjects db={db} filters={filters}/><p className="mt-8 text-xs text-slate-400">Guest enquiries are linked to customer accounts by authorized staff after verifying identity.</p></main></>;}
