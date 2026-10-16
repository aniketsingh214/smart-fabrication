import { expect,it,vi } from 'vitest';
import { notificationPage } from '@/features/notifications/service';
import type { SupabaseClient } from '@supabase/supabase-js';
function fixture(rows:unknown[]){const query={select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn(),or:vi.fn(),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:rows,error:null}).then(resolve)};for(const method of ['select','eq','order','limit','or'] as const)query[method].mockReturnValue(query);return {query,db:{from:()=>query} as unknown as SupabaseClient};}
it('scopes notifications to the current user and continues tied timestamps by id',async()=>{
 const created_at='2026-10-15T12:00:00.123456Z',rows=[{id:crypto.randomUUID(),created_at},{id:crypto.randomUUID(),created_at}];const {db,query}=fixture(rows);
 const page=await notificationPage(db,'current-user',new URLSearchParams({limit:'1'}));expect(page.items).toEqual([rows[0]]);expect(query.eq).toHaveBeenCalledWith('user_id','current-user');expect(query.order).toHaveBeenCalledWith('id',{ascending:false});expect(query.limit).toHaveBeenCalledWith(2);
 await notificationPage(db,'current-user',new URLSearchParams({cursor:page.nextCursor!}));expect(query.or).toHaveBeenCalledWith(`created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${rows[0].id})`);
});
it('rejects malformed cursors and unbounded page limits before querying',async()=>{const {db,query}=fixture([]);await expect(notificationPage(db,'user',new URLSearchParams({cursor:'bad!'}))).rejects.toMatchObject({status:422});await expect(notificationPage(db,'user',new URLSearchParams({limit:'101'}))).rejects.toThrow();expect(query.select).not.toHaveBeenCalled();});
it('ends pagination without a continuation when no lookahead row exists',async()=>{const {db}=fixture([]);expect(await notificationPage(db,'user',new URLSearchParams())).toEqual({items:[],nextCursor:null});});
