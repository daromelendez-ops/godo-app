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
    category: (row.category as string) ?? undefined,
    host: profile
      ? {
          name: (profile.username as string) ?? '@host',
          avatarUrl: (profile.avatar_url as string) ?? '',
          memberSince: new Date(profile.member_since as string ?? Date.now()).getFullYear().toString(),
        }
      : undefined,
  };
}

const EVENT_SELECT = `
  *,
  profiles!host_user_id (id, username, avatar_url, member_since),
  event_categories (name)
`;

function mapRowWithCategory(row: Record<string, unknown>, profile?: Record<string, unknown>): FeedEvent {
  const cat = (row.event_categories as Record<string, unknown> | null)?.name as string | undefined;
  return { ...mapRow(row, profile), category: cat };
}

// Fetch published events. Falls back to MOCK_EVENTS if DB is empty.
export async function fetchFeed(): Promise<FeedEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('status', 'published')
    .order('starts_at', { ascending: true })
    .limit(50);

  if (error || !data || data.length === 0) {
    return MOCK_EVENTS;
  }

  return data.map((row) =>
    mapRowWithCategory(row as Record<string, unknown>, (row.profiles ?? undefined) as Record<string, unknown> | undefined),
  );
}

// Fetch events near a location using the nearby_events RPC
export async function fetchNearbyEvents(lat: number, lng: number, radiusKm = 10): Promise<FeedEvent[]> {
  const { data, error } = await supabase.rpc('nearby_events', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
  });

  if (error || !data || data.length === 0) {
    return MOCK_EVENTS.filter(e => e.type === 'upcoming');
  }

  return (data as Record<string, unknown>[]).map((row) => {
    const priceCents = (row.price_cents as number) ?? 0;
    const isPaid = row.is_paid as boolean;
    const startsAt = row.starts_at ? new Date(row.starts_at as string) : null;
    let timeLabel = 'Upcoming';
    if (startsAt) {
      const diffH = (startsAt.getTime() - Date.now()) / 3_600_000;
      if (diffH < 12) timeLabel = 'Tonight';
      else if (diffH < 36) timeLabel = 'Tomorrow';
      else if (diffH < 168) timeLabel = 'This Weekend';
      else timeLabel = startsAt.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return {
      id: row.id as string,
      type: 'upcoming' as const,
      username: '@host',
      avatarUrl: '',
      mediaUrl: (row.cover_photo_url as string) ?? '',
      mediaType: ((row.cover_type as string) === 'video' ? 'video' : 'image') as 'image' | 'video',
      eventTitle: row.title as string,
      caption: '',
      timeLabel,
      neighborhood: (row.approx_location as string) ?? undefined,
      attending: (row.confirmed_count as number) ?? 0,
      capacity: (row.max_group_size as number) ?? 6,
      spotsLeft: ((row.max_group_size as number) ?? 6) - ((row.confirmed_count as number) ?? 0),
      price: isPaid ? `$${(priceCents / 100).toFixed(0)}` : 'Free',
      emoji: (row.emoji as string) ?? '✨',
      category: undefined,
    } as FeedEvent;
  });
}

