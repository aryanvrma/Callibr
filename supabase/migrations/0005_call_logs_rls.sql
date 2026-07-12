-- 0005_call_logs_rls.sql
create policy "clients see own call_logs"
on call_logs for select
using (
  case_id in (
    select id from verification_cases
    where client_id = (select client_id from profiles where id = auth.uid())
  )
);

create policy "admins see all call_logs"
on call_logs for select
using (is_admin());
