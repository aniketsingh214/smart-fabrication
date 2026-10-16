import type { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { failure,success } from '@/lib/api';
import { userPage } from '@/features/auth/user-page';
export async function GET(request:NextRequest){const id=crypto.randomUUID();try{const {db}=await requestContext(request,'users.read');const {items,nextCursor}=await userPage(db,request.nextUrl.searchParams);return success(items,id,200,{nextCursor});}catch(e){return failure(e,id);}}