// Fetch a single event by ID (UUID from Supabase or string from MOCK_EVENTS)
export async function fetchEvent(id: string): Promise<FeedEvent | null> {
  // Try Supabase first (UUID format)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUUID) {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_SELECT)
      .eq('id', id)
      .single();

    if (!error && data) {
      return mapRowWithCategory(data as Record<string, unknown>, (data.profiles ?? undefined) as Record<string, unknown> | undefined);
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
  coverPhotoUrl?: string;
  coverType?: 'image' | 'video';
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
      cover_photo_url: params.coverPhotoUrl ?? null,
      cover_type: params.coverType ?? 'image',
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

// Host: get pending join requests for an event
export async function getPendingAttendees(eventId: string): Promise<{
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  requestedAt: string;
}[]> {
  const { data } = await supabase
    .from('event_attendees')
    .select('user_id, created_at, profiles!user_id (username, avatar_url)')
    .eq('event_id', eventId)
    .eq('state', 'pending_approval')
    .order('created_at', { ascending: true });

  return (data ?? []).map((row: Record<string, unknown>) => {
    const p = row.profiles as Record<string, unknown> | null;
    return {
      userId: row.user_id as string,
      username: (p?.username as string) ?? null,
      avatarUrl: (p?.avatar_url as string) ?? null,
      requestedAt: row.created_at as string,
    };
  });
}

// Host: get confirmed attendees for an event (for rating flow)
export async function getConfirmedAttendees(eventId: string): Promise<{
  userId: string;
  username: string | null;
  avatarUrl: string | null;
}[]> {
  const { data } = await supabase
    .from('event_attendees')
    .select('user_id, profiles!user_id (username, avatar_url)')
    .eq('event_id', eventId)
    .eq('state', 'confirmed');

  return (data ?? []).map((row: Record<string, unknown>) => {
    const p = row.profiles as Record<string, unknown> | null;
    return {
      userId: row.user_id as string,
      username: (p?.username as string) ?? null,
      avatarUrl: (p?.avatar_url as string) ?? null,
    };
  });
}

// Host: approve a join request
export async function approveAttendee(eventId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('event_attendees')
    .update({ state: 'confirmed' })
    .match({ event_id: eventId, user_id: userId });
  return !error;
}

// Host: deny a join request
export async function denyAttendee(eventId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('event_attendees')
    .update({ state: 'not_approved' })
    .match({ event_id: eventId, user_id: userId });
  return !error;
}

// Toggle like on an event (returns new liked state)
export async function toggleEventLike(eventId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('liked_items')
    .select('id')
    .match({ user_id: userId, item_type: 'event', item_id: eventId })
    .maybeSingle();

  if (existing) {
    await supabase
      .from('liked_items')
      .delete()
      .match({ user_id: userId, item_type: 'event', item_id: eventId });
    return false;
  } else {
    await supabase
      .from('liked_items')
      .insert({ user_id: userId, item_type: 'event', item_id: eventId });
    return true;
  }
}

// Check if current user liked an event
export async function isEventLiked(eventId: string, userId: string): Promise<boolean> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
  if (!isUUID) return false;
  const { data } = await supabase
    .from('liked_items')
    .select('id')
    .match({ user_id: userId, item_type: 'event', item_id: eventId })
    .maybeSingle();
  return !!data;
}

// Submit a rating (host rates attendee, or attendee rates host)
export async function submitRating(
  eventId: string,
  raterUserId: string,
  ratedUserId: string,
  role: 'host' | 'attendee',
  stars: number,
): Promise<boolean> {
  const { error } = await supabase.from('ratings').upsert(
    {
      event_id: eventId,
      rater_user_id: raterUserId,
      rated_user_id: ratedUserId,
      rated_role: role,
      overall_stars: stars,
    },
    { onConflict: 'event_id,rater_user_id,rated_user_id' },
  );
  return !error;
}

// Get host profile stats (score, avg_rating, rating_count)
export async function getHostStats(userId: string): Promise<{
  score: number;
  avgRating: number;
  ratingCount: number;
  eventsHosted: number;
} | null> {
  const { data } = await supabase
    .from('profiles')
    .select('score, avg_rating, rating_count, events_hosted')
    .eq('id', userId)
    .single();

  if (!data) return null;
  const d = data as Record<string, unknown>;
  return {
    score: (d.score as number) ?? 0,
    avgRating: parseFloat((d.avg_rating as string) ?? '0'),
    ratingCount: (d.rating_count as number) ?? 0,
    eventsHosted: (d.events_hosted as number) ?? 0,
  };
}

// Toggle save/bookmark on an event (returns new saved state)
export async function toggleEventSave(eventId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('saved_items')
    .select('id')
    .match({ user_id: userId, item_type: 'event', item_id: eventId })
    .maybeSingle();

  if (existing) {
    await supabase
      .from('saved_items')
      .delete()
      .match({ user_id: userId, item_type: 'event', item_id: eventId });
    return false;
  } else {
    await supabase
      .from('saved_items')
      .insert({ user_id: userId, item_type: 'event', item_id: eventId });
    return true;
  }
}

// Check if current user saved an event
export async function isEventSaved(eventId: string, userId: string): Promise<boolean> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
  if (!isUUID) return false;
  const { data } = await supabase
    .from('saved_items')
    .select('id')
    .match({ user_id: userId, item_type: 'event', item_id: eventId })
    .maybeSingle();
  return !!data;
}

