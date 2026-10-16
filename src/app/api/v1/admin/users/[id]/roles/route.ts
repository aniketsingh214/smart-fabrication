import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError,jsonBody } from '@/lib/api';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){const id=crypto.randomUUID();try{const {id:target}=await params;z.uuid().parse(target);const {role,enabled}=z.object({role:z.enum(['owner','sales','production','accounts','content','customer']),enabled:z.boolean()}).strict().parse(await jsonBody(request));const {db}=await requestContext(request,'users.write');const {error}=await db.rpc('set_user_role',{target,role_name:role,enabled});databaseError(error);return success({id:target,role,enabled},id);}catch(e){return failure(e,id);}}
