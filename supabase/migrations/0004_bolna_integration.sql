-- 0004_bolna_integration.sql
-- Adds Bolna tracking fields alongside the existing Tabbly ones (keep both —
-- no need to drop the Tabbly columns, they cost nothing sitting unused and
-- keep your options open if you revisit Tabbly later).

alter table verification_cases
  add column if not exists bolna_execution_id text,
  add column if not exists bolna_agent_id text;

create index if not exists idx_verification_cases_bolna_execution
  on verification_cases (bolna_execution_id)
  where bolna_execution_id is not null;
