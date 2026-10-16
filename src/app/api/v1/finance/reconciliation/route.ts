import type { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { databaseError,failure,success } from '@/lib/api';
import { reconciliationSchema } from '@/contracts/reconciliation';
export async function GET(request:NextRequest){const id=crypto.randomUUID();try{const {db}=await requestContext(request,'finance.read');const {data,error}=await db.rpc('finance_reconciliation');databaseError(error);return success(reconciliationSchema.parse(data),id);}catch(error){return failure(error,id);}}
