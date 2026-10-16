import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError,jsonBody } from '@/lib/api';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){const id=crypto.randomUUID();try{const {id:target}=await params;z.uuid().parse(target);const {disabled}=z.object({disabled:z.boolean()}).strict().parse(await jsonBody(request));const {db}=await requestContext(request,'users.write');const {error}=await db.rpc('disable_user',{target,disabled_value:disabled});databaseError(error);return success({id:target,disabled},id);}catch(e){return failure(e,id);}}
