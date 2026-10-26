import 'server-only';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
export type ApiSort={key:string;ascending:boolean;explicit:boolean;nullsFirst?:boolean};
export function readSort(params:URLSearchParams,allowed:readonly string[]):ApiSort{
 const key=params.get('sort')??'created_at',direction=params.get('direction')??'desc';
 if(!allowed.includes(key)||!['asc','desc'].includes(direction))throw new AppError('INVALID_SORT','Unsupported sort column or direction',422);
 return {key,ascending:direction==='asc',explicit:params.has('sort')||params.has('direction')};
}
const token=z.object({v:z.literal(1),key:z.string(),ascending:z.boolean(),value:z.union([z.string().max(20000),z.number(),z.boolean(),z.null()]),id:z.uuid()}).strict();
export function sortCursor(row:Record<string,unknown>,sort:ApiSort){return Buffer.from(JSON.stringify({v:1,key:sort.key,ascending:sort.ascending,value:row[sort.key]??null,id:row.id})).toString('base64url');}
export function readSortCursor(raw:string,sort:ApiSort){
 try{if(raw.length>40000||!/^[A-Za-z0-9_-]+$/.test(raw))throw new Error();const c=token.parse(JSON.parse(Buffer.from(raw,'base64url').toString('utf8')));if(c.key!==sort.key||c.ascending!==sort.ascending)throw new Error();return c;}catch{throw new AppError('INVALID_CURSOR','Invalid cursor for the selected sort',422);}
}
// PostgREST quoted literals: user text must never become a filter expression.
const literal=(value:string|number|boolean)=>typeof value==='string'?'"'+value.replaceAll('\\','\\\\').replaceAll('"','\\"')+'"':String(value);
export function sortFilter(raw:string,sort:ApiSort){const c=readSortCursor(raw,sort),op=sort.ascending?'gt':'lt';const ties='and('+sort.key+'.is.null,id.'+op+'.'+c.id+')';return c.value===null?ties+(sort.nullsFirst?','+sort.key+'.not.is.null':''):sort.key+'.'+op+'.'+literal(c.value)+',and('+sort.key+'.eq.'+literal(c.value)+',id.'+op+'.'+c.id+')'+(sort.nullsFirst?'':','+sort.key+'.is.null');}
