import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Search, Navigation, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { MOCK_EVENTS, MAP_THUMBNAIL, type FeedEvent } from '../../constants/mockData';

const { width: W } = Dimensions.get('window');

const NEARBY = MOCK_EVENTS.filter((e) => e.type === 'upcoming');

const CATEGORIES = [
  { label: 'All', emoji: '✨' },
  { label: 'Social', emoji: '🍷' },
  { label: 'Outdoors', emoji: '🏞️' },
  { label: 'Arts', emoji: '🎨' },
  { label: 'Food', emoji: '🍝' },
  { label: 'Games', emoji: '🎲' },
];

const DISTANCES: Record<string, string> = {
  '1': '0.4 km',
  '3': '0.9 km',
  '5': '1.2 km',
  '6': '1.8 km',
  '8': '2.1 km',
  '10': '2.6 km',
};

const PIN_POSITIONS = [
  { id: '1', top: '38%', left: '52%' },
  { id: '3', top: '55%', left: '25%' },
  { id: '5', top: '25%', left: '38%' },
  { id: '6', top: '62%', left: '65%' },
  { id: '8', top: '48%', left: '75%' },
];

function MapPin_({ event, onPress }: { event: FeedEvent; onPress: () => void }) {
  return (
    <Pressable
      style={styles.pinContainer}
      onPress={onPress}
      hitSlop={8}
    >
      <View style={styles.pinBubble}>
        <Text style={styles.pinEmoji}>{event.emoji}</Text>
        <Text style={styles.pinPrice}>{event.price ?? 'Free'}</Text>
      </View>
      <View style={styles.pinTail} />
    </Pressable>
  );
}

function NearbyCard({
  event,
  onPress,
}: {
  event: FeedEvent;
  onPress: () => void;
}) {
  const dist = DISTANCES[event.id] ?? '1.0 km';
  return (
    <Pressable
      style={({ pressed }) => [styles.nearbyCard, pressed && { opacity: 0.8 }]}
      onPress={onPress}
    >
      <Image
        source={{ uri: event.mediaUrl }}
        style={styles.nearbyThumb}
      />
      <View style={styles.nearbyInfo}>
        <Text style={styles.nearbyTitle} numberOfLines={1}>
          {event.eventTitle}
        </Text>
        <View style={styles.nearbyMeta}>
          <MapPin size={11} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.nearbyMetaText}>{event.neighborhood ?? 'Toronto'}</Text>
          <Text style={styles.nearbyDot}>·</Text>
          <Text style={styles.nearbyMetaText}>{dist}</Text>
        </View>
        <View style={styles.nearbyBottom}>
          <Text style={styles.nearbyTime}>{event.timeLabel}</Text>
          <View
            style={[
              styles.nearbyPrice,
              event.price && event.price !== 'Free' && styles.nearbyPricePaid,
            ]}
          >
            <Text
              style={[
                styles.nearbyPriceText,
                event.price && event.price !== 'Free' && styles.nearbyPriceTextPaid,
              ]}
            >
              {event.price ?? 'Free'}
            </Text>
          </View>
        </View>
      </View>
      <ChevronRight size={16} color={Colors.textLight} strokeWidth={2} />
    </Pressable>
  );
}

export default function MapScreen() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePin, setActivePin] = useState<string | null>(null);

  const filtered =
    activeCategory === 'All'
      ? NEARBY
      : NEARBY.filter((e) => e.category === activeCategory || e.category?.includes(activeCategory));

  function handlePin(id: string) {
    setActivePin(id);
    router.push(`/event/${id}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby</Text>
        <View style={styles.locationRow}>
          <Navigation size={14} color={Colors.primary} strokeWidth={2.5} />
          <Text style={styles.locationText}>Downtown, Toronto</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search bar */}
        <Pressable style={styles.searchBar}>
          <Search size={16} color={Colors.textLight} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Search events near you...</Text>
        </Pressable>

        {/* Map view */}
        <View style={styles.mapContainer}>
          <Image
            source={{ uri: MAP_THUMBNAIL }}
            style={styles.mapImage}
            resizeMode="cover"
          />
          {/* Blue location dot */}
          <View style={styles.youDot}>
            <View style={styles.youDotInner} />
          </View>
          {/* Event pins */}
          {PIN_POSITIONS.map((pin) => {
            const event = MOCK_EVENTS.find((e) => e.id === pin.id);
            if (!event) return null;
            return (
              <View
                key={pin.id}
                style={[styles.pinAbs, { top: pin.top, left: pin.left }]}
              >
                <MapPin_ event={event} onPress={() => handlePin(pin.id)} />
              </View>
            );
          })}
          {/* Radius circle overlay */}
          <View style={styles.radiusCircle} pointerEvents="none" />
        </View>

        {/* Category filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.label}
              style={[styles.catPill, activeCategory === c.label && styles.catPillActive]}
              onPress={() => setActiveCategory(c.label)}
            >
              <Text style={styles.catEmoji}>{c.emoji}</Text>
              <Text
                style={[
                  styles.catText,
                  activeCategory === c.label && styles.catTextActive,
                ]}
              >
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Nearby list */}
        <View style={styles.listSection}>
          <Text style={styles.listHeader}>
            {filtered.length} event{filtered.length !== 1 ? 's' : ''} near you
          </Text>
          {filtered.map((event) => (
            <NearbyCard
              key={event.id}
              event={event}
              onPress={() => router.push(`/event/${event.id}`)}
            />
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
  },
  mapContainer: {
    marginHorizontal: 16,
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  youDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(56,130,246,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  youDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  radiusCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 160,
    height: 160,
    marginTop: -80,
    marginLeft: -80,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(56,130,246,0.25)',
    backgroundColor: 'rgba(56,130,246,0.04)',
  },
  pinAbs: {
    position: 'absolute',
    zIndex: 20,
  },
  pinContainer: {
    alignItems: 'center',
  },
  pinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  pinEmoji: {
    fontSize: 12,
  },
  pinPrice: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginTop: -1,
  },
  catScroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catEmoji: {
    fontSize: 13,
  },
  catText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  listSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  listHeader: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  nearbyThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  nearbyInfo: {
    flex: 1,
    gap: 4,
  },
  nearbyTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  nearbyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  nearbyMetaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
  },
  nearbyDot: {
    fontSize: 12,
    color: Colors.textLight,
    marginHorizontal: 1,
  },
  nearbyBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nearbyTime: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  nearbyPrice: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nearbyPricePaid: {
    backgroundColor: Colors.primaryLight,
  },
  nearbyPriceText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#16A34A',
  },
  nearbyPriceTextPaid: {
    color: Colors.primary,
  },
});
