import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){const id=crypto.randomUUID();try{const {id:target}=await params;z.uuid().parse(target);const {db,user}=await requestContext(request);const updated=await db.from('notifications').update({read_at:new Date().toISOString()}).eq('id',target).eq('user_id',user.id).is('read_at',null);databaseError(updated.error);const {data,error}=await db.from('notifications').select('id,read_at').eq('id',target).eq('user_id',user.id).maybeSingle();databaseError(error);if(!data)throw new AppError('NOT_FOUND','Notification not found',404);return success(data,id);}catch(e){return failure(e,id);}}
