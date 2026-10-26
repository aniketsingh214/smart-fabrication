import 'server-only';
import { createHmac,timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
export const visitorCookie='sf_visitor_contact';
export const visitorMaxAge=7*24*60*60;
function secret(){const value=process.env.VISITOR_CONTACT_SECRET??process.env.ENQUIRY_UPLOAD_SECRET??process.env.SUPABASE_SECRET_KEY;if(!value)throw new AppError('NOT_CONFIGURED','Contact registration is temporarily unavailable',503);return value;}
export function requireVisitorSigning(){secret();}
function sign(payload:string){return createHmac('sha256',secret()).update('visitor-contact:'+payload).digest('base64url');}
export function visitorToken(leadId:string){const payload=Buffer.from(JSON.stringify({id:z.uuid().parse(leadId),expires:Date.now()+visitorMaxAge*1000})).toString('base64url');return payload+'.'+sign(payload);}
export function registeredVisitor(token?:string){if(!token||token.length>1000)return false;try{const [payload,signature,extra]=token.split('.');if(extra||!payload||!signature||!/^[a-zA-Z0-9_-]{43}$/.test(signature))return false;const expected=sign(payload);if(!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return false;const data=z.object({id:z.uuid(),expires:z.number().int().positive()}).parse(JSON.parse(Buffer.from(payload,'base64url').toString('utf8')));return data.expires>Date.now();}catch{return false;}}
