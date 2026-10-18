import type { NextRequest } from 'next/server';
import { requestContext } from '@/lib/auth/request';
import { estimatePreviewSchema,estimatePreviewResultSchema } from '@/contracts/estimates';
import { databaseError,failure,jsonBody,success } from '@/lib/api';
import { AppError } from '@/lib/errors';
export async function POST(request:NextRequest){const id=crypto.randomUUID();let stage='authorization';try{
 const {db}=await requestContext(request,'materials.read');const permission=await db.rpc('has_permission',{requested:'catalog.read'});databaseError(permission.error);if(!permission.data)throw new AppError('FORBIDDEN','Catalog and materials read access are required',403);
 stage='validation';const input=estimatePreviewSchema.parse(await jsonBody(request));stage='calculation';const {data,error}=await db.rpc('preview_estimate_product',{target:input.product_id,selected_bom:input.bom_id,selected_rule:input.rule_id,width_mm:input.width_mm,height_mm:input.height_mm});databaseError(error);
 stage='response';const result=estimatePreviewResultSchema.safeParse(data);if(!result.success)throw new AppError('INVALID_ESTIMATE_RESPONSE','Preview could not be validated',500);return success(result.data,id);
}catch(error){if(error instanceof Error&&!(error instanceof AppError))console.error(JSON.stringify({requestId:id,scope:'estimate-preview',stage,errorType:error.name,frames:error.stack?.split('\n').slice(1,4)}));return failure(error,id);}}
