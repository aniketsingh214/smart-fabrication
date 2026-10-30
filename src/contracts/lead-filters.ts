import { z } from 'zod';
import { indiaDate } from './report-period';
import { leadStates } from './workflows';
export const leadDatePresets=['all','today','yesterday','last7','month','custom'] as const;
export const leadSources=['google','instagram','facebook','whatsapp','direct','referral','other'] as const;
export const leadFilterKeys=['date','from','until','assigned','source','follow_up'] as const;
export type LeadFilters=Partial<Record<typeof leadFilterKeys[number],string>>;
const schema=z.object({date:z.enum(leadDatePresets).default('all'),from:z.iso.date().optional(),until:z.iso.date().optional(),assigned:z.union([z.enum(['me','unassigned']),z.uuid()]).optional(),source:z.enum(leadSources).optional(),follow_up:z.enum(['today','overdue']).optional(),status:z.enum([...leadStates,'LOST']).optional()});
export function leadFilterParams(values:LeadFilters){const params=new URLSearchParams();for(const key of leadFilterKeys)if(values[key]&&!(key==='date'&&values[key]==='all'))params.set(key,values[key]!);return params;}
export function readLeadFilters(params:URLSearchParams,now=new Date()){
 const raw=Object.fromEntries([...leadFilterKeys,'status'].filter(key=>params.get(key)).map(key=>[key,params.get(key)]));const filters=schema.parse(raw);
 if(filters.date!=='custom'&&(filters.from||filters.until))throw new Error('Choose custom dates when supplying From and To.');
 const today=indiaDate(now),shift=(day:string,offset:number)=>new Date(Date.parse(day+'T00:00:00Z')+offset*86400000).toISOString().slice(0,10);
 let from:string|undefined,until:string|undefined;
 if(filters.date==='today')from=until=today;
 if(filters.date==='yesterday')from=until=shift(today,-1);
 if(filters.date==='last7'){from=shift(today,-6);until=today;}
 if(filters.date==='month'){from=today.slice(0,7)+'-01';until=shift(new Date(Date.UTC(Number(today.slice(0,4)),Number(today.slice(5,7)),1)).toISOString().slice(0,10),-1);}
 if(filters.date==='custom'){if(!filters.from||!filters.until)throw new Error('Select both From and To dates.');from=filters.from;until=filters.until;if(from>until)throw new Error('To date must be on or after From date.');}
 const midnight=(day:string)=>new Date(day+'T00:00:00+05:30').toISOString();
 return {filters,rpc:{search_term:params.get('q')?.trim()||null,created_from:from?midnight(from):null,created_until:until?midnight(shift(until,1)):null,assignment:filters.assigned??null,lead_source:filters.source??null,followup_filter:filters.follow_up??null,india_day_start:midnight(today),india_day_end:midnight(shift(today,1))}};
}
