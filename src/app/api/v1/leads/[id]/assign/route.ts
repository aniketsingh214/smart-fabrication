import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError,jsonBody } from '@/lib/api';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){const id=crypto.randomUUID();try{const {id:target}=await params;z.uuid().parse(target);const {staff_user}=z.object({staff_user:z.uuid()}).strict().parse(await jsonBody(request));const {db}=await requestContext(request,'leads.write');const {error}=await db.rpc('assign_lead',{target,staff_user});databaseError(error);return success({id:target,assigned_to:staff_user},id);}catch(e){return failure(e,id);}}
