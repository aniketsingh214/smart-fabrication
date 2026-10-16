import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError,jsonBody } from '@/lib/api';
export async function POST(request:NextRequest){const id=crypto.randomUUID();try{const payload=z.object({purchase_item_id:z.uuid(),quantity:z.number().positive(),reason:z.string().min(3).max(500),idempotency_key:z.uuid()}).strict().parse({...await jsonBody(request),idempotency_key:request.headers.get('idempotency-key')});const {db}=await requestContext(request,'purchases.approve');const {data,error}=await db.rpc('return_purchase_item',{payload});databaseError(error);return success({id:data},id,201);}catch(e){return failure(e,id);}}
