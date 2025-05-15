import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Animated, Easing, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerSelection, triggerImpact, triggerLightImpact, triggerHeavyImpact, triggerSuccess } from '../../utils/haptics';
import { getReminderTime, scheduleDailyReminder } from '../../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  REMINDER_TIME_KEY, 
  USER_NAME_KEY,
  NATIVE_LANGUAGE_KEY,
  DIALECT_KEY,
  ARABIC_LEVEL_KEY,
  LEARNING_SOURCE_KEY,
  SKILLS_KEY,
  INTERESTS_KEY,
  CHALLENGES_KEY,
  BUSINESS_TOPICS_KEY,
  DAILY_GOAL_KEY,
  saveProfileData,
  getProfileData
} from '@/utils/profileStorage';

// Function to navigate to sign-up screen (moved outside component to avoid render issues)
const navigateToSignUp = () => {
  // Small delay to ensure state updates complete first
  setTimeout(() => {
    router.push('/(auth)/sign-up');
  }, 100);
};

// Helper function to consolidate all onboarding data to the user profile
const saveAllOnboardingData = async () => {
  try {
    // Get all relevant data from AsyncStorage
    const keys = [
      USER_NAME_KEY,
      NATIVE_LANGUAGE_KEY,
      DIALECT_KEY,
      ARABIC_LEVEL_KEY, 
      LEARNING_SOURCE_KEY,
      SKILLS_KEY,
      INTERESTS_KEY,
      CHALLENGES_KEY,
      BUSINESS_TOPICS_KEY,
      DAILY_GOAL_KEY,
      REMINDER_TIME_KEY
    ];
    
    // Load all profile data first
    const dataPromises = keys.map(key => getProfileData(key));
    const dataResults = await Promise.all(dataPromises);
    
    // Prepare consolidated data object with appropriate keys
    const profileData: Record<string, any> = {};
    
    // Map AsyncStorage data to profile data with appropriate keys
    keys.forEach((key, index) => {
      if (dataResults[index] !== null) {
        profileData[key] = dataResults[index];
      }
    });
    
    // Save the reminder time if it exists
    const reminderTimeData = await getReminderTime();
    if (reminderTimeData) {
      await saveProfileData(REMINDER_TIME_KEY, reminderTimeData);
    }
    
    // For debugging
    console.log('Saving onboarding data to profile:', profileData);
    
    return true;
  } catch (error) {
    console.error('Error saving onboarding data to profile:', error);
    return false;
  }
};

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  
  // Animation values
  const progressAnimation = React.useRef(new Animated.Value(0)).current;
  
  // Accent color from design tokens
  const accentColor = '#E5903A';
  const backgroundColor = colorScheme === 'dark' ? '#151718' : '#FFFFFF';
  const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  
  // Loading phases with messages
  const loadingPhases = [
    'Loading your profile...',
    'Preparing your lessons...',
    'Gathering learning materials...',
    'Setting up your dashboard...',
    'Almost ready...'
  ];
  
  // Constants for the circular progress
  const CIRCLE_SIZE = 260;
  const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
  const CIRCLE_STROKE_WIDTH = 14;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * (CIRCLE_RADIUS - CIRCLE_STROKE_WIDTH / 2);
  
  // Total loading time in milliseconds (6 seconds)
  const TOTAL_LOADING_TIME = 6000;
  
  // Interval time for progress updates (smaller for smoother animation)
  const PROGRESS_UPDATE_INTERVAL = 40;
  
  // Progress increment per interval
  const progressIncrement = PROGRESS_UPDATE_INTERVAL / TOTAL_LOADING_TIME;
  
  // Handle completion - separated to fix render errors
  const handleCompletion = useCallback(async () => {
    // Save all onboarding data to profile
    await saveAllOnboardingData();
    
    // Then navigate to sign up
    navigateToSignUp();
  }, []);
  
  useEffect(() => {
    // Start progress animation
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: TOTAL_LOADING_TIME,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    
    // Trigger initial haptic feedback when loading starts
    triggerLightImpact();
    
    // Update progress percentage at regular intervals
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + progressIncrement;
        const oldPercent = Math.floor(prevProgress * 100);
        const newPercent = Math.floor(newProgress * 100);

        // Immersive haptic pattern:
        if (newPercent !== oldPercent) {
          if (newPercent === 0) {
            // Initial heavy thump + light tap burst
            triggerHeavyImpact();
            setTimeout(triggerLightImpact, 100);
            setTimeout(triggerLightImpact, 200);
          } else if (newPercent === 25 || newPercent === 75) {
            // Triple medium taps at quarter points
            triggerImpact();
            setTimeout(triggerImpact, 75);
            setTimeout(triggerImpact, 150);
          } else if (newPercent === 50) {
            // Success notification at halfway
            triggerSuccess();
          } else if (newPercent === 100) {
            // Final success celebration
            triggerSuccess();
          } else if (newPercent % 10 === 0) {
            // Light tick at every 10%
            triggerLightImpact();
          } else {
            // Subtle feedback for each percent
            triggerSelection();
          }
        }
        
        if (newProgress >= 1) {
          clearInterval(interval);
          return 1;
        }
        return newProgress;
      });
    }, PROGRESS_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [progressIncrement]);
  
  // Watch for progress completion and handle navigation
  useEffect(() => {
    if (progress >= 1) {
      handleCompletion();
    }
  }, [progress, handleCompletion]);
  
  // Update percentage display
  useEffect(() => {
    setPercentage(Math.floor(progress * 100));
    
    // Update the current phase based on progress
    const phaseIndex = Math.min(
      Math.floor(progress * loadingPhases.length),
      loadingPhases.length - 1
    );
    
    if (phaseIndex !== currentPhaseIndex) {
      setCurrentPhaseIndex(phaseIndex);
      triggerSelection(); // Haptic feedback when message changes
    }
  }, [progress, currentPhaseIndex, loadingPhases.length]);
  
  // Calculate the progress stroke dash offset
  const progressStrokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>Setting up your experience</ThemedText>
          <ThemedText style={styles.subtitle}>Please wait while we prepare your personalized content</ThemedText>
          
          {/* Circular Progress Bar */}
          <View style={styles.progressContainer}>
            <Svg
              width={CIRCLE_SIZE}
              height={CIRCLE_SIZE}
            >
              <Defs>
                <LinearGradient
                  id="grad"
                  gradientUnits="userSpaceOnUse"
                  x1={0}
                  y1={CIRCLE_RADIUS}
                  x2={CIRCLE_SIZE}
                  y2={CIRCLE_RADIUS}
                >
                  <Stop offset="0%" stopColor="#FF8C00" />
                  <Stop offset="50%" stopColor="#FFA500" />
                  <Stop offset="100%" stopColor="#FFD700" />
                </LinearGradient>
              </Defs>
              {/* Background Circle */}
              <Circle
                cx={CIRCLE_RADIUS}
                cy={CIRCLE_RADIUS}
                r={CIRCLE_RADIUS - CIRCLE_STROKE_WIDTH / 2}
                strokeWidth={CIRCLE_STROKE_WIDTH}
                stroke={colorScheme === 'dark' ? '#252525' : '#F5F5F7'}
                fill="transparent"
              />
              
              {/* Progress Circle */}
              <Circle
                cx={CIRCLE_RADIUS}
                cy={CIRCLE_RADIUS}
                r={CIRCLE_RADIUS - CIRCLE_STROKE_WIDTH / 2}
                strokeWidth={CIRCLE_STROKE_WIDTH}
                stroke="url(#grad)"
                fill="transparent"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={progressStrokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${CIRCLE_RADIUS} ${CIRCLE_RADIUS})`}
              />
            </Svg>
            {/* Overlay percentage text for best support */}
            <View style={styles.percentageContainer}>
              <ThemedText style={styles.percentageText}>
                {percentage}%
              </ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.loadingText}>
            {loadingPhases[currentPhaseIndex]}
          </ThemedText>
        </View>
      </TransitionWrapper>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  title: {
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 50,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  progressContainer: {
    position: 'relative',
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  percentageContainer: {
    // fill entire progress circle and ensure text layers above SVG
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -1,
    includeFontPadding: false,
  },
  loadingText: {
    marginTop: 30,
    fontSize: 18,
    opacity: 0.8,
    textAlign: 'center',
  },
});

export default function Page() {
  return <LoadingScreen />;
} 