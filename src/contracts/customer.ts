import { z } from 'zod';
export const customerQuotationSchema=z.object({id:z.uuid(),name:z.string(),status:z.string(),expires_at:z.iso.datetime({offset:true}),created_at:z.iso.datetime({offset:true})}).strict();
export const customerOrderSchema=z.object({id:z.uuid(),name:z.string(),total_minor:z.number().int(),status:z.string(),due_at:z.iso.datetime({offset:true}).nullable(),version:z.number().int(),created_at:z.iso.datetime({offset:true})}).strict();
export const customerTimelineSchema=z.object({id:z.uuid(),to_status:z.string(),created_at:z.iso.datetime({offset:true})}).strict();
