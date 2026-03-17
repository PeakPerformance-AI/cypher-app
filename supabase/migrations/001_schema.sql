-- =============================================
-- CYPHER APP - Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- =============================================
-- USERS / PROFILES
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  follower_count int default 0,
  following_count int default 0,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'display_name', 'New Artist')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- BEATS
-- =============================================
create table public.beats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  bpm int,
  key text,
  mood text,
  audio_url text not null,
  video_url text,
  duration_seconds int,
  play_count int default 0,
  cypher_count int default 0,
  created_at timestamptz default now()
);

create index idx_beats_user on public.beats(user_id);
create index idx_beats_mood on public.beats(mood);
create index idx_beats_created on public.beats(created_at desc);

-- =============================================
-- CYPHERS (rap recordings over beats)
-- =============================================
create table public.cyphers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  beat_id uuid references public.beats(id) on delete cascade not null,
  title text,
  caption text,
  audio_url text,
  video_url text,
  duration_seconds int,
  like_count int default 0,
  comment_count int default 0,
  share_count int default 0,
  created_at timestamptz default now()
);

create index idx_cyphers_user on public.cyphers(user_id);
create index idx_cyphers_beat on public.cyphers(beat_id);
create index idx_cyphers_created on public.cyphers(created_at desc);

-- Increment beat cypher count
create or replace function public.increment_cypher_count()
returns trigger as $$
begin
  update public.beats set cypher_count = cypher_count + 1 where id = new.beat_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_cypher_created
  after insert on public.cyphers
  for each row execute function public.increment_cypher_count();

-- =============================================
-- FEED POSTS (unified view of beats + cyphers)
-- =============================================
create view public.feed as
  select
    c.id,
    'cypher' as type,
    c.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    c.caption,
    c.video_url,
    c.audio_url,
    c.like_count,
    c.comment_count,
    c.share_count,
    c.created_at,
    b.title as beat_title,
    b.bpm as beat_bpm,
    bp.username as beat_producer
  from public.cyphers c
  join public.profiles p on c.user_id = p.id
  join public.beats b on c.beat_id = b.id
  join public.profiles bp on b.user_id = bp.id

  union all

  select
    b.id,
    'beat' as type,
    b.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    null as caption,
    b.video_url,
    b.audio_url,
    0 as like_count,
    0 as comment_count,
    0 as share_count,
    b.created_at,
    b.title as beat_title,
    b.bpm as beat_bpm,
    p.username as beat_producer
  from public.beats b
  join public.profiles p on b.user_id = p.id

  order by created_at desc;

-- =============================================
-- LIKES
-- =============================================
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  cypher_id uuid references public.cyphers(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, cypher_id)
);

-- Auto update like count
create or replace function public.update_like_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.cyphers set like_count = like_count + 1 where id = new.cypher_id;
  elsif TG_OP = 'DELETE' then
    update public.cyphers set like_count = like_count - 1 where id = old.cypher_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on public.likes
  for each row execute function public.update_like_count();

-- =============================================
-- COMMENTS
-- =============================================
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  cypher_id uuid references public.cyphers(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create index idx_comments_cypher on public.comments(cypher_id, created_at desc);

-- Auto update comment count
create or replace function public.update_comment_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.cyphers set comment_count = comment_count + 1 where id = new.cypher_id;
  elsif TG_OP = 'DELETE' then
    update public.cyphers set comment_count = comment_count - 1 where id = old.cypher_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute function public.update_comment_count();

-- =============================================
-- FOLLOWS
-- =============================================
create table public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- Auto update follower/following counts
create or replace function public.update_follow_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set follower_count = follower_count + 1 where id = new.following_id;
  elsif TG_OP = 'DELETE' then
    update public.profiles set following_count = following_count - 1 where id = old.follower_id;
    update public.profiles set follower_count = follower_count - 1 where id = old.following_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_follow_change
  after insert or delete on public.follows
  for each row execute function public.update_follow_counts();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.profiles enable row level security;
alter table public.beats enable row level security;
alter table public.cyphers enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;

-- Everyone can read profiles, beats, cyphers, comments
create policy "Public read" on public.profiles for select using (true);
create policy "Public read" on public.beats for select using (true);
create policy "Public read" on public.cyphers for select using (true);
create policy "Public read" on public.comments for select using (true);
create policy "Public read" on public.likes for select using (true);
create policy "Public read" on public.follows for select using (true);

-- Users can update their own profile
create policy "Own profile" on public.profiles for update using (auth.uid() = id);

-- Users can insert their own content
create policy "Own beats" on public.beats for insert with check (auth.uid() = user_id);
create policy "Own cyphers" on public.cyphers for insert with check (auth.uid() = user_id);
create policy "Own comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Own likes" on public.likes for insert with check (auth.uid() = user_id);
create policy "Own follows" on public.follows for insert with check (auth.uid() = follower_id);

-- Users can delete their own content
create policy "Delete own beats" on public.beats for delete using (auth.uid() = user_id);
create policy "Delete own cyphers" on public.cyphers for delete using (auth.uid() = user_id);
create policy "Delete own comments" on public.comments for delete using (auth.uid() = user_id);
create policy "Delete own likes" on public.likes for delete using (auth.uid() = user_id);
create policy "Delete own follows" on public.follows for delete using (auth.uid() = follower_id);

-- =============================================
-- STORAGE BUCKETS
-- =============================================
-- Run these in the Supabase dashboard under Storage:
-- 1. Create bucket "beats" (public)
-- 2. Create bucket "cyphers" (public)
-- 3. Create bucket "avatars" (public)
