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
      console.log("Skipping navigation, still loading:", { isLoading });
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inConversation = segments[0] === 'conversation';

    console.log("Navigation check - Current segment:", segments[0]);
    console.log("Navigation check - User state:", user ? "Logged in" : "Not logged in");
    console.log("Navigation check - Route path:", JSON.stringify(segments));

    try {
      // Simplified navigation logic with robust error handling
      if (user) {
        // User is signed in
        console.log("User is signed in with ID:", user.id);
        
        if (inAuthGroup || inOnboardingGroup) {
          console.log("Redirecting authenticated user to tabs");
          // Redirect to tabs if already authenticated
          router.replace('/(tabs)');
        }
      } else {
        // User is not signed in
        console.log("No user is signed in");
        
        if (!inAuthGroup && !inOnboardingGroup) {
          console.log("Redirecting unauthenticated user to welcome");
          // Always go to welcome screen if not signed in
          router.replace('/(onboarding)/welcome');
        }
      }
    } catch (error) {
      console.error("Navigation error:", error);
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
