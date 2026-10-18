import { estimateSchema,estimateResultSchema } from '@/contracts/estimates';
import { serverClient } from '@/lib/supabase/server';
import { failure,success,jsonBody,databaseError } from '@/lib/api';
import { AppError } from '@/lib/errors';
export async function POST(request:Request){const id=crypto.randomUUID();try{const p=estimateSchema.parse(await jsonBody(request)),db=await serverClient();const {data,error}=await db.rpc('estimate_product',{target:p.product_id,width_mm:p.width_mm,height_mm:p.height_mm});if(error?.message==='Estimate limit reached')throw new AppError('RATE_LIMITED','Please try again later',429);databaseError(error);const result=estimateResultSchema.safeParse(data);if(!result.success)throw new AppError('INVALID_ESTIMATE_RESPONSE','Estimate could not be validated',500);return success(result.data,id,201);}catch(e){return failure(e,id);}}
