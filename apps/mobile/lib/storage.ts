import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type UploadBucket = 'event-covers' | 'event-photos' | 'avatars';

async function requestMediaPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

// Pick an image or video from the library
export async function pickMedia(options?: {
  allowsVideo?: boolean;
  aspect?: [number, number];
}): Promise<ImagePicker.ImagePickerAsset | null> {
  const granted = await requestMediaPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: options?.allowsVideo
      ? ImagePicker.MediaTypeOptions.All
      : ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: options?.aspect ?? [1, 1],
    quality: 0.85,
    videoMaxDuration: 30,
  });

  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0];
}

// Take a photo with the camera
export async function takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0];
}

// Upload a local file URI to Supabase Storage and return the public URL
export async function uploadMedia(
  asset: ImagePicker.ImagePickerAsset,
  bucket: UploadBucket,
  folder: string,
): Promise<{ path: string; publicUrl: string } | null> {
  const ext = asset.uri.split('.').pop() ?? (asset.type === 'video' ? 'mp4' : 'jpg');
  const mimeType = asset.type === 'video' ? `video/${ext}` : `image/${ext}`;
  const fileName = `${folder}/${Date.now()}.${ext}`;

  // Fetch the file as a blob
  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, { contentType: mimeType, upsert: false });

  if (error) {
    console.error('uploadMedia error:', error.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { path: data.path, publicUrl: urlData.publicUrl };
}

// Delete a file from storage
export async function deleteMedia(bucket: UploadBucket, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}
