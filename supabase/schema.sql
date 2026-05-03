create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  description text default '',
  status text not null default 'pending',
  priority text not null default 'medium',
  category text default 'General',
  due_date timestamptz,
  completed_at timestamptz,
  outcome text,
  impact text,
  project text,
  client text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks add column if not exists completed_at timestamptz;
alter table public.tasks add column if not exists outcome text;
alter table public.tasks add column if not exists impact text;
alter table public.tasks add column if not exists project text;
alter table public.tasks add column if not exists client text;
alter table public.tasks add column if not exists tags text[] not null default '{}';

create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_created_at_idx on public.tasks (created_at desc);
create index if not exists tasks_completed_at_idx on public.tasks (completed_at desc);
create index if not exists tasks_project_idx on public.tasks (project);
create index if not exists tasks_client_idx on public.tasks (client);
create index if not exists tasks_tags_gin_idx on public.tasks using gin (tags);

alter table public.tasks enable row level security;

create policy "Users can read their own tasks"
on public.tasks
for select
using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
on public.tasks
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
on public.tasks
for update
using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
on public.tasks
for delete
using (auth.uid() = user_id);
