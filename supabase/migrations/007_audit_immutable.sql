-- ─────────────────────────────────────────────────────────────────────────
-- 007_audit_immutable.sql — make audit_log truly append-only.
-- REVOKE alone can't strip the table owner's implicit UPDATE/DELETE, so a trigger
-- blocks mutation for EVERY role (owner included). Only a superuser disabling the
-- trigger could bypass — i.e. Michael's break-glass DB access. (spec §3.1)
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.block_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only (no % allowed)', tg_op;
end;
$$;

drop trigger if exists audit_no_update on audit_log;
drop trigger if exists audit_no_delete on audit_log;

create trigger audit_no_update before update on audit_log
  for each row execute function public.block_audit_mutation();
create trigger audit_no_delete before delete on audit_log
  for each row execute function public.block_audit_mutation();
