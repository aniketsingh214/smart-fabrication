import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError } from '@/lib/api';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){const id=crypto.randomUUID();try{const {id:target}=await params;z.uuid().parse(target);const {db}=await requestContext(request,'leads.read');const {data,error}=await db.from('lead_attachments').select('id,media_id,created_at').eq('lead_id',target);databaseError(error);return success(data,id);}catch(e){return failure(e,id);}}
