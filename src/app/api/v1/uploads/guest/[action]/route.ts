import { verifyEnquiryToken } from '@/lib/cloudinary/guest-token';
import { signGuestUpload,confirmUpload } from '@/lib/cloudinary/service';
import { failure,success,jsonBody } from '@/lib/api';
import { AppError } from '@/lib/errors';
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){const id=crypto.randomUUID();try{const leadId=verifyEnquiryToken(request.headers.get('x-enquiry-upload-token')),{action}=await params,body=await jsonBody(request);if(!['sign','confirm'].includes(action))throw new AppError('NOT_FOUND','Unknown upload action',404);return success(action==='sign'?await signGuestUpload(leadId,body):await confirmUpload(null,body,leadId),id);}catch(e){return failure(e,id);}}
