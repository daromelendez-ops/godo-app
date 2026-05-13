import { supabase } from './supabase';
import { uploadMedia } from './storage';

export interface EventPhoto {
  id: string;
  event_id: string;
  user_id: string;
  storage_path: string;
  public_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: { username: string | null; avatar_url: string | null };
}

// Upload a photo for an event and record it in event_photos
export async function uploadEventPhoto(
  asset: import('expo-image-picker').ImagePickerAsset,
  eventId: string,
  userId: string,
  caption?: string,
): Promise<EventPhoto | null> {
  const result = await uploadMedia(asset, 'event-photos', eventId);
  if (!result) return null;

  const { data, error } = await supabase
    .from('event_photos')
    .insert({
      event_id: eventId,
      user_id: userId,
      storage_path: result.path,
      public_url: result.publicUrl,
      media_type: asset.type === 'video' ? 'video' : 'image',
      caption: caption ?? null,
      status: 'approved',
    })
    .select('*, profiles (username, avatar_url)')
    .single();

  if (error) {
    console.error('uploadEventPhoto error:', error.message);
    return null;
  }
  return data as EventPhoto;
}

// Fetch approved photos for an event
export async function getEventPhotos(eventId: string, onlyApproved = true): Promise<EventPhoto[]> {
  let query = supabase
    .from('event_photos')
    .select('*, profiles (username, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (onlyApproved) query = query.eq('status', 'approved');

  const { data } = await query;
  return (data ?? []) as EventPhoto[];
}

// Host: get photos pending approval
export async function getPendingPhotos(eventId: string): Promise<EventPhoto[]> {
  const { data } = await supabase
    .from('event_photos')
    .select('*, profiles (username, avatar_url)')
    .eq('event_id', eventId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return (data ?? []) as EventPhoto[];
}

// Host: approve a photo
export async function approveEventPhoto(photoId: string): Promise<boolean> {
  const { error } = await supabase
    .from('event_photos')
    .update({ status: 'approved' })
    .eq('id', photoId);
  return !error;
}

// Host: reject a photo
export async function rejectEventPhoto(photoId: string): Promise<boolean> {
  const { error } = await supabase
    .from('event_photos')
    .update({ status: 'rejected' })
    .eq('id', photoId);
  return !error;
}
