import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dashboardSchema,dashboardQuerySchema } from '@/contracts/dashboard';
import { databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
export async function workshopDashboard(db:SupabaseClient,input:unknown){
 const query=dashboardQuerySchema.parse(input);
 const {data,error}=await db.rpc('workshop_dashboard',{requested_scope:query.scope,requested_task:query.task,requested_page:query.page});databaseError(error);
 const result=dashboardSchema.safeParse(data);if(!result.success)throw new AppError('INVALID_DASHBOARD','Dashboard could not be loaded',500);return result.data;
}
