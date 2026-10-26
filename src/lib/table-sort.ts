export type TableSort={key:string;direction:'asc'|'desc'};
export function nextSort(current:TableSort|null,key:string):TableSort{return {key,direction:current?.key===key&&current.direction==='asc'?'desc':'asc'};}
const collator=new Intl.Collator('en-IN',{numeric:true,sensitivity:'base'});
export function compareValues(a:unknown,b:unknown,direction:'asc'|'desc'='asc'):number {
 if(a==null||a==='')return b==null||b===''?0:1;
 if(b==null||b==='')return -1;
 const result=typeof a==='number'&&typeof b==='number'?a-b:typeof a==='boolean'&&typeof b==='boolean'?Number(a)-Number(b):collator.compare(String(a),String(b));
 return direction==='asc'?result:-result;
}
export function sortedRows<T>(rows:readonly T[],sort:TableSort|null,value:(row:T,key:string)=>unknown):T[]{return sort?[...rows].sort((a,b)=>compareValues(value(a,sort.key),value(b,sort.key),sort.direction)):[...rows];}
