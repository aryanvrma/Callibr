-- 0003_tabbly_integration.sql
-- Adds fields needed to track Tabbly campaigns against verification cases

alter table verification_cases
  add column if not exists tabbly_campaign_id text,
  add column if not exists tabbly_agent_id text;

-- index for the polling job to quickly find cases awaiting a call result
create index if not exists idx_verification_cases_tabbly_campaign
  on verification_cases (tabbly_campaign_id)
  where tabbly_campaign_id is not null;