// Fetch upcoming events a user has confirmed attendance for
export async function fetchUserUpcomingEvents(userId: string): Promise<{ id: string; title: string; startsAt: string | null; emoji: string; neighborhood: string | null }[]> {
  const { data } = await supabase
    .from('event_attendees')
    .select('events!event_id (id, title, starts_at, emoji, approx_location)')
    .eq('user_id', userId)
    .eq('state', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(10);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const e = row.events as Record<string, unknown> | null;
    return {
      id: (e?.id as string) ?? '',
      title: (e?.title as string) ?? '',
      startsAt: (e?.starts_at as string) ?? null,
      emoji: (e?.emoji as string) ?? '🎉',
      neighborhood: (e?.approx_location as string) ?? null,
    };
  }).filter(e => e.id);
}

// Fetch host public profile
export async function fetchHostProfile(hostId: string): Promise<{
  id: string;
  username: string | null;
  avatarUrl: string | null;
  score: number;
  avgRating: number;
  ratingCount: number;
  eventsHosted: number;
  memberSince: string;
} | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, score, avg_rating, rating_count, events_hosted, member_since')
    .eq('id', hostId)
    .single();
  if (!data) return null;
  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    username: (d.username as string) ?? null,
    avatarUrl: (d.avatar_url as string) ?? null,
    score: (d.score as number) ?? 0,
    avgRating: parseFloat((d.avg_rating as string) ?? '0'),
    ratingCount: (d.rating_count as number) ?? 0,
    eventsHosted: (d.events_hosted as number) ?? 0,
    memberSince: new Date((d.member_since as string) ?? Date.now()).getFullYear().toString(),
  };
}

// Fetch events hosted by a user (for host dashboard)
export async function fetchHostedEvents(userId: string): Promise<{ id: string; title: string; startsAt: string | null; emoji: string }[]> {
  const { data } = await supabase
    .from('events')
    .select('id, title, starts_at, emoji')
    .eq('host_user_id', userId)
    .eq('status', 'published')
    .order('starts_at', { ascending: false })
    .limit(20);

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    title: r.title as string,
    startsAt: (r.starts_at as string) ?? null,
    emoji: (r.emoji as string) ?? '✨',
  }));
}

// Fetch events saved/bookmarked by a user
export async function fetchSavedEvents(userId: string): Promise<{ id: string; title: string; startsAt: string | null; neighborhood: string | null; category?: string }[]> {
  const { data } = await supabase
    .from('saved_items')
    .select('item_id, events!item_id (id, title, starts_at, approx_location, event_categories (name))')
    .eq('user_id', userId)
    .eq('item_type', 'event')
    .order('created_at', { ascending: false })
    .limit(20);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const e = row.events as Record<string, unknown> | null;
    const cat = (e?.event_categories as Record<string, unknown> | null)?.name as string | undefined;
    return {
      id: (e?.id as string) ?? '',
      title: (e?.title as string) ?? '',
      startsAt: (e?.starts_at as string) ?? null,
      neighborhood: (e?.approx_location as string) ?? null,
      category: cat,
    };
  }).filter(e => e.id);
}

// Update user profile (name + avatar)
export async function updateProfile(userId: string, params: {
  fullName?: string;
  avatarUrl?: string;
}): Promise<boolean> {
  const updates: Record<string, string> = {};
  if (params.fullName !== undefined) updates.username = params.fullName;
  if (params.avatarUrl !== undefined) updates.avatar_url = params.avatarUrl;
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (!error && params.fullName !== undefined) {
    await supabase.auth.updateUser({ data: { full_name: params.fullName } });
  }
  return !error;
}
