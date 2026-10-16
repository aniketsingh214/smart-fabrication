/** Browser-independent API client for future mobile clients. Pass a refreshed Supabase access token. */
export class SmartFabricationClient {
 constructor(private baseUrl:string,private token?:()=>Promise<string|undefined>){if(!/^https?:\/\//.test(baseUrl))throw new Error('Absolute API base URL required');}
 async request<T>(path:string,options:{method?:'GET'|'POST'|'PATCH';body?:unknown;idempotencyKey?:string;signal?:AbortSignal}={}):Promise<{data:T;meta:{nextCursor?:string|null};requestId:string}>{
  if(!path.startsWith('/')||path.startsWith('//'))throw new Error('Relative API path required');
  const token=await this.token?.(),headers:Record<string,string>={Accept:'application/json'};
  if(token)headers.Authorization=`Bearer ${token}`;if(options.body!==undefined)headers['Content-Type']='application/json';if(options.idempotencyKey)headers['Idempotency-Key']=options.idempotencyKey;
  const response=await fetch(`${this.baseUrl.replace(/\/$/,'')}${path}`,{method:options.method??'GET',headers,body:options.body!==undefined?JSON.stringify(options.body):undefined,signal:options.signal});
  const payload=await response.json();if(!response.ok)throw Object.assign(new Error(payload.error?.message??'API request failed'),{status:response.status,code:payload.error?.code,requestId:payload.requestId});return payload;
 }
}
