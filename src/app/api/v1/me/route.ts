import type { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { failure,success,jsonBody,databaseError } from '@/lib/api';
import { z } from 'zod';
export async function GET(request:NextRequest){const id=crypto.randomUUID();try{const {profile,db}=await requestContext(request);const [permissions,customer]=await Promise.all([db.rpc('my_permissions'),db.rpc('my_customer_profile')]);databaseError(permissions.error);databaseError(customer.error);return success({...profile,permissions:permissions.data??[],customer:customer.data??null},id);}catch(e){return failure(e,id);}}
export async function PATCH(request:NextRequest){const id=crypto.randomUUID();try{const p=z.object({display_name:z.string().trim().min(2).max(120)}).strict().parse(await jsonBody(request));const {db,user}=await requestContext(request);const {data,error}=await db.from('profiles').update(p).eq('id',user.id).select('id,display_name').single();databaseError(error);return success(data,id);}catch(e){return failure(e,id);}}

