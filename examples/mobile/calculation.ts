import type { SmartFabricationClient } from '../../src/contracts/client';
import type { paths } from '../../src/contracts/generated-api';
import { estimateSchema,estimateResultSchema,estimatePreviewSchema,estimatePreviewResultSchema } from '../../src/contracts/estimates';
type EstimateInput=paths['/estimates']['post']['requestBody']['content']['application/json'];
type EstimateOutput=paths['/estimates']['post']['responses'][201]['content']['application/json']['data'];
type PreviewInput=paths['/estimates/preview']['post']['requestBody']['content']['application/json'];
type PreviewOutput=paths['/estimates/preview']['post']['responses'][200]['content']['application/json']['data'];
/** A public estimate creates immutable history; never automatically replay it. */
export async function calculate(client:SmartFabricationClient,input:EstimateInput,signal?:AbortSignal){
 const response=await client.request<EstimateOutput>('/estimates',{method:'POST',body:estimateSchema.parse(input),signal});return {...response,data:estimateResultSchema.parse(response.data)};
}
/** Current bearer token must have BOTH materials.read and catalog.read. No history is saved. */
export async function previewCalculation(client:SmartFabricationClient,input:PreviewInput,signal?:AbortSignal){
 const response=await client.request<PreviewOutput>('/estimates/preview',{method:'POST',body:estimatePreviewSchema.parse(input),signal});return {...response,data:estimatePreviewResultSchema.parse(response.data)};
}
