-- 0001_init_schema.sql
-- Core schema for the AI-native BGV platform

-- ============================================================
-- ENUMS
-- ============================================================

create type verification_status as enum (
  'pending',
  'dialing',
  'in_progress',
  'needs_retry',
  'escalated',
  'verified',
  'failed'
);

-- ============================================================
-- TABLES
-- ============================================================

-- clients: the companies who USE your platform (EvolveX's customers,
-- e.g. Zentryx, Solve LegalX) — not to be confused with `employers` below,
-- which is the candidate's past employer being verified.
create table clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- employers: the candidate's PAST employer, whose HR team gets called
-- to verify the candidate's employment history.
create table employers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hr_contact_name text,
  hr_contact_phone text,
  hr_contact_email text,
  created_at timestamptz not null default now()
);

create table candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table verification_cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  employer_id uuid references employers(id) on delete set null,
  status verification_status not null default 'pending',
  check_type text, -- e.g. 'employment', 'reference'
  retry_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table call_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references verification_cases(id) on delete cascade,
  call_provider text, -- 'vapi' or 'twilio'
  call_sid text,
  transcript text,
  extracted_data jsonb, -- OpenAI-parsed structured result
  outcome text, -- 'answered', 'no_answer', 'wrong_number', 'refused'
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
-- These two are the ones flagged as must-have — both columns get
-- queried on almost every dashboard load and every webhook write.

create index idx_verification_cases_status
  on verification_cases (status);

create index idx_call_logs_case_id
  on call_logs (case_id);

-- Additional indexes worth adding now rather than after you feel the pain:

-- client dashboard always filters "my cases" — this is the other
-- column hit on every single dashboard request.
create index idx_verification_cases_client_id
  on verification_cases (client_id);

-- retry engine and reporting will filter/sort by recency often.
create index idx_verification_cases_created_at
  on verification_cases (created_at desc);

-- candidate/employer lookups (e.g. "has this phone number been called before")
create index idx_candidates_phone
  on candidates (phone);

create index idx_employers_hr_contact_phone
  on employers (hr_contact_phone);

-- ============================================================
-- updated_at TRIGGER
-- ============================================================
-- Keeps `updated_at` accurate without every API route needing to set it manually.

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

create trigger trg_verification_cases_updated_at
  before update on verification_cases
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (enable now, policies added in 0002)
-- ============================================================
-- Enabling RLS with no policies yet means these tables are locked down
-- by default until you explicitly grant access — safer than leaving
-- them open and adding RLS later after real data is flowing.

alter table clients enable row level security;
alter table employers enable row level security;
alter table candidates enable row level security;
alter table verification_cases enable row level security;
alter table call_logs enable row level security;
