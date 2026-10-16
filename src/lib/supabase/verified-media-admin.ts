import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import { supabaseEnv } from './env';
/** Exceptional privileged writer: use only after actor authorization and Cloudinary provenance checks. */
export function verifiedMediaAdmin(){const key=process.env.SUPABASE_SECRET_KEY;if(!key)throw new AppError('MEDIA_NOT_CONFIGURED','Media verification is not configured',503);return createClient(supabaseEnv().url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
