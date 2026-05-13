import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

export default function LocationPermissionScreen() {
  const [loading, setLoading] = useState(false);

  async function handleAllow() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        const city = geo?.city ?? geo?.subregion ?? null;
        await supabase.rpc('update_user_location', {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          city_name: city,
        });
      }
    } catch (_) {
      // permission denied or GPS unavailable — continue anyway
    } finally {
      setLoading(false);
      router.replace('/(auth)/interests');
    }
  }

  function handleSkip() {
    router.replace('/(auth)/interests');
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <MapPin size={48} color={Colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Find events near you</Text>
        <Text style={styles.body}>
          GoDo uses your location to show you activities happening in your neighborhood — not across the city.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={handleAllow} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryText}>Allow Location Access</Text>
          }
        </Pressable>
        <Pressable style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 56,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  skipBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
});
