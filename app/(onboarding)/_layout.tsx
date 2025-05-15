import { Stack, useNavigation } from 'expo-router';
import { OnboardingProvider } from '../../context/OnboardingContext';
import { View, StyleSheet, TouchableOpacity, useColorScheme, Platform } from 'react-native';
import ProgressBar from '../../components/ProgressBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useOnboarding } from '../../context/OnboardingContext';
import React, { useEffect } from 'react';

// Custom header component with persistent progress bar
function OnboardingHeader() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { setProgressByScreen } = useOnboarding();
  
  // Only show back button on screens after welcome
  const showBackButton = pathname !== '/(onboarding)/welcome';
  
  // Screen flow map to determine previous screens
  const previousScreenMap: Record<string, string> = {
    '/(onboarding)/skills-selection': 'arabic-level',
    '/(onboarding)/arabic-level': 'arabic-learning-source',
    '/(onboarding)/arabic-learning-source': 'dialect-selection',
    '/(onboarding)/dialect-selection': 'language-selection',
    '/(onboarding)/language-selection': 'welcome',
    '/(onboarding)/interests': 'skills-selection',
    '/(onboarding)/challenges': 'interests',
    '/(onboarding)/daily-goal': 'challenges',
    '/(onboarding)/goal-confirmation': 'daily-goal',
    '/(onboarding)/reminder-time': 'goal-confirmation',
    '/(onboarding)/your-name': 'reminder-time',
    '/(onboarding)/rate-experience': 'your-name',
    '/(onboarding)/loading': 'rate-experience',
    // Default to welcome if not found
    'default': 'welcome'
  };
  
  const handleBack = () => {
    // Determine previous screen name from the map
    const previousScreenPath = previousScreenMap[pathname] || previousScreenMap.default;
    
    // Simply update the progress to the previous screen value
    setProgressByScreen(previousScreenPath);
    
    // Navigate back
    router.back();
  };
  
  const headerContent = (
    <View style={[styles.headerContent]}>
      {showBackButton && (
        <TouchableOpacity onPress={handleBack} style={[
          styles.backButton,
          { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' }
        ]}>
          <Ionicons 
            name="arrow-back" 
            size={20} 
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
          />
        </TouchableOpacity>
      )}
      <View style={styles.progressContainer}>
        <ProgressBar />
      </View>
    </View>
  );
  
  // Use BlurView for a nicer effect
  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={10}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[styles.blurContainer, styles.headerShadow]}
        >
          {headerContent}
        </BlurView>
      ) : (
        <View style={[
          styles.nonBlurContainer,
          styles.headerShadow,
          { backgroundColor: colorScheme === 'dark' ? '#151718' : '#FFFFFF' }
        ]}>
          {headerContent}
        </View>
      )}
    </View>
  );
}

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <OnboardingLayoutContent />
    </OnboardingProvider>
  );
}

function OnboardingLayoutContent() {
  const navigation = useNavigation();
  const { setProgressByScreen } = useOnboarding();
  const pathname = usePathname();
  
  // Set initial progress when component mounts and when pathname changes
  useEffect(() => {
    if (pathname) {
      // Extract screen name from pathname
      const screenName = pathname.split('/').pop() || '';
      
      // Only update progress if we have a valid screen name
      if (screenName) {
        setProgressByScreen(screenName);
      }
    }
  }, [pathname, setProgressByScreen]);
  
  // Also listen for gesture navigation which might not trigger pathname change
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e) => {
      const routes = e.data.state?.routes || [];
      const index = e.data.state?.index || 0;
      const currentRoute = routes[index];
      
      if (currentRoute?.name) {
        // Extract the screen name and update progress
        const screenName = String(currentRoute.name).split('/').pop() || '';
        if (screenName) {
          setProgressByScreen(screenName);
        }
      }
    });
    
    return unsubscribe;
  }, [navigation, setProgressByScreen]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 300,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // Use fade transitions for quiz questions to show progress bar movement
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="welcome" options={{ 
        headerShown: false,
        animation: 'slide_from_right', // Custom animation just for welcome screen
      }} />
      <Stack.Screen 
        name="language-selection" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="dialect-selection" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="arabic-learning-source" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="arabic-level" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="skills-selection" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="interests" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="challenges" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="daily-goal" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="goal-confirmation" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="reminder-time" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="your-name" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="rate-experience" 
        options={{ 
          header: () => <OnboardingHeader />,
          headerShown: true,
          headerTransparent: true
        }} 
      />
      <Stack.Screen 
        name="loading" 
        options={{ 
          headerShown: false
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    paddingBottom: 16,
    zIndex: 2
  },
  blurContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  nonBlurContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progressContainer: {
    flex: 1,
  }
}); 