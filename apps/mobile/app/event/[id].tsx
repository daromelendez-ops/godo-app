import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  Heart,
  Bookmark,
  Share2,
  Check,
  Send,
  ImagePlus,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Colors } from '../../constants/colors';
import { MAP_THUMBNAIL, type FeedEvent } from '../../constants/mockData';
import { Confetti } from '../../components/ui/Confetti';
import { fetchEvent, requestToJoin, cancelJoinRequest, getAttendeeState } from '../../lib/events';
import { useAuthStore } from '../../stores/authStore';
import {
  fetchComments,
  postComment,
  subscribeToComments,
  type EventComment,
} from '../../lib/comments';
import { pickMedia } from '../../lib/storage';
import { isEventLiked, toggleEventLike, submitRating } from '../../lib/events';
import { uploadEventPhoto, getEventPhotos, type EventPhoto } from '../../lib/photos';

const { width: W } = Dimensions.get('window');
const MEDIA_H = Math.round(W * 0.72);

type JoinState = 'none' | 'pending' | 'confirmed';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<FeedEvent | null>(null);

  const [joinState, setJoinState] = useState<JoinState>('none');
  const [showRSVP, setShowRSVP] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);

  const [comments, setComments] = useState<EventComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [showRateHost, setShowRateHost] = useState(false);
  const [hostRating, setHostRating] = useState(0);
  const [hostRated, setHostRated] = useState(false);
  const commentChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchEvent(id).then(ev => {
      if (ev) {
        setEvent(ev);
        setAttendeeCount(ev.attending ?? 0);
        setLikesCount((ev as unknown as { likes_count?: number }).likes_count ?? 0);
      }
    });
    if (user) {
      getAttendeeState(id, user.id).then(state => {
        if (state === 'confirmed') setJoinState('confirmed');
        else if (state === 'pending_approval') setJoinState('pending');
      });
    }
    fetchComments(id).then(setComments);
    getEventPhotos(id).then(setPhotos);
    commentChannelRef.current = subscribeToComments(id, (c) =>
      setComments(prev => [...prev, c]),
    );
    if (user) {
      isEventLiked(id, user.id).then(setLiked);
    }
    return () => { commentChannelRef.current?.unsubscribe(); };
  }, [id, user]);

  async function handlePostComment() {
    if (!commentText.trim() || !user || !event) return;
    setPostingComment(true);
    const body = commentText.trim();
    setCommentText('');
    await postComment(event.id, user.id, body);
    setPostingComment(false);
  }

  async function submitHostRating() {
    if (!user || !event?.host || hostRating === 0) return;
    const hostUserId = (event as unknown as { host_user_id?: string }).host_user_id;
    if (!hostUserId) return;
    await submitRating(event.id, user.id, hostUserId, 'host', hostRating);
    setHostRated(true);
    setShowRateHost(false);
    showToastMsg('Rating submitted!');
  }

  async function handleLike() {
    if (!user || !event) return;
    const nowLiked = await toggleEventLike(event.id, user.id);
    setLiked(nowLiked);
    setLikesCount(c => nowLiked ? c + 1 : Math.max(0, c - 1));
  }

  async function handleUploadPhoto() {
    if (!user || !event) return;
    const asset = await pickMedia();
    if (!asset) return;
    setUploadingPhoto(true);
    const photo = await uploadEventPhoto(asset, event.id, user.id);
    if (photo) setPhotos(prev => [photo, ...prev]);
    setUploadingPhoto(false);
    showToastMsg('Photo added!');
  }

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.92)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  function openModal(which: 'rsvp' | 'cancel') {
    if (which === 'rsvp') setShowRSVP(true);
    else setShowCancel(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(modalAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(modalScale, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();
  }

  function closeModal(cb?: () => void) {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(modalAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(modalScale, { toValue: 0.92, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setShowRSVP(false);
      setShowCancel(false);
      cb?.();
    });
  }

  function showToastMsg(msg: string) {
    setToast(msg);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(toastAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  }

  function handleCTA() {
    if (joinState === 'confirmed' || joinState === 'pending') return;
    openModal('rsvp');
  }

  async function confirmRSVP() {
    closeModal(async () => {
      setJoinState('pending');
      if (user && event) await requestToJoin(event.id, user.id);
      showToastMsg("Request sent! Waiting for host approval.");
    });
  }

  function handleCancelPress() {
    openModal('cancel');
  }

  async function confirmCancel() {
    closeModal(async () => {
      const wasPending = joinState === 'pending';
      if (user && event) await cancelJoinRequest(event.id, user.id);
      setJoinState('none');
      if (joinState === 'confirmed') setAttendeeCount(c => c - 1);
      showToastMsg(wasPending ? 'Request canceled.' : "You've left the event.");
    });
  }

  if (!event) {
    return (
      <SafeAreaView style={s.safe}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <View style={s.notFound}>
          <Text style={s.notFoundText}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = event.price && event.price !== 'Free';
  const ctaLabel =
    joinState === 'confirmed'
      ? "You're In ✓"
      : joinState === 'pending'
      ? 'Pending Approval'
      : isPaid
      ? `Join for ${event.price}`
      : 'Request to Join';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Back */}
      <View style={s.topBar}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 220 }}>
        {/* Media */}
        <View style={s.mediaWrap}>
          <Image source={{ uri: event.mediaUrl }} style={s.media} resizeMode="cover" />
          {event.price && (
            <View style={s.pricePill}>
              <Text style={s.priceText}>{event.price}</Text>
            </View>
          )}
        </View>

        <View style={s.body}>
          {/* Title block */}
          <View style={s.titleBlock}>
            <Text style={s.timeLabel}>{event.timeLabel}</Text>
            <Text style={s.title}>{event.eventTitle}</Text>
            {joinState === 'confirmed' && (
              <View style={s.youreInBadge}>
                <Check size={12} color={Colors.primary} strokeWidth={2.5} />
                <Text style={s.youreInText}>You're In</Text>
              </View>
            )}
            {joinState === 'pending' && (
              <View style={s.pendingBadge}>
                <Text style={s.pendingText}>Pending Approval</Text>
              </View>
            )}
          </View>

          {/* Location */}
          <View style={s.row}>
            <View style={s.rowLeft}>
              <MapPin size={16} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={s.rowText}>{event.neighborhood ?? 'Location TBD'}</Text>
            </View>
            <View style={s.mapThumb}>
              <Image source={{ uri: MAP_THUMBNAIL }} style={s.mapImg} resizeMode="cover" />
            </View>
          </View>

          {/* Separator */}
          <View style={s.divider} />

          {/* Host */}
          {event.host && (
            <View style={s.row}>
              <View style={s.rowLeft}>
                <View style={s.hostAvatarWrap}>
                  <Image source={{ uri: event.host.avatarUrl }} style={s.hostAvatar} />
                </View>
                <View>
                  <Text style={s.hostName}>{event.host.name}</Text>
                  <Text style={s.hostSince}>Member since {event.host.memberSince}</Text>
                </View>
              </View>
              <Pressable hitSlop={8}>
                <MessageCircle size={20} color={Colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
          )}

          <View style={s.divider} />

          {/* Description */}
          {event.description && (
            <View style={s.descBlock}>
              <Text style={s.desc}>{event.description}</Text>
            </View>
          )}

          <View style={s.divider} />

          {/* Attending + actions */}
          <View style={s.attendRow}>
            <View>
              <Text style={s.attendText}>
                {attendeeCount} attending · {event.spotsLeft} spots left
              </Text>
              {likesCount > 0 && (
                <Text style={s.likesText}>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</Text>
              )}
            </View>
            <View style={s.actionIcons}>
              <Pressable hitSlop={10} onPress={handleLike}>
                <Heart
                  size={20}
                  color={liked ? Colors.danger : Colors.textSecondary}
                  fill={liked ? Colors.danger : 'transparent'}
                  strokeWidth={2}
                />
              </Pressable>
              <Pressable hitSlop={10}>
                <Bookmark size={20} color={Colors.textSecondary} strokeWidth={2} />
              </Pressable>
              <Pressable hitSlop={10}>
                <Share2 size={20} color={Colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* Photo gallery */}
          {photos.length > 0 && (
            <>
              <View style={s.divider} />
              <View style={s.gallerySection}>
                <Text style={s.commentsTitle}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  <View style={s.galleryRow}>
                    {photos.map(p => (
                      <Image key={p.id} source={{ uri: p.public_url }} style={s.galleryImg} resizeMode="cover" />
                    ))}
                  </View>
                </ScrollView>
              </View>
            </>
          )}

          <View style={s.divider} />

          {/* Comments */}
          <View style={s.commentsSection}>
            <View style={s.commentsHeader}>
              <Text style={s.commentsTitle}>Comments</Text>
              {joinState === 'confirmed' && (
                <Pressable onPress={handleUploadPhoto} style={s.photoBtn} hitSlop={8} disabled={uploadingPhoto}>
                  {uploadingPhoto
                    ? <ActivityIndicator size="small" color={Colors.primary} />
                    : <ImagePlus size={20} color={Colors.primary} strokeWidth={2} />
                  }
                </Pressable>
              )}
            </View>

            {comments.length === 0 && (
              <Text style={s.noComments}>No comments yet. Be the first!</Text>
            )}

            {comments.map(c => (
              <View key={c.id} style={s.commentRow}>
                <View style={s.commentAvatar}>
                  <Text style={s.commentAvatarText}>
                    {(c.profiles?.username ?? 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={s.commentBubble}>
                  <Text style={s.commentUsername}>{c.profiles?.username ?? 'User'}</Text>
                  <Text style={s.commentBody}>{c.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Comment input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
        style={s.commentInputWrap}
      >
        <View style={s.commentInputRow}>
          <TextInput
            style={s.commentInput}
            placeholder="Write a comment…"
            placeholderTextColor={Colors.textLight}
            value={commentText}
            onChangeText={setCommentText}
            returnKeyType="send"
            onSubmitEditing={handlePostComment}
            blurOnSubmit={false}
          />
          <Pressable
            style={[s.sendBtn, (!commentText.trim() || postingComment) && s.sendBtnDisabled]}
            onPress={handlePostComment}
            disabled={!commentText.trim() || postingComment}
          >
            {postingComment
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Send size={18} color="#FFF" strokeWidth={2} />
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Sticky CTA */}
      <View style={s.stickyBar}>
        <Pressable
          style={[
            s.ctaBtn,
            joinState === 'confirmed' && s.ctaBtnIn,
            joinState === 'pending' && s.ctaBtnPending,
          ]}
          onPress={handleCTA}
          disabled={joinState === 'pending'}
        >
          <Text
            style={[
              s.ctaText,
              joinState === 'confirmed' && s.ctaTextIn,
              joinState === 'pending' && s.ctaTextPending,
            ]}
          >
            {ctaLabel}
          </Text>
        </Pressable>
        {(joinState === 'confirmed' || joinState === 'pending') && (
          <View style={s.cancelRow}>
            <Pressable style={s.cancelLink} onPress={handleCancelPress}>
              <Text style={s.cancelLinkText}>
                {joinState === 'pending' ? 'Cancel Request' : 'Cancel'}
              </Text>
            </Pressable>
            {joinState === 'confirmed' && !hostRated && (
              <Pressable style={s.rateHostLink} onPress={() => setShowRateHost(true)}>
                <Text style={s.rateHostLinkText}>⭐ Rate Host</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* RSVP Modal */}
      {showRSVP && (
        <Animated.View
          style={[s.backdrop, { opacity: backdropAnim }]}
          pointerEvents="box-none"
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => closeModal()} />
          <Animated.View
            style={[s.modal, { opacity: modalAnim, transform: [{ scale: modalScale }] }]}
          >
            <Text style={s.modalTitle}>Send Join Request</Text>
            <Text style={s.modalBody}>
              You're about to request to join{' '}
              <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{event.eventTitle}</Text>.
              {'\n'}Once the host approves, you're in!
            </Text>
            <View style={s.modalBtns}>
              <Pressable style={s.modalBtnSecondary} onPress={() => closeModal()}>
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={s.modalBtnPrimary} onPress={confirmRSVP}>
                <Text style={s.modalBtnPrimaryText}>Send Request</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Cancel Modal */}
      {showCancel && (
        <Animated.View
          style={[s.backdrop, { opacity: backdropAnim }]}
          pointerEvents="box-none"
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => closeModal()} />
          <Animated.View
            style={[s.modal, { opacity: modalAnim, transform: [{ scale: modalScale }] }]}
          >
            <Text style={s.modalTitle}>
              {joinState === 'pending' ? 'Cancel Request?' : 'Leave Event?'}
            </Text>
            <Text style={s.modalBody}>
              {joinState === 'pending'
                ? `Are you sure you want to cancel your join request for ${event.eventTitle}?`
                : `Are you sure you want to leave ${event.eventTitle}?`}
            </Text>
            <View style={s.modalBtns}>
              <Pressable style={s.modalBtnPrimary} onPress={() => closeModal()}>
                <Text style={s.modalBtnPrimaryText}>
                  {joinState === 'pending' ? 'Keep Request' : 'Keep My Spot'}
                </Text>
              </Pressable>
              <Pressable style={s.modalBtnSecondary} onPress={confirmCancel}>
                <Text style={[s.modalBtnSecondaryText, { color: Colors.danger }]}>
                  {joinState === 'pending' ? 'Cancel Request' : 'Leave'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Toast */}
      {toastVisible && (
        <Animated.View style={[s.toast, { opacity: toastAnim }]}>
          <Text style={s.toastText}>{toast}</Text>
        </Animated.View>
      )}

      {/* Rate Host Modal */}
      {showRateHost && (
        <View style={s.backdrop} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowRateHost(false)} />
          <View style={s.modal}>
            <Text style={s.modalTitle}>Rate the Host</Text>
            <Text style={s.modalBody}>How was {event?.host?.name ?? 'the host'}?</Text>
            <View style={s.starRow}>
              {[1,2,3,4,5].map(n => (
                <Pressable key={n} hitSlop={8} onPress={() => setHostRating(n)}>
                  <Text style={{ fontSize: 36 }}>{n <= hostRating ? '★' : '☆'}</Text>
                </Pressable>
              ))}
            </View>
            <View style={s.modalBtns}>
              <Pressable style={s.modalBtnSecondary} onPress={() => setShowRateHost(false)}>
                <Text style={s.modalBtnSecondaryText}>Skip</Text>
              </Pressable>
              <Pressable
                style={[s.modalBtnPrimary, hostRating === 0 && { opacity: 0.4 }]}
                onPress={submitHostRating}
                disabled={hostRating === 0}
              >
                <Text style={s.modalBtnPrimaryText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Confetti */}
      {showConfetti && <Confetti />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  topBar: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaWrap: {
    width: W,
    height: MEDIA_H,
    position: 'relative',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  media: { width: '100%', height: '100%' },
  pricePill: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  titleBlock: { gap: 6, marginBottom: 20 },
  timeLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  youreInBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
  },
  youreInText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
  },
  pendingText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#92400E',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  mapThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  mapImg: { width: 40, height: 40 },
  hostAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  hostAvatar: { width: 48, height: 48 },
  hostName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  hostSince: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border },
  descBlock: { paddingVertical: 16 },
  desc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  attendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  attendText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  actionIcons: { flexDirection: 'row', gap: 16 },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    gap: 8,
  },
  ctaBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaBtnIn: { backgroundColor: Colors.primaryLight },
  ctaBtnPending: { backgroundColor: '#F3F4F6' },
  ctaText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
  ctaTextIn: { color: Colors.primary },
  ctaTextPending: { color: Colors.textLight },
  cancelRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  cancelLink: { alignItems: 'center', paddingVertical: 4 },
  cancelLinkText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textLight },
  rateHostLink: { alignItems: 'center', paddingVertical: 4 },
  rateHostLinkText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  starRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
  },
  modal: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalBtnSecondary: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#7C7C7C',
  },
  modalBtnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
  toast: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    zIndex: 200,
  },
  toastText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  likesText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textLight, marginTop: 2 },
  gallerySection: { paddingTop: 16, paddingBottom: 8 },
  galleryRow: { flexDirection: 'row', gap: 8 },
  galleryImg: { width: 100, height: 100, borderRadius: 10, backgroundColor: Colors.border },
  commentsSection: { paddingTop: 16, paddingBottom: 8, gap: 12 },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentsTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  photoBtn: { padding: 4 },
  noComments: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: 8,
  },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  commentUsername: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  commentBody: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  commentInputWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 140 : 120,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
