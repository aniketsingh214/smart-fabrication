begin;
-- RLS already denies direct ledger mutations; also remove inherited default SQL grants explicitly.
revoke all on public.catalog_copies,public.expense_reversals from anon;
revoke insert,update,delete,truncate,references,trigger on public.catalog_copies,public.expense_reversals from authenticated;
grant select on public.catalog_copies,public.expense_reversals to authenticated;
revoke insert,update,delete,truncate,references,trigger on public.product_variants,public.product_options from anon;
revoke delete,truncate,references,trigger on public.product_variants,public.product_options from authenticated;
commit;
