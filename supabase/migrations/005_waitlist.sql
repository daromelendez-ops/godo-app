-- ─────────────────────────────────────────
-- 005: waitlist table for web landing page
-- ─────────────────────────────────────────

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  city        text,
  created_at  timestamptz default now()
);

alter table public.waitlist enable row level security;

-- Anyone can insert (no auth required — public form)
create policy "Public can join waitlist" on public.waitlist
  for insert with check (true);

-- Only service role reads (dashboard only, not app)
create policy "Service role reads waitlist" on public.waitlist
  for select using (false);
