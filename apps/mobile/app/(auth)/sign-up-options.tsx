import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

export default function SignUpOptionsScreen() {
  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join GoDo and start discovering events near you</Text>
      </View>

      <View style={styles.options}>
        <Pressable
          style={styles.optionBtn}
          onPress={() => router.push('/(auth)/email-sign-up')}
        >
          <Mail size={22} color={Colors.textPrimary} strokeWidth={2} />
          <Text style={styles.optionText}>Continue with Email</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable onPress={() => router.push('/(auth)/email-sign-in')}>
          <Text style={styles.footerLink}>Sign in</Text>
        </Pressable>
      </View>

      <Text style={styles.legal}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 40,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  options: {
    gap: 12,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 56,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  legal: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 'auto',
    paddingTop: 24,
  },
});
