-- ─────────────────────────────────────────
-- Public comments on events
-- ─────────────────────────────────────────
create table public.event_comments (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz default now()
);

alter table public.event_comments enable row level security;

create policy "Anyone can read comments" on public.event_comments
  for select using (true);

create policy "Authenticated users can comment" on public.event_comments
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments" on public.event_comments
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Event photos (memories)
-- ─────────────────────────────────────────
create table public.event_photos (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  storage_path text not null,
  public_url text not null,
  media_type text default 'image' check (media_type in ('image', 'video')),
  caption text,
  created_at timestamptz default now()
);

alter table public.event_photos enable row level security;

create policy "Anyone can view event photos" on public.event_photos
  for select using (true);

create policy "Authenticated users can upload photos" on public.event_photos
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own photos" on public.event_photos
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- User location on profile (already exists, just expose via RPC)
-- ─────────────────────────────────────────

-- Function to update user location
create or replace function public.update_user_location(
  lat float8,
  lng float8,
  city_name text default null
)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set
    location_lat = lat,
    location_lng = lng,
    city = coalesce(city_name, city),
    location_granted = true,
    updated_at = now()
  where id = auth.uid();
end;
$$;

-- Function: nearby events sorted by distance (haversine)
create or replace function public.nearby_events(
  user_lat float8,
  user_lng float8,
  radius_km float8 default 10
)
returns table (
  id uuid,
  title text,
  emoji text,
  starts_at timestamptz,
  approx_location text,
  cover_photo_url text,
  cover_type text,
  is_paid boolean,
  price_cents integer,
  confirmed_count integer,
  max_group_size integer,
  status text,
  distance_km float8
) language sql stable as $$
  select
    e.id,
    e.title,
    e.emoji,
    e.starts_at,
    e.approx_location,
    e.cover_photo_url,
    e.cover_type,
    e.is_paid,
    e.price_cents,
    e.confirmed_count,
    e.max_group_size,
    e.status,
    (6371 * acos(
      cos(radians(user_lat)) * cos(radians(p.location_lat)) *
      cos(radians(p.location_lng) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(p.location_lat))
    )) as distance_km
  from public.events e
  join public.profiles p on p.id = e.host_user_id
  where
    e.status = 'published'
    and p.location_lat is not null
    and p.location_lng is not null
    and (6371 * acos(
      cos(radians(user_lat)) * cos(radians(p.location_lat)) *
      cos(radians(p.location_lng) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(p.location_lat))
    )) <= radius_km
  order by distance_km asc;
$$;

-- ─────────────────────────────────────────
-- Realtime — enable for new tables + events
-- ─────────────────────────────────────────
alter publication supabase_realtime add table public.event_comments;
alter publication supabase_realtime add table public.event_photos;
alter publication supabase_realtime add table public.events;
