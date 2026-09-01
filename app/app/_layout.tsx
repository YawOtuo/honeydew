import 'react-native-gesture-handler';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider, useToast } from '@/components/ui';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1 } } });
void SplashScreen.preventAutoHideAsync();

function UpdateChecker() {
  const { isLoading } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (isLoading || !Updates.isEnabled) return;
    let isMounted = true;
    void (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable) return;
        const downloaded = await Updates.fetchUpdateAsync();
        if (isMounted && downloaded.isNew) {
          showToast('Update downloaded. Restarting...');
          setTimeout(() => void Updates.reloadAsync(), 1200);
        }
      } catch {
        // Update checks are best-effort and should never block app usage.
      }
    })();
    return () => { isMounted = false; };
  }, [isLoading, showToast]);

  return null;
}

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (!isLoading) void SplashScreen.hideAsync();
    if (isLoading) return;
    if (!user && !inAuthGroup) router.replace('/(auth)/login');
    if (user && inAuthGroup) router.replace('/(tabs)');
  }, [inAuthGroup, isLoading, router, user]);

  if (isLoading) return null;
  if (!user && !inAuthGroup) return <Redirect href="/(auth)/login" />;
  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="add-transaction" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' }, gestureEnabled: false }} /></Stack>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><BottomSheetModalProvider><QueryClientProvider client={queryClient}><AuthProvider><ToastProvider>
      <StatusBar style="dark" />
      <UpdateChecker />
      <AuthGate />
    </ToastProvider></AuthProvider></QueryClientProvider></BottomSheetModalProvider></SafeAreaProvider></GestureHandlerRootView>
  );
}
