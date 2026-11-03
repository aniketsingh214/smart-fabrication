import {NextRequest} from 'next/server';
import {z} from 'zod';
import {requestContext} from '@/lib/auth/request';
import {databaseError,failure,success} from '@/lib/api';
import {AppError} from '@/lib/errors';
import {resourceMap} from '@/contracts/resources';
import {recordFields} from '@/contracts/resource-projections';
import {recordCode,recordLabel} from '@/contracts/record-identity';
export async function GET(request:NextRequest){const requestId=crypto.randomUUID();try{
 const resource=resourceMap[request.nextUrl.searchParams.get('resource')??''];if(!resource)throw new AppError('NOT_FOUND','Unknown resource',404);
 const ids=z.array(z.uuid()).min(1).max(100).parse((request.nextUrl.searchParams.get('ids')??'').split(','));
 const {db}=await requestContext(request,resource.domain+'.read');
 const {data,error}=await db.from(resource.table).select(recordFields(resource)).in('id',[...new Set(ids)]);databaseError(error);
 return success(((data??[]) as unknown as Record<string,unknown>[]).map(row=>({id:row.id,label:recordLabel(row,resource.title),code:recordCode(row)})),requestId);
 }catch(error){return failure(error,requestId);}}
