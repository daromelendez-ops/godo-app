import { supabase } from './supabase';
import { MOCK_EVENTS, type FeedEvent } from '../constants/mockData';

// Map a Supabase event row to FeedEvent format used by components
function mapRow(row: Record<string, unknown>, profile?: Record<string, unknown>): FeedEvent {
  const priceCents = (row.price_cents as number) ?? 0;
  const isPaid = row.is_paid as boolean;
  const startsAt = row.starts_at ? new Date(row.starts_at as string) : null;

  let timeLabel = 'Upcoming';
  if (startsAt) {
    const now = new Date();
    const diffMs = startsAt.getTime() - now.getTime();
    const diffH = diffMs / (1000 * 60 * 60);
    if (diffH < 12) timeLabel = 'Tonight';
    else if (diffH < 36) timeLabel = 'Tomorrow';
    else if (diffH < 168) timeLabel = 'This Weekend';
    else timeLabel = startsAt.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return {
    id: row.id as string,
    type: 'upcoming',
    username: (profile?.username as string) ?? '@host',
    avatarUrl: (profile?.avatar_url as string) ?? '',
    mediaUrl: (row.cover_photo_url as string) ?? '',
    mediaType: ((row.cover_type as string) === 'video' ? 'video' : 'image'),
    eventTitle: row.title as string,
    caption: (row.description as string) ?? '',
    timeLabel,
    neighborhood: (row.approx_location as string) ?? undefined,
    attending: (row.confirmed_count as number) ?? 0,
    capacity: (row.max_group_size as number) ?? 6,
    spotsLeft: ((row.max_group_size as number) ?? 6) - ((row.confirmed_count as number) ?? 0),
    price: isPaid ? `$${(priceCents / 100).toFixed(0)}` : 'Free',
    emoji: (row.emoji as string) ?? '🎉',
    description: (row.description as string) ?? undefined,
    address: (row.exact_address as string) ?? undefined,
    category: undefined,
    host: profile
      ? {
          name: (profile.username as string) ?? '@host',
          avatarUrl: (profile.avatar_url as string) ?? '',
          memberSince: new Date(profile.member_since as string ?? Date.now()).getFullYear().toString(),
        }
      : undefined,
  };
}

// Fetch published events. Falls back to MOCK_EVENTS if DB is empty.
export async function fetchFeed(): Promise<FeedEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles!host_user_id (
        id, username, avatar_url, member_since
      )
    `)
    .eq('status', 'published')
    .order('starts_at', { ascending: true })
    .limit(50);

  if (error || !data || data.length === 0) {
    return MOCK_EVENTS;
  }

  return data.map((row) =>
    mapRow(row as Record<string, unknown>, (row.profiles ?? undefined) as Record<string, unknown> | undefined),
  );
}

// Fetch a single event by ID (UUID from Supabase or string from MOCK_EVENTS)
export async function fetchEvent(id: string): Promise<FeedEvent | null> {
  // Try Supabase first (UUID format)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUUID) {
    const { data, error } = await supabase
      .from('events')
      .select(`*, profiles!host_user_id (id, username, avatar_url, member_since)`)
      .eq('id', id)
      .single();

    if (!error && data) {
      return mapRow(data as Record<string, unknown>, (data.profiles ?? undefined) as Record<string, unknown> | undefined);
    }
  }

  // Fall back to mock data (string IDs like '1', '2', ...)
  return MOCK_EVENTS.find((e) => e.id === id) ?? null;
}

// Fetch interests lookup from Supabase
export async function fetchInterestIds(names: string[]): Promise<{ name: string; id: string }[]> {
  const { data } = await supabase
    .from('interests')
    .select('id, name')
    .in('name', names);
  return (data ?? []) as { name: string; id: string }[];
}

// Save user interests
export async function saveUserInterests(userId: string, interestIds: string[]): Promise<void> {
  await supabase.from('user_interests').upsert(
    interestIds.map((interest_id) => ({ user_id: userId, interest_id })),
    { onConflict: 'user_id,interest_id' },
  );
}

// Insert a new event into Supabase
export async function createEvent(params: {
  hostUserId: string;
  title: string;
  description: string;
  emoji: string;
  categoryName: string;
  eventType: string;
  maxGroupSize: number;
  isPrivate: boolean;
  isPaid: boolean;
  priceCents: number;
  neighborhood: string;
  address: string;
  startsAt: Date;
}): Promise<string | null> {
  // Resolve category_id
  const { data: catRow } = await supabase
    .from('event_categories')
    .select('id')
    .eq('name', params.categoryName)
    .single();

  const { data, error } = await supabase
    .from('events')
    .insert({
      host_user_id: params.hostUserId,
      category_id: catRow?.id ?? null,
      title: params.title,
      description: params.description,
      emoji: params.emoji,
      event_type: params.eventType,
      max_group_size: params.maxGroupSize,
      privacy: params.isPrivate ? 'private' : 'public',
      is_paid: params.isPaid,
      price_cents: params.priceCents,
      approx_location: params.neighborhood,
      exact_address: params.address,
      starts_at: params.startsAt.toISOString(),
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('createEvent error:', error.message);
    return null;
  }
  return (data as { id: string }).id;
}

// Request to join an event
export async function requestToJoin(eventId: string, userId: string): Promise<boolean> {
  const { error } = await supabase.from('event_attendees').upsert(
    { event_id: eventId, user_id: userId, state: 'pending_approval' },
    { onConflict: 'event_id,user_id' },
  );
  return !error;
}

// Cancel join request
export async function cancelJoinRequest(eventId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('event_attendees')
    .update({ state: 'canceled', canceled_at: new Date().toISOString(), canceled_by: 'attendee' })
    .match({ event_id: eventId, user_id: userId });
  return !error;
}

// Get attendee state for a user on an event
export async function getAttendeeState(
  eventId: string,
  userId: string,
): Promise<'pending_approval' | 'confirmed' | 'canceled' | 'not_approved' | null> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
  if (!isUUID) return null;

  const { data } = await supabase
    .from('event_attendees')
    .select('state')
    .match({ event_id: eventId, user_id: userId })
    .single();

  return (data?.state as 'pending_approval' | 'confirmed' | 'canceled' | 'not_approved') ?? null;
}
