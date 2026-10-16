import { z } from 'zod';
export const duplicateProductSchema=z.object({name:z.string().trim().min(1).max(200),sku:z.string().trim().min(1).max(100),slug:z.string().min(1).max(200).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)}).strict();
export type ProductVariant={id:string;name:string;sku:string;width_mm:number|null;height_mm:number|null;colour:string;finish:string;price_min_minor:number;price_max_minor:number;status:string};
export type ProductOption={id:string;name:string;option_group:string;extra_cost_minor:number;sort_order:number;status:string};
