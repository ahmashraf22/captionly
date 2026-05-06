-- posts table: AI-generated social posts, one row per day per business
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id)  on delete cascade,
  business_id uuid not null references businesses(id)  on delete cascade,
  day_number  int  not null check (day_number between 1 and 30),
  platform    text not null check (platform in ('Instagram', 'Facebook')),
  content     text not null,
  created_at  timestamptz not null default now()
);

-- one row per (business, day) so re-generation can upsert cleanly
create unique index if not exists posts_business_day_idx
  on posts(business_id, day_number);

create index if not exists posts_user_id_idx on posts(user_id);

-- Row-level security: each user can only read/write their own posts
alter table posts enable row level security;

create policy "owner can select posts" on posts
  for select using (auth.uid() = user_id);

create policy "owner can insert posts" on posts
  for insert with check (auth.uid() = user_id);

create policy "owner can update posts" on posts
  for update using (auth.uid() = user_id);

create policy "owner can delete posts" on posts
  for delete using (auth.uid() = user_id);
