import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { RateLimitError } from '@/lib/rate-limit';
import { AppError } from '@/lib/errors';
export function success(data:unknown,requestId:string,status=200,meta?:unknown){return NextResponse.json({data,meta:meta??{},requestId},{status,headers:{'X-Request-ID':requestId,'Cache-Control':'no-store'}});}
export function failure(error:unknown,requestId:string){
  const e=error instanceof AppError?error:error instanceof ZodError?new AppError('VALIDATION_ERROR','Please check the submitted fields',422,error.issues.map(i=>({field:i.path.join('.'),message:i.message}))):new AppError('INTERNAL_ERROR','The request could not be completed',500);
  if(e.status>=500)console.error(JSON.stringify({requestId,code:e.code,status:e.status}));
  return NextResponse.json({error:{code:e.code,message:e.message,details:e.details},requestId},{status:e.status,headers:{'X-Request-ID':requestId,'Cache-Control':'no-store',...(error instanceof RateLimitError?{'Retry-After':String(error.retryAfter),'X-RateLimit-Limit':String(error.limit),'X-RateLimit-Remaining':'0','X-RateLimit-Reset':String(error.resetAt)}:e.status===429?{'Retry-After':'3600'}:{})}});
}
export async function jsonBody(request:Request){
  if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new AppError('UNSUPPORTED_MEDIA_TYPE','Send JSON data',415);
  if(Number(request.headers.get('content-length'))>65536)throw new AppError('PAYLOAD_TOO_LARGE','Request is too large',413);
  if(!request.body)throw new AppError('INVALID_JSON','Invalid JSON body',400);
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];let bytes=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>65536){await reader.cancel();throw new AppError('PAYLOAD_TOO_LARGE','Request is too large',413);}chunks.push(value);}}
  finally{reader.releaseLock();}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks,bytes)));}catch{throw new AppError('INVALID_JSON','Invalid JSON body',400);}
}
export function databaseError(error:{code?:string;message?:string}|null){
  if(!error)return;
  const status=error.code==='23505'?409:error.code==='42501'?403:error.code==='P0002'?404:error.code==='P0001'||error.code==='23514'?409:['23503','23502','22P02','22003','22007'].includes(error.code??'')?422:500;
  const message=status===500?'Data could not be saved':status===403?'You do not have permission for this action':status===404?'Record not found':status===422?'Check the field values and selected records':error.code==='23505'?'A record with that unique value already exists':error.code==='23514'?'The values violate a business rule':(error.message??'Operation rejected');
  throw new AppError(status===409?'CONFLICT':status===403?'FORBIDDEN':status===404?'NOT_FOUND':status===422?'VALIDATION_ERROR':'DATABASE_ERROR',message,status);
}
