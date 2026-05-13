import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, ChevronRight, Camera, ImagePlus, CalendarDays, Clock } from 'lucide-react-native';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';
import { createEvent } from '../../lib/events';
import { pickMedia, takePhoto, uploadMedia } from '../../lib/storage';

const CATEGORIES = [
  { id: 'social', label: 'Social' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'outdoors', label: 'Outdoors' },
  { id: 'food_drink', label: 'Food & Drink' },
  { id: 'arts', label: 'Arts' },
  { id: 'music', label: 'Music' },
  { id: 'games', label: 'Games' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'sports', label: 'Sports' },
  { id: 'learning', label: 'Learning' },
];

const EVENT_TYPES = [
  { id: 'activity', label: 'Activity', desc: '2–5 people', range: [2, 5] },
  { id: 'vibe', label: 'Vibe', desc: '6–12 people', range: [6, 12] },
  { id: 'event_plus', label: 'Event+', desc: '13+ people', range: [13, 30] },
];

export default function CreateScreen() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [eventType, setEventType] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [spotsCount, setSpotsCount] = useState(6);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [publishing, setPublishing] = useState(false);
  const [coverAsset, setCoverAsset] = useState<ImagePickerAsset | null>(null);

  const selectedType = EVENT_TYPES.find(t => t.id === eventType);
  const minSpots = selectedType?.range[0] ?? 2;
  const maxSpots = selectedType?.range[1] ?? 12;

  const canPublish =
    title.trim() &&
    category &&
    eventType &&
    description.trim() &&
    address.trim() &&
    neighborhood.trim() &&
    eventDate !== null &&
    (!isPaid || (price && parseFloat(price) > 0));

  function formatEventDate(d: Date) {
    return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatEventTime(d: Date) {
    return d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
  }

  async function handlePublish() {
    if (!canPublish || !user || !eventDate) return;
    setPublishing(true);

    // Upload cover media if selected
    let coverUrl: string | undefined;
    let coverType: 'image' | 'video' = 'image';
    if (coverAsset) {
      const uploaded = await uploadMedia(coverAsset, 'event-covers', user.id);
      if (uploaded) {
        coverUrl = uploaded.publicUrl;
        coverType = coverAsset.type === 'video' ? 'video' : 'image';
      }
    }

    const categoryLabel = CATEGORIES.find(c => c.id === category)?.label ?? category;
    const id = await createEvent({
      hostUserId: user.id,
      title: title.trim(),
      description: description.trim(),
      emoji: '✨',
      categoryName: categoryLabel,
      eventType,
      maxGroupSize: spotsCount,
      isPrivate,
      isPaid,
      priceCents: isPaid ? Math.round(parseFloat(price) * 100) : 0,
      neighborhood: neighborhood.trim(),
      address: address.trim(),
      startsAt: eventDate,
      coverPhotoUrl: coverUrl,
      coverType,
    });
    setPublishing(false);
    if (id) {
      router.replace(`/event/${id}`);
    } else {
      Alert.alert('Error', 'Could not publish event. Try again.');
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={24} color={Colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>New Event</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cover photo / video */}
          <View style={s.section}>
            <Text style={s.label}>Cover photo or video</Text>
            {coverAsset ? (
              <View style={s.coverPreview}>
                {coverAsset.type === 'video' ? (
                  <Video
                    source={{ uri: coverAsset.uri }}
                    style={s.coverMedia}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    isMuted
                    shouldPlay
                  />
                ) : (
                  <Image source={{ uri: coverAsset.uri }} style={s.coverMedia} resizeMode="cover" />
                )}
                <Pressable style={s.coverRemove} onPress={() => setCoverAsset(null)}>
                  <X size={16} color="#FFF" strokeWidth={2.5} />
                </Pressable>
              </View>
            ) : (
              <View style={s.coverButtons}>
                <Pressable
                  style={s.coverBtn}
                  onPress={async () => {
                    const asset = await pickMedia({ allowsVideo: true, aspect: [1, 1] });
                    if (asset) setCoverAsset(asset);
                  }}
                >
                  <ImagePlus size={20} color={Colors.primary} strokeWidth={2} />
                  <Text style={s.coverBtnText}>Choose from library</Text>
                </Pressable>
                <Pressable
                  style={s.coverBtn}
                  onPress={async () => {
                    const asset = await takePhoto();
                    if (asset) setCoverAsset(asset);
                  }}
                >
                  <Camera size={20} color={Colors.primary} strokeWidth={2} />
                  <Text style={s.coverBtnText}>Take a photo</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Event name */}
          <View style={s.section}>
            <Text style={s.label}>Event name *</Text>
            <TextInput
              style={s.input}
              placeholder="Give your event a name"
              placeholderTextColor={Colors.textLight}
              value={title}
              onChangeText={setTitle}
              maxLength={60}
              returnKeyType="next"
            />
          </View>

          {/* Category */}
          <View style={s.section}>
            <Text style={s.label}>Category *</Text>
            <View style={s.chips}>
              {CATEGORIES.map(c => (
                <Pressable
                  key={c.id}
                  style={[s.chip, category === c.id && s.chipActive]}
                  onPress={() => setCategory(c.id)}
                >
                  <CategoryIcon category={c.label} size="sm" />
                  <Text style={[s.chipText, category === c.id && s.chipTextActive]}>
                    {c.label === 'Food & Drink' ? 'Food' : c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Event type */}
          <View style={s.section}>
            <Text style={s.label}>Event type *</Text>
            <View style={s.typeRow}>
              {EVENT_TYPES.map(t => (
                <Pressable
                  key={t.id}
                  style={[s.typeCard, eventType === t.id && s.typeCardActive]}
                  onPress={() => {
                    setEventType(t.id);
                    setSpotsCount(t.range[0]);
                  }}
                >
                  <Text style={[s.typeLabel, eventType === t.id && s.typeLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={[s.typeDesc, eventType === t.id && s.typeDescActive]}>
                    {t.desc}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Spots */}
          {eventType && (
            <View style={s.section}>
              <Text style={s.label}>Group size</Text>
              <View style={s.spotsRow}>
                <Pressable
                  style={s.spotsBtn}
                  onPress={() => setSpotsCount(c => Math.max(minSpots, c - 1))}
                >
                  <Text style={s.spotsBtnText}>−</Text>
                </Pressable>
                <Text style={s.spotsNum}>{spotsCount}</Text>
                <Pressable
                  style={s.spotsBtn}
                  onPress={() => setSpotsCount(c => Math.min(maxSpots, c + 1))}
                >
                  <Text style={s.spotsBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Privacy */}
          <View style={s.section}>
            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Private event</Text>
                <Text style={s.sublabel}>Only visible to friends & your people</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Pricing */}
          <View style={s.section}>
            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Paid event</Text>
                <Text style={s.sublabel}>Charge attendees a fee</Text>
              </View>
              <Switch
                value={isPaid}
                onValueChange={setIsPaid}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor="#FFF"
              />
            </View>
            {isPaid && (
              <View style={s.priceWrap}>
                <Text style={s.currencySign}>$</Text>
                <TextInput
                  style={s.priceInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textLight}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          </View>

          {/* Location */}
          <View style={s.section}>
            <Text style={s.label}>Location *</Text>
            <TextInput
              style={s.input}
              placeholder="Neighborhood (e.g. Downtown)"
              placeholderTextColor={Colors.textLight}
              value={neighborhood}
              onChangeText={setNeighborhood}
              returnKeyType="next"
            />
            <TextInput
              style={[s.input, { marginTop: 10 }]}
              placeholder="Exact address (only shared with confirmed attendees)"
              placeholderTextColor={Colors.textLight}
              value={address}
              onChangeText={setAddress}
              returnKeyType="next"
              multiline
            />
          </View>

          {/* Date & time */}
          <View style={s.section}>
            <Text style={s.label}>Date & time *</Text>
            <View style={s.dateRow}>
              <Pressable
                style={s.dateBtn}
                onPress={() => { setTempDate(eventDate ?? new Date()); setShowDatePicker(true); }}
              >
                <CalendarDays size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={[s.dateBtnText, !eventDate && s.datePlaceholder]}>
                  {eventDate ? formatEventDate(eventDate) : 'Pick a date'}
                </Text>
              </Pressable>
              <Pressable
                style={s.dateBtn}
                onPress={() => { setTempDate(eventDate ?? new Date()); setShowTimePicker(true); }}
              >
                <Clock size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={[s.dateBtnText, !eventDate && s.datePlaceholder]}>
                  {eventDate ? formatEventTime(eventDate) : 'Pick a time'}
                </Text>
              </Pressable>
            </View>

            {/* iOS inline pickers in modal */}
            {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
              <Modal transparent animationType="slide">
                <View style={s.pickerModal}>
                  <View style={s.pickerCard}>
                    <Text style={s.pickerTitle}>
                      {showDatePicker ? 'Select Date' : 'Select Time'}
                    </Text>
                    <DateTimePicker
                      value={tempDate}
                      mode={showDatePicker ? 'date' : 'time'}
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={(_, d) => { if (d) setTempDate(d); }}
                    />
                    <Pressable
                      style={s.pickerDone}
                      onPress={() => {
                        const base = eventDate ?? new Date();
                        if (showDatePicker) {
                          const merged = new Date(base);
                          merged.setFullYear(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());
                          setEventDate(merged);
                          setShowDatePicker(false);
                        } else {
                          const merged = new Date(base);
                          merged.setHours(tempDate.getHours(), tempDate.getMinutes());
                          setEventDate(merged);
                          setShowTimePicker(false);
                        }
                      }}
                    >
                      <Text style={s.pickerDoneText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>
            )}

            {/* Android native pickers (inline, no modal needed) */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(_, d) => {
                  setShowDatePicker(false);
                  if (d) {
                    const merged = new Date(eventDate ?? new Date());
                    merged.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                    setEventDate(merged);
                  }
                }}
              />
            )}
            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker
                value={tempDate}
                mode="time"
                display="default"
                onChange={(_, d) => {
                  setShowTimePicker(false);
                  if (d) {
                    const merged = new Date(eventDate ?? new Date());
                    merged.setHours(d.getHours(), d.getMinutes());
                    setEventDate(merged);
                  }
                }}
              />
            )}
          </View>

          {/* Description */}
          <View style={s.section}>
            <Text style={s.label}>Description *</Text>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="Tell people what to expect…"
              placeholderTextColor={Colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Publish */}
          <Pressable
            style={[s.publishBtn, (!canPublish || publishing) && s.publishBtnDisabled]}
            disabled={!canPublish || publishing}
            onPress={handlePublish}
          >
            {publishing
              ? <ActivityIndicator color="#FFF" />
              : <>
                  <Text style={s.publishText}>Publish Event</Text>
                  <ChevronRight size={18} color="#FFF" strokeWidth={2.5} />
                </>
            }
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
  scroll: { flex: 1 },
  content: { padding: 20, gap: 8, paddingBottom: 48 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  sublabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  input: {
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  textArea: { height: 120, paddingTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  chipTextActive: { color: Colors.primary },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  typeCardActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  typeLabel: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
  },
  typeLabelActive: { color: Colors.primary },
  typeDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
  },
  typeDescActive: { color: Colors.primary },
  spotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    alignSelf: 'flex-start',
  },
  spotsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotsBtnText: {
    fontSize: 22,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  spotsNum: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    minWidth: 36,
    textAlign: 'center',
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.background,
    height: 48,
    gap: 4,
  },
  currencySign: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  publishBtn: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  publishBtnDisabled: { opacity: 0.4 },
  publishText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
  coverPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  coverMedia: {
    width: '100%',
    height: '100%',
  },
  coverRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  dateBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    flex: 1,
  },
  datePlaceholder: {
    color: Colors.textLight,
  },
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingTop: 16,
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingBottom: 8,
  },
  pickerDone: {
    marginHorizontal: 20,
    marginTop: 12,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerDoneText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
  coverButtons: {
    gap: 10,
  },
  coverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  coverBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
  },
});
