-- GoDo MVP Database Schema
-- Run this migration in the Supabase SQL editor

-- ─────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- Interests (lookup table)
-- ─────────────────────────────────────────
create table public.interests (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  emoji text,
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into public.interests (name, emoji) values
  ('Fitness', '🏋️'),
  ('Social', '🎉'),
  ('Games', '🎮'),
  ('Outdoors', '🌿'),
  ('Food & Drink', '🍕'),
  ('Arts', '🎨'),
  ('Music', '🎵'),
  ('Sports', '⚽'),
  ('Wellness', '🧘'),
  ('Learning', '📚'),
  ('Tech', '💻'),
  ('Other', '✨');

-- ─────────────────────────────────────────
-- Event categories (lookup table)
-- ─────────────────────────────────────────
create table public.event_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  emoji text,
  is_active boolean default true
);

insert into public.event_categories (name, emoji) values
  ('Social', '🎉'),
  ('Fitness', '🏋️'),
  ('Outdoors', '🌿'),
  ('Food & Drink', '🍕'),
  ('Arts', '🎨'),
  ('Music', '🎵'),
  ('Games', '🎮'),
  ('Wellness', '🧘'),
  ('Sports', '⚽'),
  ('Learning', '📚');

-- ─────────────────────────────────────────
-- Profiles (extends auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  cover_url text,
  bio text,
  city text,
  country text,
  neighborhood text,
  location_lat float8,
  location_lng float8,
  location_granted boolean default false,
  default_role text default 'attendee' check (default_role in ('attendee', 'host', 'venue')),
  member_since timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- User interests (join table)
-- ─────────────────────────────────────────
create table public.user_interests (
  user_id uuid references public.profiles on delete cascade,
  interest_id uuid references public.interests on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, interest_id)
);

-- ─────────────────────────────────────────
-- Events
-- ─────────────────────────────────────────
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  host_user_id uuid references public.profiles on delete cascade not null,
  category_id uuid references public.event_categories,
  title text not null,
  description text,
  emoji text default '🎉',
  privacy text not null default 'public' check (privacy in ('private', 'public')),
  event_type text not null default 'vibe' check (event_type in ('activity', 'vibe', 'event_plus')),
  max_group_size integer not null default 6,
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_paid boolean not null default false,
  price_cents integer default 0,
  currency text default 'CAD',
  -- Location (approx shown publicly, exact only to confirmed)
  approx_location text,
  exact_address text,
  place_type text check (place_type in ('home', 'cafe_restaurant', 'park', 'studio_gym', 'community_space', 'other')),
  -- Media
  cover_photo_url text,
  cover_type text default 'image' check (cover_type in ('image', 'video')),
  -- Status
  status text not null default 'draft' check (status in ('draft', 'published', 'full', 'canceled', 'past')),
  confirmed_count integer default 0,
  published_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- Event attendees (participation state machine)
-- ─────────────────────────────────────────
create table public.event_attendees (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  state text not null default 'pending_approval'
    check (state in ('pending_approval', 'confirmed', 'not_approved', 'canceled')),
  requested_at timestamptz default now(),
  approved_at timestamptz,
  denied_at timestamptz,
  canceled_at timestamptz,
  canceled_by text check (canceled_by in ('attendee', 'host', 'system')),
  re_request_allowed boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, user_id)
);

-- Trigger: update confirmed_count on events when attendee state changes
create or replace function public.update_confirmed_count()
returns trigger language plpgsql security definer as $$
begin
  update public.events
  set confirmed_count = (
    select count(*) from public.event_attendees
    where event_id = coalesce(new.event_id, old.event_id)
      and state = 'confirmed'
  )
  where id = coalesce(new.event_id, old.event_id);
  return new;
end;
$$;

create trigger on_attendee_state_change
  after insert or update or delete on public.event_attendees
  for each row execute procedure public.update_confirmed_count();

-- ─────────────────────────────────────────
-- Event chats (one per event)
-- ─────────────────────────────────────────
create table public.event_chats (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid unique references public.events on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'past', 'canceled')),
  created_at timestamptz default now()
);

create table public.event_chat_members (
  chat_id uuid references public.event_chats on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  role text not null check (role in ('host', 'attendee')),
  active boolean default true,
  joined_at timestamptz default now(),
  removed_at timestamptz,
  primary key (chat_id, user_id)
);

create table public.event_messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references public.event_chats on delete cascade not null,
  sender_user_id uuid references public.profiles on delete cascade not null,
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  body text not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  event_id uuid references public.events on delete set null,
  type text not null check (type in (
    'payment_confirmed', 'not_approved', 'refund_processed',
    'event_canceled', 'request_approved', 'system'
  )),
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- Payments & Refunds
-- ─────────────────────────────────────────
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events on delete restrict not null,
  attendee_user_id uuid references public.profiles on delete restrict not null,
  host_user_id uuid references public.profiles on delete restrict not null,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  amount_cents integer not null,
  platform_fee_cents integer default 0,
  host_amount_cents integer not null,
  currency text not null default 'CAD',
  status text not null default 'requires_payment_method'
    check (status in (
      'requires_payment_method', 'processing', 'succeeded',
      'failed', 'refunded', 'canceled'
    )),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.refunds (
  id uuid default uuid_generate_v4() primary key,
  payment_id uuid references public.payments on delete restrict not null,
  stripe_refund_id text unique,
  amount_cents integer not null,
  reason text not null check (reason in ('host_denied', 'attendee_canceled', 'host_canceled', 'system')),
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- Ratings (post-event, stars only — no written reviews)
-- ─────────────────────────────────────────
create table public.ratings (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events on delete cascade not null,
  rater_user_id uuid references public.profiles on delete cascade not null,
  rated_user_id uuid references public.profiles on delete cascade not null,
  rated_role text not null check (rated_role in ('host', 'attendee')),
  overall_stars integer not null check (overall_stars between 1 and 5),
  reliability_stars integer check (reliability_stars between 1 and 5),
  respect_stars integer check (respect_stars between 1 and 5),
  created_at timestamptz default now(),
  unique(event_id, rater_user_id, rated_user_id)
);

-- ─────────────────────────────────────────
-- Memories (past events for confirmed attendees)
-- ─────────────────────────────────────────
create table public.memories (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid unique references public.events on delete cascade not null,
  created_at timestamptz default now()
);

create table public.memory_photos (
  id uuid default uuid_generate_v4() primary key,
  memory_id uuid references public.memories on delete cascade not null,
  uploaded_by_user_id uuid references public.profiles on delete cascade not null,
  photo_url text not null,
  file_size_bytes integer,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- Saved & Liked items
-- ─────────────────────────────────────────
create table public.saved_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  item_type text not null check (item_type in ('event', 'recap', 'memory')),
  item_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id, item_type, item_id)
);

