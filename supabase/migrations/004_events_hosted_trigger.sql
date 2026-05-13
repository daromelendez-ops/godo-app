-- ─────────────────────────────────────────
-- 004: events_hosted / events_attended counters
-- ─────────────────────────────────────────

-- Increment events_hosted when a new event is published
create or replace function public.sync_events_hosted()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles
      set events_hosted = coalesce(events_hosted, 0) + 1
      where id = new.host_user_id;
  elsif TG_OP = 'DELETE' then
    update public.profiles
      set events_hosted = greatest(0, coalesce(events_hosted, 1) - 1)
      where id = old.host_user_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_events_hosted on public.events;
create trigger trg_events_hosted
  after insert or delete on public.events
  for each row execute procedure public.sync_events_hosted();

-- Increment / decrement events_attended when attendee state → confirmed
create or replace function public.sync_events_attended()
returns trigger language plpgsql as $$
begin
  -- transitioning INTO confirmed
  if (TG_OP = 'INSERT' and new.state = 'confirmed')
     or (TG_OP = 'UPDATE' and old.state <> 'confirmed' and new.state = 'confirmed')
  then
    update public.profiles
      set events_attended = coalesce(events_attended, 0) + 1
      where id = new.user_id;
  end if;

  -- transitioning OUT OF confirmed
  if (TG_OP = 'UPDATE' and old.state = 'confirmed' and new.state <> 'confirmed')
     or (TG_OP = 'DELETE' and old.state = 'confirmed')
  then
    update public.profiles
      set events_attended = greatest(0, coalesce(events_attended, 1) - 1)
      where id = coalesce(new.user_id, old.user_id);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_events_attended on public.event_attendees;
create trigger trg_events_attended
  after insert or update or delete on public.event_attendees
  for each row execute procedure public.sync_events_attended();

-- ─────────────────────────────────────────
-- Backfill existing data
-- ─────────────────────────────────────────

update public.profiles p
  set events_hosted = (
    select count(*) from public.events e where e.host_user_id = p.id
  );

update public.profiles p
  set events_attended = (
    select count(*) from public.event_attendees ea
    where ea.user_id = p.id and ea.state = 'confirmed'
  );
