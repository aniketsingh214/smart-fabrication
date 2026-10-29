import { salesSearchRPC } from '@/contracts/sales-search';
import { NextResponse,type NextRequest } from 'next/server';
import { resourceMap } from '@/contracts/resources';
import { exportQuery,reportDateFields } from '@/contracts/export-query';
import { requestContext } from '@/lib/auth/request';
import { failure,databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { toCsv } from '@/features/reports/csv';
import { parseCursor } from '@/features/operations/services';
export async function GET(request:NextRequest,{params}:{params:Promise<{resource:string}>}){const id=crypto.randomUUID();try{
 const {resource:slug}=await params,r=resourceMap[slug];if(!r)throw new AppError('NOT_FOUND','Report not found',404);
 const {db}=await requestContext(request,`${r.domain}.export`);let options;try{options=exportQuery(request.nextUrl.searchParams);}catch{throw new AppError('INVALID_EXPORT_QUERY','Choose a limit from 1 to 500 and a valid period of up to 366 days',422);}
 const search=request.nextUrl.searchParams.get('q')?.trim();if(search&&search.length>120)throw new AppError('VALIDATION_ERROR','Search must be at most 120 characters',422);const salesRPC=search?salesSearchRPC[slug]:undefined;
 let query=(salesRPC?db.rpc(salesRPC,{search_term:search}):db.from(r.table)).select([...new Set([...r.columns,'id','created_at'])].join(','),{count:'exact'}).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(options.limit+1);
 if(options.cursor){const c=parseCursor(options.cursor);query=query.or(`created_at.lt.${c.created_at},and(created_at.eq.${c.created_at},id.lt.${c.id})`);}
 if(options.period){const field=reportDateFields[slug];query=field?query.gte(field,options.period.from).lte(field,options.period.until):query.gte('created_at',options.period.start).lt('created_at',options.period.end);}
 if(search&&!salesRPC){const key=r.fields.some(f=>f.key==='name')?'name':r.fields.some(f=>f.key==='heading')?'heading':slug==='media-assets'?'public_id':slug==='audit-logs'?'entity_type':null;if(!key)throw new AppError('UNSUPPORTED_FILTER','This report does not support text search',422);query=query.ilike(key,`%${search.replace(/[%_\\]/g,'').slice(0,120)}%`);}
 const status=request.nextUrl.searchParams.get('status');if(status){if(!r.columns.includes('status')&&!r.fields.some(f=>f.key==='status'))throw new AppError('UNSUPPORTED_FILTER','This report does not support a status filter',422);query=query.eq('status',status);}
 const {data,error,count}=await query;databaseError(error);const all=(data??[]) as unknown as Record<string,unknown>[],page=all.slice(0,options.limit),last=page.at(-1);
 const headers:Record<string,string>={'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${slug}.csv"`,'Cache-Control':'private, no-store','X-Request-ID':id,'X-Export-Row-Count':String(page.length)};
 if((all.length>options.limit||(count??0)>page.length)&&last){const cursor=Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url');headers['X-Next-Cursor']=cursor;const next=new URL(request.url);next.searchParams.set('cursor',cursor);headers.Link=`<${next.pathname+next.search}>; rel="next"`;}
 return new NextResponse(toCsv(page,r.columns),{headers});
}catch(e){return failure(e,id);}}
