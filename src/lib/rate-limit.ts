import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { actorQuotas,isMutation,requestQuotas,type Quota } from '@/contracts/rate-limit';
const resultSchema=z.object({allowed:z.boolean(),remaining:z.number().int().nonnegative(),retry_after:z.number().int().positive(),reset_at:z.number().int().positive()});
export class RateLimitError extends AppError{constructor(public retryAfter:number,public limit:number,public resetAt:number){super('RATE_LIMITED',`Too many requests. Please try again in ${retryAfter} seconds.`,429,{retryAfter});}}
export function quotaKey(scope:string,identity:string){const secret=process.env.RATE_LIMIT_SECRET??process.env.SUPABASE_SECRET_KEY;if(!secret)throw new AppError('RATE_LIMIT_UNAVAILABLE','Saving is temporarily unavailable. Please retry shortly.',503);return createHmac('sha256',secret).update('form-quota:'+scope+':'+identity).digest('hex');}
export function clientAddress(request:Request){if(process.env.VERCEL==='1'){const ip=(request.headers.get('x-vercel-forwarded-for')??request.headers.get('x-forwarded-for')??'').split(',')[0].trim();return isIP(ip)?ip:'unknown-vercel-client';}return 'local-development';}
export async function consumeQuota(identity:string,quota:Quota){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;if(!url||!key)throw new AppError('RATE_LIMIT_UNAVAILABLE','Saving is temporarily unavailable. Please retry shortly.',503);
 // This privileged client calls only the isolated quota RPC, never business tables.
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(8000)})}});
 let raw;try{const {data,error}=await db.rpc('consume_request_quota',{bucket:quotaKey(quota.name,identity),max_hits:quota.limit,window_seconds:quota.seconds});if(error)throw new Error('Quota storage error');raw=resultSchema.parse(data);}catch{throw new AppError('RATE_LIMIT_UNAVAILABLE','Saving is temporarily unavailable. Please retry shortly.',503);}
 if(!raw.allowed)throw new RateLimitError(raw.retry_after,quota.limit,raw.reset_at);return {...raw,limit:quota.limit};
}
export async function enforceRequestLimit(request:Request){if(!isMutation(request.method))return null;let result=null;for(const quota of requestQuotas(new URL(request.url).pathname))result=await consumeQuota('ip:'+clientAddress(request),quota);return result;}
export async function enforceActorLimit(request:Request,userId:string){if(!isMutation(request.method))return;for(const quota of actorQuotas(new URL(request.url).pathname))await consumeQuota('actor:'+userId,quota);}
