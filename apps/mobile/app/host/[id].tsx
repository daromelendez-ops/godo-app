import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Calendar, Users, Award } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { fetchHostProfile, fetchHostedEvents } from '../../lib/events';

const { width: W } = Dimensions.get('window');

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={s.starDisplay}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={16}
          color="#F59E0B"
          fill={n <= full ? '#F59E0B' : (n === full + 1 && half ? '#F59E0B' : 'transparent')}
          strokeWidth={1.5}
        />
      ))}
      <Text style={s.ratingText}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
      {count > 0 && <Text style={s.ratingCount}>({count} reviews)</Text>}
    </View>
  );
}

export default function HostProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [host, setHost] = useState<Awaited<ReturnType<typeof fetchHostProfile>>>(null);
  const [events, setEvents] = useState<Awaited<ReturnType<typeof fetchHostedEvents>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchHostProfile(id), fetchHostedEvents(id)]).then(([h, ev]) => {
      setHost(h);
      setEvents(ev);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <View style={s.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!host) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <View style={s.center}><Text style={s.notFound}>Host not found.</Text></View>
      </SafeAreaView>
    );
  }

  const initials = (host.username ?? 'H')[0].toUpperCase();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.topBar}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.topTitle}>Host Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Identity card */}
        <View style={s.identityCard}>
          {host.avatarUrl ? (
            <Image source={{ uri: host.avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>{initials}</Text>
            </View>
          )}
          <Text style={s.name}>{host.username ?? 'GoDo Host'}</Text>
          <Text style={s.since}>Member since {host.memberSince}</Text>
          <StarDisplay rating={host.avgRating} count={host.ratingCount} />
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <View style={s.statIcon}>
              <Calendar size={18} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={s.statValue}>{host.eventsHosted}</Text>
            <Text style={s.statLabel}>Events Hosted</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <View style={s.statIcon}>
              <Star size={18} color="#F59E0B" strokeWidth={2} />
            </View>
            <Text style={s.statValue}>{host.avgRating > 0 ? host.avgRating.toFixed(1) : '—'}</Text>
            <Text style={s.statLabel}>Avg Rating</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <View style={s.statIcon}>
              <Award size={18} color="#8B5CF6" strokeWidth={2} />
            </View>
            <Text style={s.statValue}>{host.score}</Text>
            <Text style={s.statLabel}>Score</Text>
          </View>
        </View>

        {/* Score bar */}
        {host.score > 0 && (
          <View style={s.scoreCard}>
            <Text style={s.scoreTitle}>Host Score</Text>
            <View style={s.scoreBarBg}>
              <View style={[s.scoreBarFill, { width: `${Math.min(100, host.score)}%` }]} />
            </View>
            <Text style={s.scoreCaption}>
              Score is earned from event ratings and likes
            </Text>
          </View>
        )}

        {/* Events */}
        {events.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Their Events</Text>
            {events.map(ev => (
              <Pressable
                key={ev.id}
                style={({ pressed }) => [s.eventRow, pressed && { opacity: 0.7 }]}
                onPress={() => router.push(`/event/${ev.id}`)}
              >
                <View style={s.eventEmoji}>
                  <Text style={s.eventEmojiText}>{ev.emoji}</Text>
                </View>
                <View style={s.eventInfo}>
                  <Text style={s.eventTitle} numberOfLines={1}>{ev.title}</Text>
                  {ev.startsAt && (
                    <Text style={s.eventMeta}>
                      {new Date(ev.startsAt).toLocaleDateString('en-CA', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
                <ArrowLeft size={16} color={Colors.textLight} strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
              </Pressable>
            ))}
          </View>
        )}

        {events.length === 0 && (
          <View style={s.noEvents}>
            <Users size={32} color={Colors.border} strokeWidth={1.5} />
            <Text style={s.noEventsText}>No public events yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40, gap: 12 },
  identityCard: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    gap: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 8,
    backgroundColor: Colors.border,
  },
  avatarFallback: {
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 32, fontFamily: 'Inter_700Bold', color: Colors.primary },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  since: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textLight },
  starDisplay: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginLeft: 4 },
  ratingCount: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textLight },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 6 },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 8 },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center' },
  scoreCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 0,
    padding: 20,
    gap: 10,
  },
  scoreTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  scoreBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  scoreCaption: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textLight },
  section: { backgroundColor: Colors.surface, paddingTop: 4 },
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
  eventEmoji: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventEmojiText: { fontSize: 20 },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  eventMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  noEvents: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  noEventsText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
});
