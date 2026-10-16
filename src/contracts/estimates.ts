import { z } from 'zod';
export const estimateSchema=z.object({product_id:z.uuid(),width_mm:z.number().finite().min(100).max(20000),height_mm:z.number().finite().min(100).max(10000)}).strict();
export type Estimate={approximate:true;currency:'INR';area_sq_m:number;weight_kg:number;total_minor:number;min_minor:number;max_minor:number;notice:string;materials:{name:string;quantity:number;unit:string;weight_kg:number;amount_minor:number}[]};
export function areaSqM(widthMm:number,heightMm:number){if(!Number.isFinite(widthMm)||!Number.isFinite(heightMm)||widthMm<=0||heightMm<=0)throw new Error('Positive dimensions required');return widthMm*heightMm/1e6;}
