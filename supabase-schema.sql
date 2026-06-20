-- Run this in Supabase SQL Editor

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_image_url text not null,
  prompt text not null,
  output_image_urls jsonb not null default '[]'::jsonb,
  video_url text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.generations enable row level security;

-- Users can only read their own rows
create policy "users_select_own" on public.generations
  for select using (auth.uid() = user_id);

-- Users can only insert their own rows
create policy "users_insert_own" on public.generations
  for insert with check (auth.uid() = user_id);

-- Users can only update their own rows
create policy "users_update_own" on public.generations
  for update using (auth.uid() = user_id);
