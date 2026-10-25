import { z } from 'zod';
const metric=z.number().int().nonnegative().nullable();
const date=z.iso.datetime({offset:true});
const href=z.string().regex(/^\/admin\/[a-z-]+\?record=[0-9a-f-]{36}$/);
export const dashboardQuerySchema=z.object({scope:z.enum(['business','demo','all']).default('business'),task:z.enum(['all','new','followup','approval','delivery']).default('all'),page:z.coerce.number().int().min(1).max(10000).default(1)});
export const dashboardSchema=z.object({
 as_of:date,day_start:date,day_end:date,scope:z.enum(['business','demo','all']),task:z.enum(['all','new','followup','approval','delivery']),page:z.number().int().positive(),page_size:z.literal(10),
 metrics:z.object({new_leads:metric,active_leads:metric,followups_due:metric,overdue_followups:metric,approvals:metric,open_orders:metric,deliveries_today:metric,pending_installations:metric}).strict(),
 task_total:z.number().int().nonnegative(),
 tasks:z.array(z.object({kind:z.enum(['new','followup','approval','delivery']),id:z.uuid(),title:z.string(),due_at:date,status:z.string(),priority:z.number().int(),action:z.string(),href}).strict()),
 board:z.array(z.object({key:z.enum(['confirmed','production','ready','delivery','completed']),count:z.number().int().nonnegative(),items:z.array(z.object({id:z.uuid(),name:z.string(),status:z.string(),due_at:date.nullable(),href}).strict())}).strict()),
 activity:z.array(z.object({id:z.uuid(),title:z.string(),label:z.string(),happened_at:date,href}).strict())
}).strict();
export type Dashboard=z.infer<typeof dashboardSchema>;
