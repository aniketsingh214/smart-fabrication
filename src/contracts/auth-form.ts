import { z } from 'zod';
export const authFormSchema=z.discriminatedUnion('mode',[
 z.object({mode:z.literal('login'),email:z.email().max(254),password:z.string().min(8).max(256)}).strict(),
 z.object({mode:z.literal('signup'),email:z.email().max(254),password:z.string().min(8).max(256),name:z.string().trim().min(2).max(120)}).strict(),
 z.object({mode:z.literal('reset'),email:z.email().max(254)}).strict(),
 z.object({mode:z.literal('password'),password:z.string().min(8).max(256)}).strict()
]);
