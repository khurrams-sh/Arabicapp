import React, { useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';
import * as StoreReview from 'expo-store-review';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerImpact } from '../../utils/haptics';

export default function RateExperienceScreen() {
  const { setProgressByScreen } = useOnboarding();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  // Animation values for each star
  const star1Opacity = useSharedValue(0);
  const star2Opacity = useSharedValue(0);
  const star3Opacity = useSharedValue(0);
  const star4Opacity = useSharedValue(0);
  const star5Opacity = useSharedValue(0);

  // Animated styles for stars
  const star1Style = useAnimatedStyle(() => {
    return {
      opacity: star1Opacity.value,
      transform: [{ scale: star1Opacity.value }]
    };
  });

  const star2Style = useAnimatedStyle(() => {
    return {
      opacity: star2Opacity.value,
      transform: [{ scale: star2Opacity.value }]
    };
  });

  const star3Style = useAnimatedStyle(() => {
    return {
      opacity: star3Opacity.value,
      transform: [{ scale: star3Opacity.value }]
    };
  });

  const star4Style = useAnimatedStyle(() => {
    return {
      opacity: star4Opacity.value,
      transform: [{ scale: star4Opacity.value }]
    };
  });

  const star5Style = useAnimatedStyle(() => {
    return {
      opacity: star5Opacity.value,
      transform: [{ scale: star5Opacity.value }]
    };
  });

  // Trigger the native review and animate stars when component mounts
  useEffect(() => {
    // Update the progress bar
    setProgressByScreen('rate-experience');

    // First animate stars in sequence
    setTimeout(() => {
      star1Opacity.value = withSpring(1, { damping: 10 });
      star2Opacity.value = withDelay(150, withSpring(1, { damping: 10 }));
      star3Opacity.value = withDelay(300, withSpring(1, { damping: 10 }));
      star4Opacity.value = withDelay(450, withSpring(1, { damping: 10 }));
      star5Opacity.value = withDelay(600, withSpring(1, { damping: 10 }));
      
      // Show store review after all stars have appeared
      setTimeout(async () => {
        try {
          // Check if requesting a review is available
          const isAvailable = await StoreReview.isAvailableAsync();
          if (isAvailable) {
            StoreReview.requestReview();
          }
        } catch (error) {
          console.log('Error requesting review:', error);
        }
      }, 800); // Wait additional time after the last star animation started
    }, 300);
  }, []);

  const handleContinue = () => {
    triggerImpact();
    router.push('/(onboarding)/loading');
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: 120, paddingBottom: insets.bottom }]}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>Give Us a Rating</ThemedText>
          <ThemedText style={styles.subtitle}>This helps us deliver more of what you need.</ThemedText>
          
          <View style={styles.starsContainer}>
            <Animated.Text style={[styles.star, star1Style]}>⭐</Animated.Text>
            <Animated.Text style={[styles.star, star2Style]}>⭐</Animated.Text>
            <Animated.Text style={[styles.star, star3Style]}>⭐</Animated.Text>
            <Animated.Text style={[styles.star, star4Style]}>⭐</Animated.Text>
            <Animated.Text style={[styles.star, star5Style]}>⭐</Animated.Text>
          </View>

          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: ACCENT_COLOR }]}
            onPress={handleContinue}
          >
            <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
          </TouchableOpacity>
        </View>
      </TransitionWrapper>
    </ThemedView>
  );
}

const ACCENT_COLOR = '#E5903A';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 48,
  },
  star: {
    fontSize: 40,
    marginHorizontal: 8,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 32,
    opacity: 0.8,
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 