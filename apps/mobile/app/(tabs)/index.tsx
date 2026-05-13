import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FeedCard } from '../../components/feed/FeedCard';
import { type FeedEvent } from '../../constants/mockData';
import { fetchFeed } from '../../lib/events';

const FILTERS = ['All', 'Tonight', 'Tomorrow', 'This Weekend'];

export default function HomeScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<FeedEvent[]>([]);

  async function loadFeed() {
    const data = await fetchFeed();
    setEvents(data);
  }

  useEffect(() => { loadFeed(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, []);

  const filtered: FeedEvent[] =
    activeFilter === 'All'
      ? events
      : events.filter(
          (e: FeedEvent) =>
            e.type === 'upcoming' &&
            e.timeLabel?.toLowerCase().includes(activeFilter.toLowerCase()),
        );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.logo}>GoDo</Text>
        <Pressable style={styles.bellBtn} hitSlop={8}>
          <Bell size={22} color={Colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Filter pills */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map(f => (
            <Pressable
              key={f}
              style={[styles.pill, activeFilter === f && styles.pillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.pillText, activeFilter === f && styles.pillTextActive]}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Feed */}
      <FlatList
        data={filtered}
        keyExtractor={e => e.id}
        renderItem={({ item }) => (
          <FeedCard event={item as FeedEvent} onPress={() => router.push(`/event/${(item as FeedEvent).id}`)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySub}>Try a different filter or check back soon.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    backgroundColor: Colors.surface,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  pillActive: { backgroundColor: Colors.primary },
  pillText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#666666',
  },
  pillTextActive: { color: '#FFF' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { marginTop: 80, alignItems: 'center', gap: 8 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
