-- Fail rather than rewrite any pre-existing cyclic business hierarchy.
do $$begin
 if exists(with recursive paths as (
  select id,parent_id,array[id] visited,false cycle from public.categories
  union all select c.id,c.parent_id,p.visited||c.id,c.id=any(p.visited)
  from public.categories c join paths p on c.id=p.parent_id where not p.cycle
 ) select 1 from paths where cycle) then raise exception 'Existing category cycle requires explicit review';end if;
end $$;

-- Serialize category statements before they acquire target-row locks. Ancestor
-- row locks below also reject stale REPEATABLE READ snapshots (SQLSTATE 40001).
create function public.serialize_category_hierarchy() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(731014,42);
 return null;
end $$;
revoke all on function public.serialize_category_hierarchy() from public,anon,authenticated;
create trigger category_hierarchy_serialization before insert or update or delete on public.categories
for each statement execute function public.serialize_category_hierarchy();

create or replace function public.category_cycle_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.parent_id=new.id then raise exception using errcode='23514',message='Category cannot be its own parent';end if;
 if new.parent_id is not null then
  perform c.id from public.categories c where c.id in(
   with recursive parents as (
    select id,parent_id from public.categories where id=new.parent_id
    union select c.id,c.parent_id from public.categories c join parents p on c.id=p.parent_id
   ) select id from parents
  ) order by c.id for update;
  if exists(with recursive parents as (
   select id,parent_id from public.categories where id=new.parent_id
   union select c.id,c.parent_id from public.categories c join parents p on c.id=p.parent_id
  ) select 1 from parents where id=new.id) then
   raise exception using errcode='23514',message='Category hierarchy cannot contain a cycle';
  end if;
 end if;
 return new;
end $$;
revoke all on function public.category_cycle_guard() from public,anon,authenticated;
notify pgrst,'reload schema';