create table public.liked_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  item_type text not null check (item_type in ('event', 'recap', 'memory')),
  item_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id, item_type, item_id)
);

-- ─────────────────────────────────────────
-- Reports
-- ─────────────────────────────────────────
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_user_id uuid references public.profiles on delete cascade not null,
  event_id uuid references public.events on delete set null,
  reported_user_id uuid references public.profiles on delete set null,
  reason text not null check (reason in ('spam', 'unsafe', 'fake_event', 'harassment', 'other')),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.interests enable row level security;
alter table public.event_categories enable row level security;
alter table public.user_interests enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.event_chats enable row level security;
alter table public.event_chat_members enable row level security;
alter table public.event_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.ratings enable row level security;
alter table public.memories enable row level security;
alter table public.memory_photos enable row level security;
alter table public.saved_items enable row level security;
alter table public.liked_items enable row level security;
alter table public.reports enable row level security;

-- Profiles: users can read any profile, only update their own
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Interests: public read
create policy "Interests are public"
  on public.interests for select using (true);
create policy "Event categories are public"
  on public.event_categories for select using (true);

-- User interests: own only
create policy "Users manage own interests"
  on public.user_interests for all using (auth.uid() = user_id);

-- Events: public events viewable by all; private by friends (simplified for MVP)
create policy "Published events are viewable"
  on public.events for select
  using (status in ('published', 'full', 'past') and privacy = 'public');
create policy "Hosts can manage their events"
  on public.events for all using (auth.uid() = host_user_id);
create policy "Authenticated users can create events"
  on public.events for insert with check (auth.uid() = host_user_id);

-- Event attendees: participants can see their own records; host can see all for their event
create policy "Attendees see own participation"
  on public.event_attendees for select
  using (auth.uid() = user_id);
create policy "Hosts see attendees of their events"
  on public.event_attendees for select
  using (exists (
    select 1 from public.events e
    where e.id = event_attendees.event_id and e.host_user_id = auth.uid()
  ));
create policy "Authenticated users can request to join"
  on public.event_attendees for insert with check (auth.uid() = user_id);
create policy "Hosts can update attendee status"
  on public.event_attendees for update
  using (
    exists (
      select 1 from public.events e
      where e.id = event_attendees.event_id and e.host_user_id = auth.uid()
    )
    or auth.uid() = user_id
  );

-- Chat: only confirmed members can read/send messages
create policy "Chat members can view messages"
  on public.event_messages for select
  using (exists (
    select 1 from public.event_chat_members m
    where m.chat_id = event_messages.chat_id
      and m.user_id = auth.uid()
      and m.active = true
  ));
create policy "Chat members can send messages"
  on public.event_messages for insert
  with check (
    auth.uid() = sender_user_id and
    exists (
      select 1 from public.event_chat_members m
      where m.chat_id = event_messages.chat_id
        and m.user_id = auth.uid()
        and m.active = true
    )
  );

-- Notifications: own only
create policy "Users see own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "Users can mark own notifications read"
  on public.notifications for update using (auth.uid() = user_id);

-- Payments: participant and host can see
create policy "Payment participants can view"
  on public.payments for select
  using (auth.uid() = attendee_user_id or auth.uid() = host_user_id);

-- Saved & Liked: own only
create policy "Users manage own saved items"
  on public.saved_items for all using (auth.uid() = user_id);
create policy "Users manage own liked items"
  on public.liked_items for all using (auth.uid() = user_id);

-- Memories: confirmed attendees of the event
create policy "Confirmed attendees can view memories"
  on public.memories for select
  using (exists (
    select 1 from public.event_attendees a
    where a.event_id = memories.event_id
      and a.user_id = auth.uid()
      and a.state = 'confirmed'
  ));

create policy "Confirmed attendees can view memory photos"
  on public.memory_photos for select
  using (exists (
    select 1 from public.memories m
    join public.event_attendees a on a.event_id = m.event_id
    where m.id = memory_photos.memory_id
      and a.user_id = auth.uid()
      and a.state = 'confirmed'
  ));

create policy "Confirmed attendees can upload memory photos"
  on public.memory_photos for insert
  with check (auth.uid() = uploaded_by_user_id);

-- Reports: authenticated users can create; own reports visible
create policy "Authenticated users can report"
  on public.reports for insert with check (auth.uid() = reporter_user_id);
create policy "Users can view own reports"
  on public.reports for select using (auth.uid() = reporter_user_id);

-- ─────────────────────────────────────────
-- Realtime (enable for chat)
-- ─────────────────────────────────────────
alter publication supabase_realtime add table public.event_messages;
alter publication supabase_realtime add table public.event_attendees;
alter publication supabase_realtime add table public.notifications;
