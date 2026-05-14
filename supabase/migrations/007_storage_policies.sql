-- ─────────────────────────────────────────
-- 007: storage bucket RLS policies
-- ─────────────────────────────────────────
-- Supabase storage uses storage.objects with RLS.
-- Without explicit INSERT policies, authenticated uploads are blocked.

-- ── event-photos bucket ──
insert into storage.buckets (id, name, public)
  values ('event-photos', 'event-photos', true)
  on conflict (id) do nothing;

create policy "Authenticated users can upload event photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-photos');

create policy "Anyone can view event photos storage"
  on storage.objects for select
  using (bucket_id = 'event-photos');

create policy "Users can delete own event photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── event-covers bucket ──
insert into storage.buckets (id, name, public)
  values ('event-covers', 'event-covers', true)
  on conflict (id) do nothing;

create policy "Authenticated users can upload event covers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-covers');

create policy "Anyone can view event covers storage"
  on storage.objects for select
  using (bucket_id = 'event-covers');

-- ── avatars bucket ──
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

create policy "Anyone can view avatars storage"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
