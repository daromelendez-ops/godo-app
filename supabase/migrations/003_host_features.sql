-- ─────────────────────────────────────────
-- Host score + rating aggregates on profiles
-- ─────────────────────────────────────────
alter table public.profiles
  add column if not exists score integer default 0,
  add column if not exists avg_rating numeric(3,2) default 0,
  add column if not exists rating_count integer default 0,
  add column if not exists events_hosted integer default 0,
  add column if not exists events_attended integer default 0;

-- ─────────────────────────────────────────
-- Denormalized likes_count on events
-- ─────────────────────────────────────────
alter table public.events
  add column if not exists likes_count integer default 0;

-- ─────────────────────────────────────────
-- Photo moderation status
-- ─────────────────────────────────────────
alter table public.event_photos
  add column if not exists status text default 'approved'
    check (status in ('pending', 'approved', 'rejected'));

-- ─────────────────────────────────────────
-- Trigger: keep event likes_count in sync
-- ─────────────────────────────────────────
create or replace function public.sync_event_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.item_type = 'event' then
    update public.events set likes_count = likes_count + 1 where id = new.item_id;
  elsif tg_op = 'DELETE' and old.item_type = 'event' then
    update public.events set likes_count = greatest(0, likes_count - 1) where id = old.item_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_event_likes_count on public.liked_items;
create trigger trg_event_likes_count
  after insert or delete on public.liked_items
  for each row execute procedure public.sync_event_likes_count();

-- ─────────────────────────────────────────
-- Trigger: update host score when rated
-- Score = avg_stars * 20 + total_event_likes (capped at 100 per contribution)
-- ─────────────────────────────────────────
create or replace function public.sync_host_score()
returns trigger language plpgsql as $$
declare
  v_rated uuid := coalesce(new.rated_user_id, old.rated_user_id);
  v_avg   numeric(3,2);
  v_count integer;
  v_likes integer;
begin
  select avg(overall_stars), count(*)
  into v_avg, v_count
  from public.ratings
  where rated_user_id = v_rated;

  select coalesce(sum(e.likes_count), 0)
  into v_likes
  from public.events e
  where e.host_user_id = v_rated;

  update public.profiles set
    avg_rating   = coalesce(v_avg, 0),
    rating_count = coalesce(v_count, 0),
    score        = least(999, (coalesce(v_avg, 0) * 20)::integer + v_likes)
  where id = v_rated;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_host_score on public.ratings;
create trigger trg_host_score
  after insert or update or delete on public.ratings
  for each row execute procedure public.sync_host_score();

-- ─────────────────────────────────────────
-- RLS additions
-- ─────────────────────────────────────────

-- Ratings: anyone reads, auth users insert (once per event pair)
create policy "Anyone can read ratings" on public.ratings
  for select using (true);

create policy "Authenticated users can rate" on public.ratings
  for insert with check (auth.uid() = rater_user_id);

-- Event photos: host can approve/reject
create policy "Host can moderate photos" on public.event_photos
  for update using (
    exists (
      select 1 from public.events e
      where e.id = event_photos.event_id and e.host_user_id = auth.uid()
    )
  );

-- event_attendees: host can approve/reject (update state)
-- (already covered by existing policy in 001_init.sql — no change needed)

-- ─────────────────────────────────────────
-- Realtime
-- ─────────────────────────────────────────
alter publication supabase_realtime add table public.ratings;
alter publication supabase_realtime add table public.liked_items;
