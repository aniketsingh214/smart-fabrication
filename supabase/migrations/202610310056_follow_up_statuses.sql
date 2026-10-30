begin;
-- Expand the allowed workflow without rewriting existing follow-up records.
alter table public.follow_ups drop constraint follow_ups_status_check;
alter table public.follow_ups add constraint follow_ups_status_check
  check (status in ('pending', 'processing', 'working', 'delay', 'completed'));
commit;
