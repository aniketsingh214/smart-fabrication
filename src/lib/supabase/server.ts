import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabaseEnv } from './env';
export async function serverClient(bearer?:string) {
  const {url,key}=supabaseEnv();
  if(bearer) return createClient(url,key,{global:{headers:{Authorization:`Bearer ${bearer}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const store=await cookies();
  return createServerClient(url,key,{cookies:{getAll:()=>store.getAll(),setAll:(items)=>{try{items.forEach(({name,value,options})=>store.set(name,value,options));}catch{/* Read-only Server Components cannot write; proxy handles refresh. */}}}});
}
