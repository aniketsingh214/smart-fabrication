import { ownedMediaPage } from '@/features/media/owned-page';
import type { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { signUpload,confirmUpload,mediaDeliveryUrl } from '@/lib/cloudinary/service';
import { failure,success,jsonBody } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
export async function GET(request:NextRequest,{params}:{params:Promise<{action:string}>}){const id=crypto.randomUUID();try{const {action}=await params,{db,user}=await requestContext(request);if(action==='mine'){const page=await ownedMediaPage(db,user.id,request.nextUrl.searchParams);return success(page.items,id,200,{nextCursor:page.nextCursor});}z.uuid().parse(action);const {data:asset}=await db.from('media_assets').select('id,public_id,format,resource_type,visibility,context,owner_user_id').eq('id',action).maybeSingle();if(!asset)throw new AppError('NOT_FOUND','Asset not found',404);if(asset.visibility!=='public'&&asset.owner_user_id!==user.id){const {data:permissions}=await db.rpc('my_permissions');const permission=asset.context==='invoice'?'finance.read':asset.context==='delivery_proof'?'delivery.read':'leads.read';if(!permissions?.includes(permission))throw new AppError('FORBIDDEN','Private asset access is restricted',403);}return success({url:mediaDeliveryUrl(asset),expiresIn:asset.visibility==='private'?300:null},id);}catch(e){return failure(e,id);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{action:string}>}){const id=crypto.randomUUID();try{const {action}=await params,{db,user}=await requestContext(request);if(!['sign','confirm'].includes(action))throw new AppError('NOT_FOUND','Unknown upload action',404);const {data:permissions}=await db.rpc('my_permissions');const body=await jsonBody(request);return success(action==='sign'?await signUpload(user.id,permissions??[],body):await confirmUpload(user.id,body),id);}catch(e){return failure(e,id);}}

