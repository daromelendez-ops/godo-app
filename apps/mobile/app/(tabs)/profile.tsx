import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Star,
  CalendarCheck,
  Users,
  Bookmark,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';
import { router } from 'expo-router';
import { getHostStats, fetchUserUpcomingEvents, fetchSavedEvents } from '../../lib/events';

function Avatar({ name, uri }: { name: string; uri?: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />;
  }
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function StatBox({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.statBox}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsRow, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.rowIconWrap}>{icon}</View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {!danger && (
        <ChevronRight size={16} color={Colors.textLight} strokeWidth={2} style={styles.chevron} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [hostStats, setHostStats] = useState<{
    score: number; avgRating: number; ratingCount: number; eventsHosted: number;
  } | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Awaited<ReturnType<typeof fetchUserUpcomingEvents>>>([]);
  const [savedEvents, setSavedEvents] = useState<Awaited<ReturnType<typeof fetchSavedEvents>>>([]);

  const name = user?.user_metadata?.full_name ?? 'GoDo User';
  const email = user?.email ?? '';
  const memberYear = new Date(user?.created_at ?? Date.now()).getFullYear();

  useEffect(() => {
    if (user) {
      getHostStats(user.id).then(setHostStats);
      fetchUserUpcomingEvents(user.id).then(setUpcomingEvents);
      fetchSavedEvents(user.id).then(setSavedEvents);
    }
  }, [user]);

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable style={styles.headerBtn}>
          <Settings size={22} color={Colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + identity */}
        <View style={styles.identityCard}>
          <Avatar name={name} uri={user?.user_metadata?.avatar_url as string | undefined} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.memberSince}>Member since {memberYear}</Text>
          <Pressable style={styles.editBtn} onPress={() => router.push('/profile/edit')}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox
            value={hostStats ? String(hostStats.eventsHosted) : '—'}
            label="Hosted"
            icon={<Users size={18} color={Colors.primary} strokeWidth={2} />}
          />
          <View style={styles.statDivider} />
          <StatBox
            value={hostStats && hostStats.avgRating > 0 ? hostStats.avgRating.toFixed(1) : '—'}
            label="Rating"
            icon={<Star size={18} color={Colors.primary} strokeWidth={2} />}
          />
          <View style={styles.statDivider} />
          <StatBox
            value={hostStats ? String(hostStats.score) : '—'}
            label="Score"
            icon={<CalendarCheck size={18} color={Colors.primary} strokeWidth={2} />}
          />
        </View>

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Upcoming Events</Text>
            {upcomingEvents.map((ev) => (
              <Pressable
                key={ev.id}
                style={({ pressed }) => [styles.eventRow, pressed && styles.rowPressed]}
                onPress={() => router.push(`/event/${ev.id}`)}
              >
                <View style={styles.eventEmojiBubble}>
                  <Text style={styles.eventEmojiText}>{ev.emoji}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{ev.title}</Text>
                  <Text style={styles.eventMeta}>
                    {ev.neighborhood ?? ''}
                    {ev.startsAt ? ` · ${new Date(ev.startsAt).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}` : ''}
                  </Text>
                </View>
                <ChevronRight size={16} color={Colors.textLight} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Saved events */}
        {savedEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Events</Text>
            {savedEvents.map((ev) => (
              <Pressable
                key={ev.id}
                style={({ pressed }) => [styles.eventRow, pressed && styles.rowPressed]}
                onPress={() => router.push(`/event/${ev.id}`)}
              >
                <View style={[styles.eventEmojiBubble, { backgroundColor: '#EFF6FF' }]}>
                  <Bookmark size={18} color="#3882F6" strokeWidth={2} fill="#3882F6" />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{ev.title}</Text>
                  <Text style={styles.eventMeta}>
                    {ev.neighborhood ?? ''}
                    {ev.startsAt ? ` · ${new Date(ev.startsAt).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}` : ''}
                  </Text>
                </View>
                <ChevronRight size={16} color={Colors.textLight} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsRow
            icon={<Bell size={18} color={Colors.textSecondary} strokeWidth={2} />}
            label="Notifications"
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<Shield size={18} color={Colors.textSecondary} strokeWidth={2} />}
            label="Privacy & Safety"
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<HelpCircle size={18} color={Colors.textSecondary} strokeWidth={2} />}
            label="Help & Support"
          />
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon={<LogOut size={18} color={Colors.danger} strokeWidth={2} />}
            label="Sign out"
            onPress={handleSignOut}
            danger
          />
        </View>

        <Text style={styles.version}>GoDo v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  headerBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 12,
  },
  identityCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
    marginBottom: 20,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 9,
  },
  editBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  eventEmojiBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventEmojiText: { fontSize: 20 },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  eventMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowIconWrap: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  rowLabelDanger: {
    color: Colors.danger,
  },
  chevron: {
    marginLeft: 'auto',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
    paddingTop: 8,
  },
});
