export function safeInternalRedirect(value:string|null,origin:string){
  if(!value||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return new URL('/account',origin);
  try{const target=new URL(value,origin);return target.origin===origin?target:new URL('/account',origin);}catch{return new URL('/account',origin);}
}
