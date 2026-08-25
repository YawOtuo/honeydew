import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (isLoading) return;
    if (!user && !inAuthGroup) router.replace('/(auth)/login');
    if (user && inAuthGroup) router.replace('/(tabs)');
  }, [inAuthGroup, isLoading, router, user]);

  if (isLoading) return null;
  if (!user && !inAuthGroup) return <Redirect href="/(auth)/login" />;
  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="add-transaction" options={{ presentation: 'modal' }} /></Stack>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AuthGate />
    </AuthProvider>
  );
}
