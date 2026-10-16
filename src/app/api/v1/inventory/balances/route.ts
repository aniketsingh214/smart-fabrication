import type { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError } from '@/lib/api';
export async function GET(request:NextRequest){const id=crypto.randomUUID();try{const {db}=await requestContext(request,'inventory.read');const {data,error}=await db.rpc('inventory_balances');databaseError(error);return success(data,id);}catch(e){return failure(e,id);}}
