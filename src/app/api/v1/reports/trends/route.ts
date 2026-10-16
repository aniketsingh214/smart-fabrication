import type { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { reportPeriod } from '@/contracts/report-period';
import { failure,success,databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
export async function GET(request:NextRequest){const id=crypto.randomUUID();try{let period;try{period=reportPeriod(request.nextUrl.searchParams.get('from')??undefined,request.nextUrl.searchParams.get('until')??undefined);}catch{throw new AppError('INVALID_PERIOD','Choose a valid interval of up to 366 days',422);}const {db}=await requestContext(request,'reports.read');const {data,error}=await db.rpc('report_trends',{start_at:period.start,end_at:period.end});databaseError(error);return success(data,id);}catch(e){return failure(e,id);}}
