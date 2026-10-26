begin;
-- Keep applied migration 48 immutable; avoid PostgreSQL CURRENT_TIME keyword.
create or replace function public.consume_request_quota(bucket text,max_hits integer,window_seconds integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare quota_now timestamptz:=clock_timestamp(); counted integer; reset_time timestamptz;
begin
 if bucket is null or max_hits is null or window_seconds is null or bucket !~ '^[a-f0-9]{64}$' or max_hits not between 1 and 10000 or window_seconds not between 1 and 86400 then raise exception 'Invalid quota parameters';end if;
 insert into smartfabrication_rate_limit.request_rate_buckets(bucket_key,hits,resets_at)
 values(bucket,1,quota_now+make_interval(secs=>window_seconds))
 on conflict(bucket_key) do update set
 hits=case when smartfabrication_rate_limit.request_rate_buckets.resets_at<=quota_now then 1 else least(smartfabrication_rate_limit.request_rate_buckets.hits+1,max_hits+1) end,
 resets_at=case when smartfabrication_rate_limit.request_rate_buckets.resets_at<=quota_now then quota_now+make_interval(secs=>window_seconds) else smartfabrication_rate_limit.request_rate_buckets.resets_at end
 returning hits,resets_at into counted,reset_time;
 if random()<0.01 then delete from smartfabrication_rate_limit.request_rate_buckets where bucket_key in (select bucket_key from smartfabrication_rate_limit.request_rate_buckets where resets_at<quota_now-interval '1 day' limit 500);end if;
 return jsonb_build_object('allowed',counted<=max_hits,'remaining',greatest(0,max_hits-counted),'retry_after',greatest(1,ceil(extract(epoch from reset_time-quota_now))::integer),'reset_at',floor(extract(epoch from reset_time))::bigint);
end;$$;
notify pgrst,'reload schema';
commit;
