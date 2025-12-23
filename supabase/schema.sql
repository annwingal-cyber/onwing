-- Enable pgcrypto for UUID generation
create extension if not exists pgcrypto;

-- Enum for Gua visibility
create type gua_visibility as enum ('private', 'public', 'custom');

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar text,
  created_at timestamptz default now()
);

-- Persons table (瓜主/人物档案)
create table public.persons (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  aliases text[] not null default '{}',
  avatar_color text,
  icon text,
  is_discoverable boolean not null default true,
  created_at timestamptz default now()
);

-- Guas table (瓜/记录)
create table public.guas (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  content text not null,
  summary_ai text,
  tags_ai text[] not null default '{}',
  tags_manual text[] not null default '{}',
  person_ids uuid[] not null default '{}',
  visibility gua_visibility not null,
  allowed_user_ids uuid[] not null default '{}',
  media_urls text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  search tsvector generated always as (
    to_tsvector('simple',
      coalesce(title,'') || ' ' ||
      content || ' ' ||
      coalesce(summary_ai,'')
    )
  ) stored
);

-- Function to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger guas_set_updated_at
before update on public.guas
for each row execute function public.set_updated_at();

-- Reactions table (甜🍉)
create table public.reactions (
  id bigserial primary key,
  gua_id uuid not null references public.guas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (gua_id, user_id)
);

-- Comments table
create table public.comments (
  id bigserial primary key,
  gua_id uuid not null references public.guas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- AI Jobs table
create type ai_status as enum ('pending', 'processing', 'done', 'error');

create table public.ai_jobs (
  id bigserial primary key,
  gua_id uuid not null references public.guas(id) on delete cascade,
  status ai_status not null default 'pending',
  result_json jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index guas_created_at_idx on public.guas (created_at desc);
create index guas_search_idx on public.guas using gin (search);
create index guas_tags_ai_gin on public.guas using gin (tags_ai);
create index guas_tags_manual_gin on public.guas using gin (tags_manual);
create index guas_person_ids_gin on public.guas using gin (person_ids);
create index reactions_gua_user_unique on public.reactions (gua_id, user_id);
create index comments_gua_created_idx on public.comments (gua_id, created_at desc);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.persons enable row level security;
alter table public.guas enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.ai_jobs enable row level security;

-- Profiles Policies
create policy profiles_select_self
on public.profiles for select
using (id = auth.uid());

create policy profiles_update_self
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy profiles_insert_self
on public.profiles for insert
with check (id = auth.uid());

-- Also allow public read of basic profile info if needed for comments/reactions display
-- (Adjust fields selection in query to avoid leaking private data if any)
create policy profiles_select_public
on public.profiles for select
using (true); 

-- Persons Policies
create policy persons_select_owner_or_discoverable
on public.persons for select
using (owner_user_id = auth.uid() or is_discoverable = true);

create policy persons_mutate_owner_only
on public.persons for all
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- Guas Policies
create policy guas_select_visibility
on public.guas for select
using (
  deleted_at is null and (
    author_user_id = auth.uid()
    or visibility = 'public'
    or (visibility = 'custom' and auth.uid() = any(allowed_user_ids))
  )
);

create policy guas_insert_author_only
on public.guas for insert
with check (author_user_id = auth.uid());

create policy guas_update_author_only
on public.guas for update
using (author_user_id = auth.uid())
with check (author_user_id = auth.uid());

-- Reactions Policies
create policy reactions_select_if_can_view
on public.reactions for select
using (
  exists (
    select 1 from public.guas g
    where g.id = reactions.gua_id
      and g.deleted_at is null
      and (
        g.author_user_id = auth.uid()
        or g.visibility = 'public'
        or (g.visibility = 'custom' and auth.uid() = any(g.allowed_user_ids))
      )
  )
);

create policy reactions_insert_owner_and_viewer
on public.reactions for insert
with check (
  user_id = auth.uid() and exists (
    select 1 from public.guas g
    where g.id = reactions.gua_id
      and g.deleted_at is null
      and (
        g.author_user_id = auth.uid()
        or g.visibility = 'public'
        or (g.visibility = 'custom' and auth.uid() = any(g.allowed_user_ids))
      )
  )
);

create policy reactions_delete_owner_only
on public.reactions for delete
using (user_id = auth.uid());

-- Comments Policies
create policy comments_select_if_can_view
on public.comments for select
using (
  exists (
    select 1 from public.guas g
    where g.id = comments.gua_id
      and g.deleted_at is null
      and (
        g.author_user_id = auth.uid()
        or g.visibility = 'public'
        or (g.visibility = 'custom' and auth.uid() = any(g.allowed_user_ids))
      )
  )
);

create policy comments_insert_owner_and_viewer
on public.comments for insert
with check (
  user_id = auth.uid() and exists (
    select 1 from public.guas g
    where g.id = comments.gua_id
      and g.deleted_at is null
      and (
        g.author_user_id = auth.uid()
        or g.visibility = 'public'
        or (g.visibility = 'custom' and auth.uid() = any(g.allowed_user_ids))
      )
  )
);

create policy comments_update_delete_author_only
on public.comments for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- AI Jobs Policies
create policy ai_jobs_select_author_only
on public.ai_jobs for select
using (
  exists (
    select 1 from public.guas g
    where g.id = ai_jobs.gua_id and g.author_user_id = auth.uid()
  )
);

create policy ai_jobs_insert_author_only
on public.ai_jobs for insert
with check (
  exists (
    select 1 from public.guas g
    where g.id = ai_jobs.gua_id and g.author_user_id = auth.uid()
  )
);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, avatar)
  values (new.id, new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
