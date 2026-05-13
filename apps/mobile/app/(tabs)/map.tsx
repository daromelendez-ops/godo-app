import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
      </View>
      <View style={styles.placeholder}>
        <MapPin size={48} color={Colors.textLight} strokeWidth={1.5} />
        <Text style={styles.placeholderTitle}>Map coming soon</Text>
        <Text style={styles.placeholderSub}>Events near you will appear here with Mapbox</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  placeholderTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  placeholderSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});
