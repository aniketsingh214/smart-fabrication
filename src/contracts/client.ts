export class ApiClientError extends Error {
 constructor(message:string,readonly status:number,readonly code:string,readonly requestId?:string){super(message);this.name='ApiClientError';}
}
/** Cookie-independent client. Supply a current access token; writes are never automatically replayed. */
export class SmartFabricationClient {
 private baseUrl:string;
 constructor(baseUrl:string,private token?:()=>Promise<string|undefined>){
  let parsed:URL;try{parsed=new URL(baseUrl);}catch{throw new Error('Absolute API base URL required');}
  const loopback=['localhost','127.0.0.1','[::1]'].includes(parsed.hostname);
  if((parsed.protocol!=='https:'&&!(parsed.protocol==='http:'&&loopback))||parsed.username||parsed.password||parsed.search||parsed.hash)throw new Error('Use HTTPS (or local development HTTP) without credentials, query or fragment');
  this.baseUrl=parsed.href.replace(/\/$/,'');
 }
 async request<T>(path:string,options:{method?:'GET'|'POST'|'PATCH';body?:unknown;idempotencyKey?:string;signal?:AbortSignal}={}):Promise<{data:T;meta:{nextCursor?:string|null};requestId:string}>{
  if(!path.startsWith('/')||path.startsWith('//')||path.includes('\\')||path.includes('#'))throw new Error('Relative API path required');
  const target=new URL(this.baseUrl+path),base=new URL(this.baseUrl);
  if(target.origin!==base.origin||!target.pathname.startsWith(base.pathname.replace(/\/$/,'')+'/'))throw new Error('Path must stay within the API base');
  const token=await this.token?.(),headers:Record<string,string>={Accept:'application/json'};
  if(token)headers.Authorization=`Bearer ${token}`;if(options.body!==undefined)headers['Content-Type']='application/json';if(options.idempotencyKey)headers['Idempotency-Key']=options.idempotencyKey;
  const response=await fetch(target.href,{method:options.method??'GET',headers,credentials:'omit',redirect:'error',cache:'no-store',body:options.body!==undefined?JSON.stringify(options.body):undefined,signal:options.signal});
  const requestId=response.headers?.get('X-Request-ID')??undefined;
  let payload;
  try{payload=await response.json();}catch{throw new ApiClientError('API returned an unreadable response',response.status,'INVALID_RESPONSE',requestId);}
  if(!response.ok)throw new ApiClientError(typeof payload?.error?.message==='string'?payload.error.message:'API request failed',response.status,payload?.error?.code??'HTTP_ERROR',payload?.requestId??requestId);
  if(!payload||!Object.hasOwn(payload,'data')||typeof payload.requestId!=='string'||!payload.meta||typeof payload.meta!=='object'||Array.isArray(payload.meta))throw new ApiClientError('API returned an invalid response envelope',response.status,'INVALID_RESPONSE',requestId);
  return payload;
 }
}
