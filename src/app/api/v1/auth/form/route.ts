import { type NextRequest } from 'next/server';
import { authFormSchema } from '@/contracts/auth-form';
import { failure,success,jsonBody } from '@/lib/api';
import { AppError } from '@/lib/errors';
import { serverClient } from '@/lib/supabase/server';
import { requestContext } from '@/lib/auth/request';
import { consumeQuota } from '@/lib/rate-limit';
export async function POST(request:NextRequest){const id=crypto.randomUUID();try{if(request.headers.get('origin')!==request.nextUrl.origin)throw new AppError('CSRF_REJECTED','Request origin is not allowed',403);const input=authFormSchema.parse(await jsonBody(request));if(input.mode==='password'){const {db}=await requestContext(request);const {error}=await db.auth.updateUser({password:input.password});if(error)throw new AppError('AUTH_UPDATE_FAILED','Password could not be updated. Please retry.',400);return success({saved:true},id);}
 await consumeQuota('email:'+input.email.trim().toLowerCase(),{name:'auth-account',limit:5,seconds:900});const db=await serverClient(),origin=request.nextUrl.origin;
 if(input.mode==='login'){const {error}=await db.auth.signInWithPassword({email:input.email,password:input.password});if(error)throw new AppError('INVALID_LOGIN','Email or password is incorrect.',401,[{field:'password',message:'Email or password is incorrect.'}]);return success({saved:true},id);}
 if(input.mode==='signup'){const {error}=await db.auth.signUp({email:input.email,password:input.password,options:{data:{display_name:input.name},emailRedirectTo:origin+'/auth/callback'}});if(error)throw new AppError('AUTH_SIGNUP_FAILED','Account could not be created. Please retry later.',400);}
 else{const {error}=await db.auth.resetPasswordForEmail(input.email,{redirectTo:origin+'/auth/callback?next=/reset-password'});if(error)throw new AppError('AUTH_RESET_FAILED','Reset email could not be requested. Please retry later.',400);}
 return success({saved:true,message:'Check your email for the next step.'},id);
 }catch(error){return failure(error,id);}}
