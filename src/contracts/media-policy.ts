import { z } from 'zod';
const image=z.object({context:z.enum(['product','gallery','customer_design','delivery_proof','invoice']),format:z.enum(['jpg','jpeg','png','webp']),bytes:z.number().int().positive().max(10*1024*1024)}).strict();
const invoicePdf=z.object({context:z.literal('invoice'),format:z.literal('pdf'),bytes:z.number().int().positive().max(10*1024*1024)}).strict();
const productVideo=z.object({context:z.literal('product'),format:z.enum(['mp4','webm','mov']),bytes:z.number().int().positive().max(100*1024*1024)}).strict();
export const uploadIntentSchema=z.discriminatedUnion('format',[image,invoicePdf,productVideo]);
