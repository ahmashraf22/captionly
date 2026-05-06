-- businesses table: stores onboarding info submitted by each user
create table if not exists businesses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        text not null,
  city        text not null,
  country     text not null,
  audience    text not null,
  tone        text not null,
  description text not null,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────
-- Migration: state → country (run once on existing databases)
-- ──────────────────────────────────────────────────────────────────
-- alter table businesses rename column state to country;

-- one business profile per user
create unique index if not exists businesses_user_id_idx on businesses(user_id);

-- users can only read/write their own row
alter table businesses enable row level security;

create policy "owner can select" on businesses
  for select using (auth.uid() = user_id);

create policy "owner can insert" on businesses
  for insert with check (auth.uid() = user_id);

create policy "owner can update" on businesses
  for update using (auth.uid() = user_id);
