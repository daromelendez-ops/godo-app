import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-up-options" />
      <Stack.Screen name="email-sign-up" />
      <Stack.Screen name="email-sign-in" />
      <Stack.Screen name="location-permission" />
      <Stack.Screen name="interests" />
    </Stack>
  );
}
