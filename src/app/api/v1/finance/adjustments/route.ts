import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,jsonBody,databaseError } from '@/lib/api';
import { financialCorrectionSchema } from '@/contracts/finance-corrections';
export async function POST(request:NextRequest){const id=crypto.randomUUID();try{const payload={...financialCorrectionSchema.parse(await jsonBody(request)),idempotency_key:z.uuid().parse(request.headers.get('idempotency-key'))};const {db}=await requestContext(request,'finance.approve');const {data,error}=await db.rpc('post_financial_adjustment',{payload});databaseError(error);return success({id:data},id,201);}catch(e){return failure(e,id);}}
