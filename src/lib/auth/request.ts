import 'server-only';
import { serverClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/errors';
import type { NextRequest } from 'next/server';
export async function requestContext(request:NextRequest,permission?:string|string[]){
  const authorization=request.headers.get('authorization');
  if(authorization&&!/^Bearer \S+$/i.test(authorization))throw new AppError('UNAUTHENTICATED','Invalid authorization header',401);
  const token=authorization?.slice(7);
  if(!['GET','HEAD','OPTIONS'].includes(request.method)&&!token){
    const origin=request.headers.get('origin');
    const allowed=new Set([process.env.NEXT_PUBLIC_APP_URL,request.nextUrl.origin].filter(Boolean));
    if(!origin||!allowed.has(origin))throw new AppError('CSRF_REJECTED','Request origin is not allowed',403);
  }
  const db=await serverClient(token);
  const {data:{user},error}=await db.auth.getUser(token);
  if(error||!user)throw new AppError('UNAUTHENTICATED','Please sign in',401);
  const {data:profile,error:profileError}=await db.from('profiles').select('id,display_name,disabled').eq('id',user.id).single();
  if(profileError||!profile||profile.disabled)throw new AppError('ACCOUNT_DISABLED','Account is not active',403);
  if(permission){const permissions=Array.isArray(permission)?permission:[permission];const checks=await Promise.all(permissions.map(requested=>db.rpc('has_permission',{requested})));if(!checks.some(result=>!result.error&&result.data))throw new AppError('FORBIDDEN','You do not have permission for this action',403);}
  return {db,user,profile};
}
