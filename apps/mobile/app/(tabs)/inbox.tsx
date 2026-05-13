import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X, Star } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';
import {
  fetchHostedEvents,
  getPendingAttendees,
  getConfirmedAttendees,
  approveAttendee,
  denyAttendee,
  submitRating,
} from '../../lib/events';
import { getPendingPhotos, approveEventPhoto, rejectEventPhoto } from '../../lib/photos';
import type { EventPhoto } from '../../lib/photos';

type Tab = 'requests' | 'photos' | 'rate';

interface PendingAttendee {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  requestedAt: string;
  eventId: string;
  eventTitle: string;
}

interface ConfirmedAttendee {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  eventId: string;
  eventTitle: string;
  rated: boolean;
  stars: number;
}

interface PendingPhoto extends EventPhoto {
  eventTitle: string;
}

function AvatarBubble({ url, name }: { url: string | null; name: string | null }) {
  const initials = (name ?? 'U')[0].toUpperCase();
  if (url) {
    return <Image source={{ uri: url }} style={s.avatar} />;
  }
  return (
    <View style={[s.avatar, s.avatarFallback]}>
      <Text style={s.avatarText}>{initials}</Text>
    </View>
  );
}

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Star
            size={24}
            color={n <= value ? '#F59E0B' : Colors.border}
            fill={n <= value ? '#F59E0B' : 'transparent'}
            strokeWidth={1.5}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function InboxScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pendingAttendees, setPendingAttendees] = useState<PendingAttendee[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [confirmedAttendees, setConfirmedAttendees] = useState<ConfirmedAttendee[]>([]);

  const [submitting, setSubmitting] = useState<Set<string>>(new Set());

  async function loadData() {
    if (!user) return;
    const events = await fetchHostedEvents(user.id);

    const [reqs, photos, confirmed] = await Promise.all([
      Promise.all(events.map(e => getPendingAttendees(e.id).then(atts =>
        atts.map(a => ({ ...a, eventId: e.id, eventTitle: e.title }))
      ))).then(arr => arr.flat()),
      Promise.all(events.map(e => getPendingPhotos(e.id).then(ps =>
        ps.map(p => ({ ...p, eventTitle: e.title }))
      ))).then(arr => arr.flat()),
      Promise.all(events.map(e => getConfirmedAttendees(e.id).then(atts =>
        atts.map(a => ({ ...a, eventId: e.id, eventTitle: e.title, rated: false, stars: 0 }))
      ))).then(arr => arr.flat()),
    ]);

    setPendingAttendees(reqs);
    setPendingPhotos(photos);
    setConfirmedAttendees(confirmed);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  async function handleApprove(eventId: string, userId: string) {
    const key = `${eventId}-${userId}`;
    setSubmitting(prev => new Set(prev).add(key));
    await approveAttendee(eventId, userId);
    setPendingAttendees(prev => prev.filter(a => !(a.eventId === eventId && a.userId === userId)));
    setSubmitting(prev => { const s = new Set(prev); s.delete(key); return s; });
  }

  async function handleDeny(eventId: string, userId: string) {
    const key = `${eventId}-${userId}-deny`;
    setSubmitting(prev => new Set(prev).add(key));
    await denyAttendee(eventId, userId);
    setPendingAttendees(prev => prev.filter(a => !(a.eventId === eventId && a.userId === userId)));
    setSubmitting(prev => { const s = new Set(prev); s.delete(key); return s; });
  }

  async function handleApprovePhoto(photoId: string) {
    setSubmitting(prev => new Set(prev).add(photoId));
    await approveEventPhoto(photoId);
    setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
    setSubmitting(prev => { const s = new Set(prev); s.delete(photoId); return s; });
  }

  async function handleRejectPhoto(photoId: string) {
    const key = `${photoId}-reject`;
    setSubmitting(prev => new Set(prev).add(key));
    await rejectEventPhoto(photoId);
    setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
    setSubmitting(prev => { const s = new Set(prev); s.delete(key); return s; });
  }

  function updateStars(userId: string, eventId: string, stars: number) {
    setConfirmedAttendees(prev =>
      prev.map(a => a.userId === userId && a.eventId === eventId ? { ...a, stars } : a)
    );
  }

  async function handleSubmitRating(a: ConfirmedAttendee) {
    if (!user || a.stars === 0) return;
    const key = `rate-${a.userId}-${a.eventId}`;
    setSubmitting(prev => new Set(prev).add(key));
    await submitRating(a.eventId, user.id, a.userId, 'attendee', a.stars);
    setConfirmedAttendees(prev =>
      prev.map(x => x.userId === a.userId && x.eventId === a.eventId ? { ...x, rated: true } : x)
    );
    setSubmitting(prev => { const s = new Set(prev); s.delete(key); return s; });
  }

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'requests', label: 'Requests', count: pendingAttendees.length },
    { id: 'photos', label: 'Photos', count: pendingPhotos.length },
    { id: 'rate', label: 'Rate', count: confirmedAttendees.filter(a => !a.rated).length },
  ];

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}><Text style={s.headerTitle}>Manage</Text></View>
        <View style={s.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Manage</Text>
        <Text style={s.headerSub}>Host dashboard</Text>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map(tab => (
          <Pressable
            key={tab.id}
            style={[s.tab, activeTab === tab.id && s.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={s.tabBadge}>
                <Text style={s.tabBadgeText}>{tab.count}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Requests tab */}
        {activeTab === 'requests' && (
          <>
            {pendingAttendees.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>✅</Text>
                <Text style={s.emptyTitle}>All clear!</Text>
                <Text style={s.emptySub}>No pending join requests right now.</Text>
              </View>
            ) : (
              pendingAttendees.map(a => {
                const isApproving = submitting.has(`${a.eventId}-${a.userId}`);
                const isDenying = submitting.has(`${a.eventId}-${a.userId}-deny`);
                return (
                  <View key={`${a.eventId}-${a.userId}`} style={s.card}>
                    <AvatarBubble url={a.avatarUrl} name={a.username} />
                    <View style={s.cardBody}>
                      <Text style={s.cardName}>{a.username ?? 'User'}</Text>
                      <Text style={s.cardSub} numberOfLines={1}>{a.eventTitle}</Text>
                    </View>
                    <View style={s.cardActions}>
                      <Pressable
                        style={[s.actionBtn, s.denyBtn]}
                        onPress={() => handleDeny(a.eventId, a.userId)}
                        disabled={isDenying || isApproving}
                      >
                        {isDenying
                          ? <ActivityIndicator size="small" color={Colors.danger} />
                          : <X size={18} color={Colors.danger} strokeWidth={2.5} />
                        }
                      </Pressable>
                      <Pressable
                        style={[s.actionBtn, s.approveBtn]}
                        onPress={() => handleApprove(a.eventId, a.userId)}
                        disabled={isApproving || isDenying}
                      >
                        {isApproving
                          ? <ActivityIndicator size="small" color="#FFF" />
                          : <Check size={18} color="#FFF" strokeWidth={2.5} />
                        }
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Photos tab */}
        {activeTab === 'photos' && (
          <>
            {pendingPhotos.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>📷</Text>
                <Text style={s.emptyTitle}>No pending photos</Text>
                <Text style={s.emptySub}>All photos have been reviewed.</Text>
              </View>
            ) : (
              pendingPhotos.map(p => {
                const isApproving = submitting.has(p.id);
                const isRejecting = submitting.has(`${p.id}-reject`);
                return (
                  <View key={p.id} style={s.photoCard}>
                    <Image source={{ uri: p.public_url }} style={s.photoThumb} resizeMode="cover" />
                    <View style={s.photoMeta}>
                      <Text style={s.cardName} numberOfLines={1}>{p.profiles?.username ?? 'User'}</Text>
                      <Text style={s.cardSub} numberOfLines={1}>{p.eventTitle}</Text>
                      <View style={s.cardActions}>
                        <Pressable
                          style={[s.actionBtn, s.denyBtn]}
                          onPress={() => handleRejectPhoto(p.id)}
                          disabled={isRejecting || isApproving}
                        >
                          {isRejecting
                            ? <ActivityIndicator size="small" color={Colors.danger} />
                            : <X size={16} color={Colors.danger} strokeWidth={2.5} />
                          }
                        </Pressable>
                        <Pressable
                          style={[s.actionBtn, s.approveBtn]}
                          onPress={() => handleApprovePhoto(p.id)}
                          disabled={isApproving || isRejecting}
                        >
                          {isApproving
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Check size={16} color="#FFF" strokeWidth={2.5} />
                          }
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Rate tab */}
        {activeTab === 'rate' && (
          <>
            {confirmedAttendees.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>⭐</Text>
                <Text style={s.emptyTitle}>No attendees to rate</Text>
                <Text style={s.emptySub}>Attendees will appear here after your events.</Text>
              </View>
            ) : (
              confirmedAttendees.map(a => {
                const isSubmitting = submitting.has(`rate-${a.userId}-${a.eventId}`);
                return (
                  <View key={`${a.eventId}-${a.userId}`} style={s.rateCard}>
                    <View style={s.rateHeader}>
                      <AvatarBubble url={a.avatarUrl} name={a.username} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardName}>{a.username ?? 'User'}</Text>
                        <Text style={s.cardSub} numberOfLines={1}>{a.eventTitle}</Text>
                      </View>
                      {a.rated && (
                        <View style={s.ratedBadge}>
                          <Text style={s.ratedText}>Rated</Text>
                        </View>
                      )}
                    </View>
                    {!a.rated && (
                      <>
                        <StarRow value={a.stars} onChange={stars => updateStars(a.userId, a.eventId, stars)} />
                        <Pressable
                          style={[s.submitRateBtn, (a.stars === 0 || isSubmitting) && s.submitRateBtnDisabled]}
                          onPress={() => handleSubmitRating(a)}
                          disabled={a.stars === 0 || isSubmitting}
                        >
                          {isSubmitting
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Text style={s.submitRateBtnText}>Submit Rating</Text>
                          }
                        </Pressable>
                      </>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  tabBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 40 },
  empty: { marginTop: 60, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 44, marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  cardSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: { backgroundColor: Colors.primary },
  denyBtn: { backgroundColor: '#FEE2E2' },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: {
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.primary },
  photoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  photoMeta: { flex: 1, gap: 4 },
  rateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rateHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  starRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  ratedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
  },
  ratedText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#166534' },
  submitRateBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitRateBtnDisabled: { opacity: 0.4 },
  submitRateBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
});
