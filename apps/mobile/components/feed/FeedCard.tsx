import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { Heart, Bookmark, Share2, MapPin } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import type { FeedEvent } from '../../constants/mockData';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32; // 16px list padding each side

interface FeedCardProps {
  event: FeedEvent;
  onPress?: () => void;
}

export function FeedCard({ event, onPress }: FeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const isUpcoming = event.type === 'upcoming';

  return (
    <View style={styles.card}>
      {/* Header: avatar + username */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: event.avatarUrl }} style={styles.avatar} />
        </View>
        <Text style={styles.username} numberOfLines={1}>{event.username}</Text>
      </View>

      {/* Media — edge to edge, square */}
      <View style={styles.mediaWrap}>
        <Image source={{ uri: event.mediaUrl }} style={styles.media} resizeMode="cover" />
        {isUpcoming && event.price && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{event.price}</Text>
          </View>
        )}
      </View>

      {/* Interaction row — upcoming only */}
      {isUpcoming && (
        <View style={styles.interactionRow}>
          <Text style={styles.attendingText}>
            {event.attending} attending · {event.spotsLeft} spots left
          </Text>
          <View style={styles.icons}>
            <Pressable onPress={() => setLiked(v => !v)} hitSlop={10}>
              <Heart
                size={20}
                color={liked ? '#FF3B30' : Colors.textPrimary}
                fill={liked ? '#FF3B30' : 'none'}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable onPress={() => setSaved(v => !v)} hitSlop={10}>
              <Bookmark
                size={20}
                color={saved ? Colors.primary : Colors.textPrimary}
                fill={saved ? Colors.primary : 'none'}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable hitSlop={10}>
              <Share2 size={20} color={Colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {isUpcoming && (
          <View style={styles.timePill}>
            <Text style={styles.timePillText}>{event.timeLabel}</Text>
          </View>
        )}

        <Text style={styles.title}>{event.eventTitle}</Text>

        {isUpcoming && event.neighborhood && (
          <View style={styles.locationRow}>
            <MapPin size={13} color={Colors.textSecondary} fill={Colors.textSecondary} strokeWidth={0} />
            <Text style={styles.neighborhood}>{event.neighborhood}</Text>
          </View>
        )}

        {!isUpcoming && (
          <Text style={styles.caption} numberOfLines={3}>{event.caption}</Text>
        )}

        {isUpcoming ? (
          <Pressable style={styles.ctaBtn} onPress={onPress}>
            <Text style={styles.ctaText}>Check it Out</Text>
          </Pressable>
        ) : (
          <View style={styles.recapIcons}>
            <Pressable onPress={() => setLiked(v => !v)} hitSlop={10}>
              <Heart
                size={22}
                color={liked ? '#FF3B30' : Colors.textPrimary}
                fill={liked ? '#FF3B30' : 'none'}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable onPress={() => setSaved(v => !v)} hitSlop={10}>
              <Bookmark
                size={22}
                color={saved ? Colors.primary : Colors.textPrimary}
                fill={saved ? Colors.primary : 'none'}
                strokeWidth={2}
              />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  avatar: { width: 44, height: 44 },
  username: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    flex: 1,
  },
  mediaWrap: {
    width: CARD_W,
    height: CARD_W,
    marginTop: 14,
    position: 'relative',
  },
  media: { width: '100%', height: '100%' },
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  priceText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  attendingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    opacity: 0.7,
  },
  icons: { flexDirection: 'row', gap: 16 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 8,
  },
  timePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  timePillText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    opacity: 0.7,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  neighborhood: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  ctaBtn: {
    width: '100%',
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
  recapIcons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
});
