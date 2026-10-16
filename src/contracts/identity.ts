import { z } from 'zod';
export const notificationSchema=z.object({id:z.uuid(),name:z.string(),body:z.string(),read_at:z.iso.datetime({offset:true}).nullable(),created_at:z.iso.datetime({offset:true})}).strict();
export const notificationReadSchema=notificationSchema.pick({id:true,read_at:true});
export const staffProfileSchema=z.object({id:z.uuid(),display_name:z.string(),disabled:z.boolean(),created_at:z.iso.datetime({offset:true}),user_roles:z.array(z.object({role_id:z.string()}).strict())}).strict();
export const profileUpdateSchema=z.object({id:z.uuid(),display_name:z.string()}).strict();
export const identitySchema=profileUpdateSchema.extend({disabled:z.boolean(),permissions:z.array(z.string()),customer:z.object({id:z.uuid(),name:z.string(),phone:z.string(),email:z.string().nullable(),address:z.string()}).strict().nullable()}).strict();
