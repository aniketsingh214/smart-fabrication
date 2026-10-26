begin;
create schema if not exists smartfabrication_rate_limit;
revoke all on schema smartfabrication_rate_limit from public,anon,authenticated;
create table smartfabrication_rate_limit.request_rate_buckets (
 bucket_key text primary key check (bucket_key ~ '^[a-f0-9]{64}$'),
 hits integer not null check (hits > 0),
 resets_at timestamptz not null
);
alter table smartfabrication_rate_limit.request_rate_buckets enable row level security;
revoke all on smartfabrication_rate_limit.request_rate_buckets from public,anon,authenticated;
create index request_rate_buckets_expiry_idx on smartfabrication_rate_limit.request_rate_buckets(resets_at);
create function public.consume_request_quota(bucket text,max_hits integer,window_seconds integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare current_time timestamptz:=clock_timestamp(); counted integer; reset_time timestamptz;
begin
 if bucket !~ '^[a-f0-9]{64}$' or max_hits not between 1 and 10000 or window_seconds not between 1 and 86400 then raise exception 'Invalid quota parameters';end if;
 insert into smartfabrication_rate_limit.request_rate_buckets(bucket_key,hits,resets_at)
 values(bucket,1,current_time+make_interval(secs=>window_seconds))
 on conflict(bucket_key) do update set
 hits=case when smartfabrication_rate_limit.request_rate_buckets.resets_at<=current_time then 1 else least(smartfabrication_rate_limit.request_rate_buckets.hits+1,max_hits+1) end,
 resets_at=case when smartfabrication_rate_limit.request_rate_buckets.resets_at<=current_time then current_time+make_interval(secs=>window_seconds) else smartfabrication_rate_limit.request_rate_buckets.resets_at end
 returning hits,resets_at into counted,reset_time;
 if random()<0.01 then delete from smartfabrication_rate_limit.request_rate_buckets where bucket_key in (select bucket_key from smartfabrication_rate_limit.request_rate_buckets where resets_at<current_time-interval '1 day' limit 500);end if;
 return jsonb_build_object('allowed',counted<=max_hits,'remaining',greatest(0,max_hits-counted),'retry_after',greatest(1,ceil(extract(epoch from reset_time-current_time))::integer),'reset_at',floor(extract(epoch from reset_time))::bigint);
end;$$;
revoke all on function public.consume_request_quota(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_request_quota(text,integer,integer) to service_role;
comment on function public.consume_request_quota(text,integer,integer) is 'Server-only atomic request quota; no access to workshop business records.';
notify pgrst,'reload schema';
commit;
