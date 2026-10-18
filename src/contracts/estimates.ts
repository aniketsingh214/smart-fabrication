import { z } from 'zod';
export const estimateSchema=z.object({product_id:z.uuid(),width_mm:z.number().finite().min(100).max(20000),height_mm:z.number().finite().min(100).max(10000)}).strict();
const minor=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const estimateLineSchema=z.object({name:z.string(),quantity:z.number().finite().nonnegative(),unit:z.enum(['kg','m','piece','litre','sheet']),weight_kg:z.number().finite().nonnegative(),amount_minor:minor,rate_minor:minor,material_id:z.uuid(),rate_id:z.uuid(),rate_effective_at:z.iso.datetime({offset:true}),rate_effective_snapshot:z.literal(true),customer_visible:z.boolean()});
export const estimateResultSchema=z.object({id:z.uuid(),approximate:z.literal(true),currency:z.literal('INR'),area_sq_m:z.number().finite().positive(),weight_kg:z.number().finite().nonnegative(),total_minor:minor,min_minor:minor,max_minor:minor,notice:z.string(),formula_version:z.string(),bom_version:z.number().int().positive(),rule_version:z.number().int().positive(),material_minor:minor,labour_minor:minor,finish_minor:minor,hardware_minor:minor,delivery_minor:minor,installation_minor:minor,materials:z.array(estimateLineSchema.extend({customer_visible:z.literal(true)}))});
export type Estimate=z.infer<typeof estimateResultSchema>;
export const estimatePreviewSchema=estimateSchema.extend({bom_id:z.uuid(),rule_id:z.uuid()});
export const estimatePreviewResultSchema=estimateResultSchema.omit({id:true}).extend({preview:z.literal(true),materials:z.array(estimateLineSchema).min(1)}).strict();
export function areaSqM(widthMm:number,heightMm:number){if(!Number.isFinite(widthMm)||!Number.isFinite(heightMm)||widthMm<=0||heightMm<=0)throw new Error('Positive dimensions required');return widthMm*heightMm/1e6;}
