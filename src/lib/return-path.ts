/** Only local authenticated destinations; never redirect to an external origin. */
export function safeReturnPath(value:string|null|undefined){
 if(!value||value.length>2048||/[\\\r\n]/.test(value)||!value.startsWith('/')||value.startsWith('//'))return '/account';
 try{const url=new URL(value,'https://local.invalid');if(url.origin!=='https://local.invalid'||!/^\/(account|admin)(\/|$)/.test(url.pathname))return '/account';return url.pathname+url.search+url.hash;}catch{return '/account';}
}
