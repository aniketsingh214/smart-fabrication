import type { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { failure,success } from '@/lib/api';
import { workshopDashboard } from '@/features/dashboard/service';
export async function GET(request:NextRequest){const id=crypto.randomUUID();try{
 const {db}=await requestContext(request,['leads.read','quotations.read','orders.read','delivery.read']);
 const input=Object.fromEntries(request.nextUrl.searchParams);return success(await workshopDashboard(db,input),id);
}catch(error){return failure(error,id);}}
