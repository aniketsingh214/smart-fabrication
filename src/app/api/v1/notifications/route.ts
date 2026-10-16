import { type NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { failure,success } from '@/lib/api';
import { notificationPage } from '@/features/notifications/service';
export async function GET(request:NextRequest){const id=crypto.randomUUID();try{const {db,user}=await requestContext(request);const {items,nextCursor}=await notificationPage(db,user.id,request.nextUrl.searchParams);return success(items,id,200,{nextCursor});}catch(e){return failure(e,id);}}
