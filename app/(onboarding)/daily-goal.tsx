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
import { DAILY_GOAL_KEY, saveProfileData } from '../../utils/profileStorage';

// Define goal interface
interface Goal {
  id: string;
  minutes: number;
  display: string;
  emoji: string;
}

// Daily goal options
const GOALS: Goal[] = [
  { id: 'goal_5', minutes: 5, display: '5 min / day', emoji: '☕️' }, // Coffee break
  { id: 'goal_10', minutes: 10, display: '10 min / day', emoji: '🚶' }, // Quick walk
  { id: 'goal_15', minutes: 15, display: '15 min / day', emoji: '📱' }, // Social media time
  { id: 'goal_30', minutes: 30, display: '30 min / day', emoji: '🧠' }, // Good brain workout
  { id: 'goal_40', minutes: 40, display: '40 min / day', emoji: '🏆' }, // Achievement
];

export default function DailyGoal() {
  // Track selected goal
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  
  // Accent color from design tokens
  const accentColor = '#E5903A';
  
  // Ensure correct progress when this screen appears
  useEffect(() => {
    setProgressByScreen('daily-goal');
  }, []);
  
  // Set the selected goal
  const selectGoal = (goalId: string) => {
    // Add haptic feedback
    triggerSelection();
    
    // Set the chosen goal
    setSelectedGoal(goalId);
    
    // Find the selected goal object
    const selectedGoalObj = GOALS.find(goal => goal.id === goalId);
    
    if (selectedGoalObj) {
      // Save the goal minutes
      saveProfileData(DAILY_GOAL_KEY, selectedGoalObj.minutes)
        .then(() => {
          console.log('Daily goal saved:', selectedGoalObj.minutes);
        })
        .catch(error => {
          console.error('Error saving daily goal:', error);
        });
    }
    
    // Automatically navigate forward after a brief delay
    setTimeout(() => {
      navigateToNext();
    }, 150);
  };
  
  const navigateToNext = useCallback(() => {
    // Add haptic feedback
    triggerImpact();
    
    // Navigate to goal confirmation screen instead of your-name
    router.push('/(onboarding)/goal-confirmation' as never);
  }, []);

  return (
    <ThemedView style={[styles.container, { paddingTop: 120, paddingBottom: insets.bottom }]}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>What is your daily learning goal?</ThemedText>
          
          <ThemedText style={styles.description}>
            Setting a realistic daily time commitment helps maintain consistency in your language learning journey.
          </ThemedText>
          
          {/* Goals grid layout */}
          <View style={styles.goalsList}>
            {GOALS.map((goal) => {
              const isSelected = selectedGoal === goal.id;
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalItem,
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                      borderWidth: 1,
                      borderColor: isSelected ? accentColor : colorScheme === 'dark' ? '#333333' : '#EBEBEB',
                    }
                  ]}
                  onPress={() => selectGoal(goal.id)}
                >
                  <View style={styles.goalContent}>
                    <View style={[
                      styles.emojiContainer,
                      {
                        backgroundColor: isSelected 
                          ? accentColor 
                          : colorScheme === 'dark' ? '#333333' : '#E8E8ED',
                      }
                    ]}>
                      <ThemedText style={styles.emoji}>{goal.emoji}</ThemedText>
                    </View>
                    <ThemedText style={styles.goalDisplay}>{goal.display}</ThemedText>
                  </View>
                  
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
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 24,
    lineHeight: 22,
  },
  goalsList: {
    flex: 1,
  },
  goalItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
  },
  goalDisplay: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 10,
  },
}); 