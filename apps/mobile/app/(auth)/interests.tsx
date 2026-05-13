import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';
import { fetchInterestIds, saveUserInterests } from '../../lib/events';

const INTERESTS = [
  { id: 'fitness', label: 'Fitness', emoji: '🏋️' },
  { id: 'social', label: 'Social', emoji: '🎉' },
  { id: 'games', label: 'Games', emoji: '🎮' },
  { id: 'outdoors', label: 'Outdoors', emoji: '🌿' },
  { id: 'food_drink', label: 'Food & Drink', emoji: '🍕' },
  { id: 'arts', label: 'Arts', emoji: '🎨' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'wellness', label: 'Wellness', emoji: '🧘' },
  { id: 'learning', label: 'Learning', emoji: '📚' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

const MIN_INTERESTS = 3;

export default function InterestsScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { initialize } = useAuthStore();

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  async function handleContinue() {
    setLoading(true);
    await initialize();
    const { user } = useAuthStore.getState();
    if (user) {
      const labels = selected.map(id => INTERESTS.find(i => i.id === id)?.label ?? '').filter(Boolean);
      const rows = await fetchInterestIds(labels);
      if (rows.length > 0) {
        await saveUserInterests(user.id, rows.map(r => r.id));
      }
    }
    setLoading(false);
    setShowModal(true);
  }

  function handleLetsGo() {
    setShowModal(false);
    router.replace('/(tabs)');
  }

  const canContinue = selected.length >= MIN_INTERESTS;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Pick at least 3 that sound fun — we'll show you the best events first.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {INTERESTS.map(item => (
          <Pressable
            key={item.id}
            style={[styles.chip, selected.includes(item.id) && styles.chipSelected]}
            onPress={() => toggle(item.id)}
          >
            <Text style={styles.chipEmoji}>{item.emoji}</Text>
            <Text
              style={[
                styles.chipLabel,
                selected.includes(item.id) && styles.chipLabelSelected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {!canContinue && (
          <Text style={styles.hint}>
            Select {MIN_INTERESTS - selected.length} more to continue
          </Text>
        )}
        <Pressable
          style={[styles.btn, !canContinue && styles.btnDisabled, loading && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              Continue {canContinue ? `(${selected.length} selected)` : ''}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Onboarding completion modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.completionModal}>
            <Text style={styles.completionEmoji}>🥳</Text>
            <Text style={styles.completionTitle}>You're all set!</Text>
            <Text style={styles.completionBody}>
              Your feed is ready. Discover something fun happening near you — tonight.
            </Text>
            <Pressable style={styles.letsGoBtn} onPress={handleLetsGo}>
              <Text style={styles.letsGoBtnText}>Yeah! Let's GoDo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  scroll: { flex: 1 },
  grid: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipEmoji: { fontSize: 18 },
  chipLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  chipLabelSelected: { color: Colors.primary },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 10,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  btn: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
  /* Completion modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  completionModal: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  completionEmoji: { fontSize: 64, marginBottom: 8 },
  completionTitle: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#FFF',
    textAlign: 'center',
  },
  completionBody: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  letsGoBtn: {
    height: 56,
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  letsGoBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
});
