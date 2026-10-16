begin;
-- Named API-role defaults can survive a revoke from PUBLIC alone.
revoke execute on function public.dispatch_due_notifications() from public,anon,authenticated;
grant execute on function public.dispatch_due_notifications() to service_role;
-- New functions must explicitly opt into their intended API audience.
alter default privileges in schema public revoke execute on functions from public,anon,authenticated;
commit;
