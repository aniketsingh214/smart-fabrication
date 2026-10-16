import { success } from '@/lib/api';
export async function GET(){return success({status:'ok',version:'0.1.0'},crypto.randomUUID());}
