import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { reportPeriod } from '@/contracts/report-period';
export async function GET(request:NextRequest){const id=crypto.randomUUID();try{const defaults=reportPeriod();const start=z.iso.datetime({offset:true}).parse(request.nextUrl.searchParams.get('start')??defaults.start),end=z.iso.datetime({offset:true}).parse(request.nextUrl.searchParams.get('end')??defaults.end);if(new Date(start)>=new Date(end))throw new AppError('INVALID_PERIOD','Start must be before end',422);const {db}=await requestContext(request,'finance.read');const {data,error}=await db.rpc('finance_summary',{start_at:start,end_at:end});databaseError(error);return success({...data,provisional:true,accountant_approved:false,notice:'Period totals use a provisional completed-order policy. WIP, opening inventory, tax and depreciation require accountant review. Owner withdrawals are separate.'},id);}catch(e){return failure(e,id);}}
