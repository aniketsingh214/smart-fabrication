import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {recordLabel,isRecordId,recordCode} from '@/contracts/record-identity';
import {resourceMap} from '@/contracts/resources';
import {recordFields} from '@/contracts/resource-projections';
import {recordReferenceResources} from '@/contracts/sales-search';
import {databaseError} from '@/lib/api';
export async function readableExportRows(db:SupabaseClient,resource:string,rows:Record<string,unknown>[]){
 const labels=new Map<string,string>();const groups:Record<string,Set<string>>={};
 for(const row of rows)for(const [key,value] of Object.entries(row)){const target=resourceMap[resource]?.fields.find(field=>field.key===key)?.reference??recordReferenceResources[key];if(target&&resourceMap[target]&&isRecordId(value))(groups[target]??=new Set()).add(value);}
 await Promise.all(Object.entries(groups).map(async([target,ids])=>{const r=resourceMap[target]!;const {data:allowed,error:permissionError}=await db.rpc('has_permission',{requested:r.domain+'.read'});databaseError(permissionError);if(!allowed)return;const {data,error}=await db.from(r.table).select(recordFields(r)).in('id',[...ids]);databaseError(error);for(const row of (data??[]) as unknown as Record<string,unknown>[])labels.set(String(row.id),recordLabel(row,r.title));}));
 return rows.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,isRecordId(value)?key==='id'?recordCode(row)||'Record':labels.get(value)||'Linked record':value])));
}
