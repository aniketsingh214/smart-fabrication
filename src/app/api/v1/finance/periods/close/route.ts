import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,jsonBody,databaseError } from '@/lib/api';
import { periodClosureSchema } from '@/contracts/finance-corrections';
export async function POST(request:NextRequest){const id=crypto.randomUUID();try{const payload={...periodClosureSchema.parse(await jsonBody(request)),idempotency_key:z.uuid().parse(request.headers.get('idempotency-key'))};const {db}=await requestContext(request,'finance.approve');const {data,error}=await db.rpc('close_finance_period',{payload});databaseError(error);return success({id:data},id,201);}catch(e){return failure(e,id);}}
