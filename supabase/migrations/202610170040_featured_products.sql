begin;
-- Editorial selection is independent of publication. Existing products stay unfeatured.
alter table public.products add column featured boolean not null default false;
create index products_featured_public_page on public.products(created_at desc,id desc)
where status='published' and featured=true;
notify pgrst, 'reload schema';
commit;
