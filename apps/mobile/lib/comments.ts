import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface EventComment {
  id: string;
  event_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  };
}

// Fetch comments for an event
export async function fetchComments(eventId: string): Promise<EventComment[]> {
  const { data, error } = await supabase
    .from('event_comments')
    .select(`*, profiles (username, avatar_url, full_name)`)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return [];
  return (data ?? []) as EventComment[];
}

// Post a comment
export async function postComment(eventId: string, userId: string, body: string): Promise<EventComment | null> {
  const { data, error } = await supabase
    .from('event_comments')
    .insert({ event_id: eventId, user_id: userId, body })
    .select(`*, profiles (username, avatar_url, full_name)`)
    .single();

  if (error) return null;
  return data as EventComment;
}

// Delete a comment (own only — enforced by RLS)
export async function deleteComment(commentId: string): Promise<void> {
  await supabase.from('event_comments').delete().eq('id', commentId);
}

// Subscribe to real-time comment inserts for an event
export function subscribeToComments(
  eventId: string,
  onInsert: (comment: EventComment) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`comments:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'event_comments',
        filter: `event_id=eq.${eventId}`,
      },
      async (payload) => {
        // Enrich with profile data
        const { data } = await supabase
          .from('event_comments')
          .select(`*, profiles (username, avatar_url, full_name)`)
          .eq('id', payload.new.id)
          .single();
        if (data) onInsert(data as EventComment);
      },
    )
    .subscribe();
  return channel;
}

// Subscribe to real-time feed changes (new events published)
export function subscribeToFeed(
  onNewEvent: () => void,
): RealtimeChannel {
  return supabase
    .channel('feed:events')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'events', filter: 'status=eq.published' },
      () => onNewEvent(),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'events' },
      () => onNewEvent(),
    )
    .subscribe();
}

// Subscribe to attendee count updates for a specific event
export function subscribeToAttendees(
  eventId: string,
  onUpdate: (confirmedCount: number) => void,
): RealtimeChannel {
  return supabase
    .channel(`attendees:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_attendees',
        filter: `event_id=eq.${eventId}`,
      },
      async () => {
        const { data } = await supabase
          .from('events')
          .select('confirmed_count')
          .eq('id', eventId)
          .single();
        if (data) onUpdate((data as { confirmed_count: number }).confirmed_count);
      },
    )
    .subscribe();
}
