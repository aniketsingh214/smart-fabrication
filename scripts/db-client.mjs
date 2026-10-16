import pg from 'pg';
import fs from 'node:fs';
import tls from 'node:tls';
import path from 'node:path';
export function databaseClient(){
  if(process.env.SF_DISPOSABLE_DATABASE_URL){
    const local=new URL(process.env.SF_DISPOSABLE_DATABASE_URL);
    if(!['127.0.0.1','localhost'].includes(local.hostname)||!/^\/sf_restore_[a-f0-9_]+$/.test(local.pathname)||!local.port||local.port==='5432')throw new Error('Disposable test database must be an explicitly named isolated local database');
    return new pg.Client({connectionString:local.toString(),ssl:false,connectionTimeoutMillis:15000});
  }
  if(!process.env.POSTGRES_URL_NON_POOLING)throw new Error('Database connection is not configured');
  const url=new URL(process.env.POSTGRES_URL_NON_POOLING);
  url.searchParams.delete('sslmode');
  return new pg.Client({connectionString:url.toString(),ssl:{rejectUnauthorized:true,ca:[...tls.rootCertificates,fs.readFileSync(path.join(import.meta.dirname,'certs/supabase-root.crt'),'utf8')]},connectionTimeoutMillis:15000});
}
