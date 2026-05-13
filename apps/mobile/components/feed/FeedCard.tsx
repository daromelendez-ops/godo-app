import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Heart, Bookmark, Share2, MapPin, Clock, Users } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { CategoryIcon } from '../ui/CategoryIcon';
import type { FeedEvent } from '../../constants/mockData';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;

interface FeedCardProps {
  event: FeedEvent;
  onPress?: () => void;
  liked?: boolean;
  saved?: boolean;
  onLike?: () => void;
  onSave?: () => void;
}

export function FeedCard({ event, onPress, liked = false, saved = false, onLike, onSave }: FeedCardProps) {
  const isUpcoming = event.type === 'upcoming';
  const isPaid = event.price && event.price !== 'Free';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.97 }]}>
      {/* Host row */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: event.avatarUrl }} style={styles.avatar} />
          <View style={styles.categoryBadge}>
            <CategoryIcon category={event.category} size="sm" />
          </View>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.username} numberOfLines={1}>{event.username}</Text>
          {isUpcoming && event.timeLabel && (
            <View style={styles.timeRow}>
              <Clock size={11} color={Colors.textLight} strokeWidth={2} />
              <Text style={styles.timeText}>{event.timeLabel}</Text>
            </View>
          )}
          {!isUpcoming && (
            <Text style={styles.recapLabel}>Past event</Text>
          )}
        </View>
        {isPaid && (
          <View style={styles.priceBadgeFull}>
            <Text style={styles.priceBadgeText}>{event.price}</Text>
          </View>
        )}
        {!isPaid && isUpcoming && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>Free</Text>
          </View>
        )}
      </View>

      {/* Media — square, edge to edge */}
      <View style={styles.mediaWrap}>
        {event.mediaType === 'video' ? (
          <Video
            source={{ uri: event.mediaUrl }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted
            shouldPlay
          />
        ) : (
          <Image source={{ uri: event.mediaUrl }} style={styles.media} resizeMode="cover" />
        )}
        {/* Gradient overlay at bottom */}
        <View style={styles.mediaGradient} pointerEvents="none" />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{event.eventTitle}</Text>

        {isUpcoming && (
          <View style={styles.metaRow}>
            {event.neighborhood && (
              <View style={styles.metaItem}>
                <MapPin size={12} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.metaText} numberOfLines={1}>{event.neighborhood}</Text>
              </View>
            )}
            {(event.attending !== undefined) && (
              <View style={styles.metaItem}>
                <Users size={12} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.metaText}>{event.attending} going</Text>
                {event.spotsLeft !== undefined && event.spotsLeft <= 3 && (
                  <Text style={styles.urgentText}> · {event.spotsLeft} left!</Text>
                )}
              </View>
            )}
          </View>
        )}

        {!isUpcoming && (
          <Text style={styles.caption} numberOfLines={2}>{event.caption}</Text>
        )}

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          {isUpcoming ? (
            <View style={styles.ctaWrap}>
              <View style={styles.ctaBtn}>
                <Text style={styles.ctaText}>Check it Out</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.recapCaption} numberOfLines={1}>{event.caption}</Text>
          )}

          <View style={styles.actions}>
            <Pressable onPress={onLike} hitSlop={10}>
              <Heart
                size={20}
                color={liked ? Colors.danger : Colors.textSecondary}
                fill={liked ? Colors.danger : 'transparent'}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable onPress={onSave} hitSlop={10}>
              <Bookmark
                size={20}
                color={saved ? Colors.primary : Colors.textSecondary}
                fill={saved ? Colors.primary : 'transparent'}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable hitSlop={10}>
              <Share2 size={20} color={Colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  avatarWrap: {
    position: 'relative',
    width: 42,
    height: 42,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.border,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  headerText: { flex: 1, gap: 2 },
  username: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
  },
  recapLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  priceBadgeFull: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  priceBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#FFF',
  },
  freeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  freeBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#16A34A',
  },
  mediaWrap: {
    width: CARD_W,
    height: CARD_W * 0.72,
    position: 'relative',
    backgroundColor: Colors.border,
  },
  media: { width: '100%', height: '100%' },
  mediaGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 23,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  urgentText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#DC2626',
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  ctaWrap: { flex: 1, marginRight: 12 },
  ctaBtn: {
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
  recapCaption: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginRight: 12,
  },
  actions: { flexDirection: 'row', gap: 14 },
});
