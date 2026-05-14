-- ─────────────────────────────────────────
-- 008: security hardening for demo launch
-- ─────────────────────────────────────────

-- 1. Prevent duplicate ratings: one rater per event per role
alter table public.ratings
  add constraint ratings_unique_per_event_role
  unique (event_id, rater_user_id, rated_role);

-- 2. Prevent users from rating themselves
alter table public.ratings
  add constraint ratings_no_self_rating
  check (rater_user_id <> rated_user_id);

-- 3. Prevent joining own event as attendee (subquery not allowed in CHECK, use trigger)
create or replace function public.prevent_host_self_join()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from public.events
    where id = NEW.event_id and host_user_id = NEW.user_id
  ) then
    raise exception 'Host cannot join their own event';
  end if;
  return NEW;
end;
$$;

create trigger trg_prevent_host_self_join
  before insert on public.event_attendees
  for each row execute function public.prevent_host_self_join();

-- 4. Profiles: enforce that users can only INSERT their own profile row
--    (already handled by trigger, but belt-and-suspenders)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 6. Waitlist: prevent obviously fake/script emails via basic length check
alter table public.waitlist
  add constraint waitlist_email_min_length
  check (char_length(trim(email)) >= 6);
