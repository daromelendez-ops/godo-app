import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function WelcomeScreen() {
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const textAnim  = useRef(new Animated.Value(0)).current;
  const btnsAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(textAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(btnsAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const logoStyle = {
    opacity: logoAnim,
    transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
  };
  const textStyle = {
    opacity: textAnim,
    transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
  const btnsStyle = {
    opacity: btnsAnim,
    transform: [{ translateY: btnsAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  return (
    <View style={s.container}>

      {/* ── Center block: logo + tagline ── */}
      <View style={s.center}>
        <Animated.View style={[s.iconWrap, logoStyle]}>
          <Text style={s.iconText}>GoDo</Text>
        </Animated.View>

        <Animated.View style={textStyle}>
          <Text style={s.tagline}>
            Let's{' '}
            <Text style={s.taglineBlue}>GoDo</Text>
            {' '}something
          </Text>
        </Animated.View>
      </View>

      {/* ── Bottom buttons ── */}
      <Animated.View style={[s.actions, btnsStyle]}>
        <Pressable
          style={s.primaryBtn}
          onPress={() => router.push('/(auth)/sign-up-options')}
        >
          <Text style={s.primaryBtnText}>Get Started</Text>
        </Pressable>

        <Pressable
          style={s.secondaryBtn}
          onPress={() => router.push('/(auth)/email-sign-in')}
        >
          <Text style={s.secondaryBtnText}>I already have an account</Text>
        </Pressable>
      </Animated.View>

    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 52,
    paddingHorizontal: 28,
  },

  /* center section */
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },

  /* blue rounded square icon */
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  iconText: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  /* tagline */
  tagline: {
    fontSize: 26,
    fontFamily: 'Inter_400Regular',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  taglineBlue: {
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },

  /* buttons */
  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
  },
});
