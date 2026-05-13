-- ─────────────────────────────────────────
-- 006: fix waitlist RLS — allow reads in SQL Editor
-- ─────────────────────────────────────────

-- The original policy had `using (false)` which blocked ALL selects,
-- including from the Supabase SQL Editor (which runs as authenticated, not service_role).
drop policy if exists "Service role reads waitlist" on public.waitlist;

create policy "Authenticated can read waitlist" on public.waitlist
  for select using (true);
