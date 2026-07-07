-- 0002_auth_profiles.sql
-- Adds role-based profiles linked to Supabase Auth users

-- ============================================================
-- TABLE
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('client', 'admin')) default 'client',
  client_id uuid references clients(id) on delete set null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
-- Whenever someone signs up via Supabase Auth, automatically create
-- a matching profiles row so you never have a user without one.

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Users can read their own profile
create policy "users read own profile"
on profiles for select
using (auth.uid() = id);

-- Admins can read every profile
create policy "admins read all profiles"
on profiles for select
using (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);

-- ============================================================
-- POLICIES ON EXISTING TABLES (now that roles exist)
-- ============================================================

-- clients: client users see only their own client row; admins see all
create policy "clients see own row"
on clients for select
using (
  id = (select client_id from profiles where id = auth.uid())
);

create policy "admins see all clients"
on clients for select
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- verification_cases: client users see only their own cases; admins see all
create policy "clients see own cases"
on verification_cases for select
using (
  client_id = (select client_id from profiles where id = auth.uid())
);

create policy "admins see all cases"
on verification_cases for select
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- admins can insert/update cases; service role (backend) bypasses RLS entirely
create policy "admins manage cases"
on verification_cases for all
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
