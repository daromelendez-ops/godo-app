import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, ImagePlus } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';
import { updateProfile } from '../../lib/events';
import { pickMedia, takePhoto, uploadMedia } from '../../lib/storage';

export default function EditProfileScreen() {
  const { user } = useAuthStore();

  const initialName = user?.user_metadata?.full_name ?? '';
  const initialAvatar = user?.user_metadata?.avatar_url as string | undefined;

  const [name, setName] = useState(initialName);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(initialAvatar);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pickFromLibrary() {
    const asset = await pickMedia({ allowsVideo: false, aspect: [1, 1] });
    if (asset) {
      setAvatarUri(asset.uri);
      setAvatarChanged(true);
    }
  }

  async function pickFromCamera() {
    const asset = await takePhoto();
    if (asset) {
      setAvatarUri(asset.uri);
      setAvatarChanged(true);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    let avatarUrl: string | undefined;
    if (avatarChanged && avatarUri) {
      const asset = { uri: avatarUri, type: 'image' } as import('expo-image-picker').ImagePickerAsset;
      const uploaded = await uploadMedia(asset, 'avatars', user.id);
      avatarUrl = uploaded?.publicUrl;
    }

    const ok = await updateProfile(user.id, {
      fullName: name.trim() || undefined,
      avatarUrl,
    });

    setSaving(false);
    if (ok) {
      router.back();
    } else {
      Alert.alert('Error', 'Could not save changes. Try again.');
    }
  }

  const initials = (name || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Avatar picker */}
          <View style={s.avatarSection}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={s.avatarActions}>
              <Pressable style={s.avatarBtn} onPress={pickFromLibrary}>
                <ImagePlus size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={s.avatarBtnText}>Choose photo</Text>
              </Pressable>
              <Pressable style={s.avatarBtn} onPress={pickFromCamera}>
                <Camera size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={s.avatarBtnText}>Take photo</Text>
              </Pressable>
            </View>
          </View>

          {/* Name field */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Display name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.textLight}
              maxLength={40}
              returnKeyType="done"
            />
          </View>

          {/* Email (read-only) */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Email</Text>
            <View style={[s.input, s.inputReadOnly]}>
              <Text style={s.readOnlyText}>{user?.email}</Text>
            </View>
          </View>

          {/* Save button */}
          <Pressable
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.saveBtnText}>Save Changes</Text>
            )}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  content: { padding: 24, gap: 20, paddingBottom: 48 },
  avatarSection: {
    alignItems: 'center',
    gap: 16,
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.border,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
  },
  avatarBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    height: 50,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  inputReadOnly: {
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  readOnlyText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
  },
  saveBtn: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
});
