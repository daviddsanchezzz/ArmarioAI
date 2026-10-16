import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from '@/lib/queryClient';
import { startSessionListener, useSessionStore } from '@/stores/session';
import { useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});
startSessionListener();

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const session = useSessionStore((s) => s.session);
  const loading = useSessionStore((s) => s.loading);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  // Al cerrar sesión, no dejamos datos del usuario anterior en caché.
  useEffect(() => {
    if (!session) queryClient.clear();
  }, [session]);

  if (loading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Protected guard={!session}>
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="garment/[id]" options={{ title: 'Prenda', headerBackTitle: 'Armario' }} />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
