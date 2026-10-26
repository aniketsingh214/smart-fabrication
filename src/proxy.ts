import { enforceRequestLimit } from '@/lib/rate-limit';
import { failure } from '@/lib/api';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function proxy(request:NextRequest){
  let response=NextResponse.next({request});
  if(request.nextUrl.pathname.startsWith('/api/v1/')){try{const quota=await enforceRequestLimit(request);if(quota){response.headers.set('X-RateLimit-IP-Limit',String(quota.limit));response.headers.set('X-RateLimit-IP-Remaining',String(quota.remaining));response.headers.set('X-RateLimit-IP-Reset',String(quota.reset_at));}return response;}catch(error){return failure(error,crypto.randomUUID());}}
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return response;
  const client=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll:(items)=>{items.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
  await client.auth.getUser();
  response.headers.set('Cache-Control','private, no-store');
  return response;
}
export const config={matcher:['/admin/:path*','/account/:path*','/login','/reset-password','/api/v1/:path*']};
