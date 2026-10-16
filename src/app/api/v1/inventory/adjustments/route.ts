import type { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError,jsonBody } from '@/lib/api';
import { stockSchema } from '@/contracts/workflows';
export async function POST(request:NextRequest){const id=crypto.randomUUID();try{const payload=stockSchema.parse({...await jsonBody(request),idempotency_key:request.headers.get('idempotency-key')}),{db}=await requestContext(request,payload.kind==='consumption'?'production.write':'inventory.approve');const {data,error}=await db.rpc('post_stock',{payload});databaseError(error);return success({id:data},id,201);}catch(e){return failure(e,id);}}
