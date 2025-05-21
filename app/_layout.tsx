import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DialectProvider } from '@/context/DialectContext';
import { LearningProvider } from '@/context/LearningContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Navigation logic
  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inConversation = segments[0] === 'conversation';

    try {
      // Simplified navigation logic with robust error handling
      if (user) {
        // User is signed in
        if (inAuthGroup || inOnboardingGroup) {
          // Redirect to tabs if already authenticated
          router.replace('/(tabs)');
        }
      } else {
        // User is not signed in
        if (!inAuthGroup && !inOnboardingGroup) {
          // Always go to welcome screen if not signed in
          router.replace('/(onboarding)/welcome');
        }
      }
    } catch (error) {
      // Navigation error handling
    }
  }, [user, segments, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="conversation" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const router = useRouter();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <DialectProvider>
            <LearningProvider>
              <RootLayoutNav />
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            </LearningProvider>
          </DialectProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
