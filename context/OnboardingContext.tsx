import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { usePathname } from 'expo-router';

// Mapping of screen names to their position in the onboarding flow
const SCREEN_ORDER = {
  'welcome': 0,
  'language-selection': 1,
  'dialect-selection': 2,
  'arabic-learning-source': 3,
  'arabic-level': 4,
  'skills-selection': 5,
  'interests': 6,
  'challenges': 7,
  'daily-goal': 8,
  'goal-confirmation': 9,
  'reminder-time': 10,
  'your-name': 11,
  'rate-experience': 12,
  'loading': 12 // Set to same as rate-experience since it's not part of the progress
};

// Total number of steps (excluding loading)
const TOTAL_STEPS = 12;

type OnboardingContextType = {
  progressValue: Animated.Value;
  setProgressByScreen: (screenName: string) => void;
  currentScreen: string;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  // Track current screen by name
  const [currentScreen, setCurrentScreen] = useState<string>('welcome');
  
  // Animated value for progress display
  const progressValue = useRef(new Animated.Value(0)).current;
  
  // Simple function to set progress by screen name
  const setProgressByScreen = (screenName: string) => {
    // Strip any path prefixes if present (e.g., '/(onboarding)/welcome' -> 'welcome')
    const cleanScreenName = screenName.split('/').pop() || screenName;
    
    // Get the position in the flow
    const screenPosition = SCREEN_ORDER[cleanScreenName as keyof typeof SCREEN_ORDER];
    
    // Only proceed if the screen name is valid
    if (screenPosition !== undefined) {
      // Update current screen
      setCurrentScreen(cleanScreenName);
      
      // Calculate progress (0 to 1)
      const progress = screenPosition / TOTAL_STEPS;
      
      // Animate to the new progress value
      Animated.timing(progressValue, {
        toValue: progress,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false
      }).start();
    }
  };

  return (
    <OnboardingContext.Provider 
      value={{ 
        progressValue,
        setProgressByScreen,
        currentScreen
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
} 