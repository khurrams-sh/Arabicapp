import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerSelection, triggerImpact } from '../../utils/haptics';
import { CHALLENGES_KEY, saveProfileData } from '../../utils/profileStorage';

// Define challenge interface
interface Challenge {
  id: string;
  name: string;
}

// Simplified challenges list with no descriptions
const CHALLENGES: Challenge[] = [
  { id: 'finding_words', name: 'Sometimes I can\'t find the words' },
  { id: 'nervous', name: 'I am shy or nervous' },
  { id: 'no_time', name: 'I don\'t have time to practice' },
  { id: 'no_partner', name: 'I have no one to practice with' },
  { id: 'pronunciation', name: 'My pronunciation is not good' },
  { id: 'grammar', name: 'I make grammar mistakes' },
  { id: 'understanding', name: 'I can\'t understand what people say' },
];

export default function Challenges() {
  // Track selected challenge (now a single string instead of array)
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  
  // Accent color from design tokens
  const accentColor = '#E5903A';
  
  // Ensure correct progress when this screen appears
  useEffect(() => {
    setProgressByScreen('challenges');
  }, []);
  
  // Set the selected challenge (now single selection)
  const selectChallenge = (challengeId: string) => {
    // Add haptic feedback
    triggerSelection();
    
    // Set the chosen challenge
    setSelectedChallenge(challengeId);
    
    // Get the challenge name
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    
    // Save the selected challenge
    if (challenge) {
      saveProfileData(CHALLENGES_KEY, [challenge.name])
        .then(() => {
          console.log('Challenge saved:', challenge.name);
        })
        .catch(error => {
          console.error('Error saving challenge:', error);
        });
    }
    
    // Automatically navigate forward after a brief delay
    setTimeout(() => {
      navigateToNext();
    }, 50);
  };
  
  const navigateToNext = useCallback(() => {
    // Add haptic feedback
    triggerImpact();
    
    // Navigate to next screen
    router.push('/(onboarding)/daily-goal' as never);
  }, []);

  return (
    <ThemedView style={[styles.container, { paddingTop: 120, paddingBottom: insets.bottom }]}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>What's your main challenge in Arabic?</ThemedText>
          <ThemedText style={styles.subtitle}>Understanding your challenges helps us focus on areas you need most</ThemedText>
          
          {/* Challenges grid layout */}
          <View style={styles.challengesList}>
              {CHALLENGES.map((challenge) => {
              const isSelected = selectedChallenge === challenge.id;
                return (
                  <TouchableOpacity
                    key={challenge.id}
                    style={[
                      styles.challengeItem,
                      { 
                        backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                        borderWidth: 1,
                        borderColor: isSelected ? accentColor : colorScheme === 'dark' ? '#333333' : '#EBEBEB',
                      }
                    ]}
                  onPress={() => selectChallenge(challenge.id)}
                  >
                      <ThemedText style={styles.challengeName}>{challenge.name}</ThemedText>
                    
                    {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={accentColor} style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
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
  },
  title: {
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
  },
  challengesList: {
    flex: 1,
  },
  challengeItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  checkIcon: {
    marginLeft: 10,
  },
}); 