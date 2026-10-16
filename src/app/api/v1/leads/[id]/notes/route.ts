import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError,jsonBody } from '@/lib/api';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){const id=crypto.randomUUID();try{const {id:lead}=await params;z.uuid().parse(lead);const {db}=await requestContext(request,'leads.read');const {data,error}=await db.from('lead_notes').select('id,note,created_at,created_by').eq('lead_id',lead).order('created_at',{ascending:false}).limit(100);databaseError(error);return success(data,id);}catch(e){return failure(e,id);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){const id=crypto.randomUUID();try{const {id:lead}=await params;z.uuid().parse(lead);const {db}=await requestContext(request,'leads.write');const {note}=z.object({note:z.string().trim().min(1).max(2000)}).strict().parse(await jsonBody(request));const {data,error}=await db.from('lead_notes').insert({lead_id:lead,note}).select('id,note,created_at').single();databaseError(error);return success(data,id,201);}catch(e){return failure(e,id);}}
