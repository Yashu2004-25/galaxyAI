-- Galaxy AI Supabase schema. Run once in Supabase SQL Editor.
create table public.roadmaps (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null, level text, hours_per_week int, title text not null, overview text, created_at timestamptz not null default now()
);
create table public.roadmap_steps (
  id uuid primary key default gen_random_uuid(), roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, step_order int not null, title text not null,
  goal text, duration text, topics jsonb not null default '[]'::jsonb, is_done boolean not null default false
);
create table public.resources (
  id uuid primary key default gen_random_uuid(), step_id uuid not null references public.roadmap_steps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, resource_order int not null, title text not null,
  channel text, url text not null, video_id text, duration_hint text, why text
);
create table public.chats (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat', mode text not null default 'general', model text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(), chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')), content text not null, model text, created_at timestamptz not null default now()
);
create index on public.roadmaps (user_id, created_at desc);
create index on public.roadmap_steps (roadmap_id, step_order);
create index on public.resources (step_id, resource_order);
create index on public.chats (user_id, updated_at desc);
create index on public.chat_messages (chat_id, created_at);
alter table public.roadmaps enable row level security;
alter table public.roadmap_steps enable row level security;
alter table public.resources enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
create policy "own roadmaps" on public.roadmaps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own steps" on public.roadmap_steps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own resources" on public.resources for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own chats" on public.chats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own messages" on public.chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
