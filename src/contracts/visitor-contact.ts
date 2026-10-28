import { z } from 'zod';
import { indianMobileSchema } from './phone.ts';
export const visitorContactSchema=z.object({name:z.string().trim().min(2,'Enter your full name').max(120),phone:indianMobileSchema,address:z.string().trim().max(100).optional(),intent:z.enum(['welcome','call','message']),page:z.string().max(500).regex(/^\/(?!\/)/).default('/'),website:z.string().max(0).optional()}).strict();
export function contactAction(href:string):'call'|'message'|null{try{const url=new URL(href);if(url.protocol==='tel:')return 'call';if(['sms:','mailto:'].includes(url.protocol))return 'message';if(url.protocol==='https:'&&['wa.me','api.whatsapp.com','web.whatsapp.com'].includes(url.hostname))return 'message';}catch{/* Other links are normal browsing. */}return null;}
