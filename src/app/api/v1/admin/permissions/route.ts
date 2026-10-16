import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requestContext } from '@/lib/auth/request';
import { failure,success,databaseError,jsonBody } from '@/lib/api';
export async function GET(request:NextRequest){const id=crypto.randomUUID();try{const {db}=await requestContext(request,'users.read');const [{data:permissions,error},{data:grants,error:grantsError}]=await Promise.all([db.from('permissions').select('id').order('id'),db.from('role_permissions').select('role_id,permission_id')]);databaseError(error);databaseError(grantsError);return success({permissions,grants},id);}catch(e){return failure(e,id);}}
export async function PATCH(request:NextRequest){const id=crypto.randomUUID();try{const p=z.object({role:z.enum(['sales','production','accounts','content']),permission:z.string().min(3).max(100),enabled:z.boolean()}).strict().parse(await jsonBody(request));const {db}=await requestContext(request,'users.write');const {error}=await db.rpc('set_role_permission',{role_name:p.role,permission_name:p.permission,enabled:p.enabled});databaseError(error);return success(p,id);}catch(e){return failure(e,id);}}
