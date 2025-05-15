import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerImpact } from '../../utils/haptics';

export default function Welcome() {
  // Define accent color according to design tokens
  const accentColor = '#E5903A';
  const { setProgressByScreen } = useOnboarding();

  // Reset progress when entering welcome screen
  useEffect(() => {
    // Reset to step 0 with no progress showing
    setProgressByScreen('welcome');
  }, []);

  const handleGetStarted = () => {
    // Add haptic feedback
    triggerImpact();
    
    // Set progress for next screen before navigating
    setProgressByScreen('language-selection');
    
    // Navigate directly - our improved transitions will handle the animation
    router.push('/(onboarding)/language-selection');
  };

  const handleSignIn = () => {
    // Add haptic feedback
    triggerImpact();
    
    // Navigate to sign in screen
    router.push('/(auth)/sign-in');
  };

  // Welcome screen is clean without any header 
  return (
    <ThemedView style={styles.container}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>Welcome to Saylo</ThemedText>
          <ThemedText style={styles.subtitle}>
            Your personalized language learning companion
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: accentColor }]}
            onPress={handleGetStarted}
          >
            <ThemedText style={styles.buttonText}>Get Started</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.signInButton]}
            onPress={handleSignIn}
          >
            <ThemedText style={[styles.buttonText, { color: accentColor }]}>Sign In</ThemedText>
          </TouchableOpacity>
        </View>
      </TransitionWrapper>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 32,
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    opacity: 0.8,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E5903A',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 