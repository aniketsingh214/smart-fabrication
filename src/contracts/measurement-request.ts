import { z } from 'zod';
export function indiaToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export const measurementRequestSchema=z.object({
 preferred_date:z.iso.date().refine(value=>value>=indiaToday(),'Choose today or a future date (India time).'),
 time_window:z.enum(['morning','afternoon','evening','any']),
 address:z.string().trim().min(10).max(400),
 postal_code:z.string().regex(/^[1-9][0-9]{5}$/,'Enter a 6-digit Indian PIN code.')
}).strict();
export function measurementRequirement(requirement:string,input?:unknown){
 const request=input===undefined?undefined:measurementRequestSchema.parse(input); return request?`${requirement}\n\nSITE MEASUREMENT REQUEST (not a confirmed appointment)\nPreferred date: ${request.preferred_date} (Asia/Kolkata)\nPreferred time: ${request.time_window}\nSite address: ${request.address}\nPIN: ${request.postal_code}\nWorkshop must confirm availability, service coverage and any visit charge.`:requirement;
}
