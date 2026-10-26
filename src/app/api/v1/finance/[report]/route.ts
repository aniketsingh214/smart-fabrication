import { sortedReportPage } from '@/features/reports/sorted-page';
import type { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
export async function GET(request:NextRequest,{params}:{params:Promise<{report:string}>}){const id=crypto.randomUUID();try{const {report}=await params;if(!['receivables','payables','workers'].includes(report))throw new AppError('NOT_FOUND','Report not found',404);const {db}=await requestContext(request,'finance.read');if(request.nextUrl.searchParams.has('sort')){const page=await sortedReportPage(db,report,request.nextUrl.searchParams);return success(page.items,id,200,{nextCursor:page.nextCursor});}const limit=z.coerce.number().int().min(1).max(100).parse(request.nextUrl.searchParams.get('limit')??25),cursor=request.nextUrl.searchParams.has('cursor')?z.uuid().parse(request.nextUrl.searchParams.get('cursor')):null;const {data,error}=await db.rpc('finance_balance_page',{report_name:report,after_id:cursor,page_limit:limit});databaseError(error);return success(data.items,id,200,{nextCursor:data.next_id});}catch(e){return failure(e,id);}}
