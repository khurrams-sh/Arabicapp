import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme, Platform, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerSelection, triggerImpact } from '../../utils/haptics';
import { INTERESTS_KEY, saveProfileData } from '../../utils/profileStorage';

// Define interest interface
interface Interest {
  id: string;
  name: string;
  icon: string;
}

// Expanded Arabic learning interests
const INTERESTS: Interest[] = [
  { 
    id: 'daily_conversations', 
    name: 'Daily', 
    icon: '💬'
  },
  { 
    id: 'business_professional', 
    name: 'Business', 
    icon: '💼'
  },
  { 
    id: 'quran_religious', 
    name: 'Religion', 
    icon: '🤲'
  },
  { 
    id: 'literature_poetry', 
    name: 'Literature', 
    icon: '📚'
  },
  { 
    id: 'modern_media', 
    name: 'Media', 
    icon: '🎬'
  },
  { 
    id: 'travel_tourism', 
    name: 'Travel', 
    icon: '✈️'
  },
  { 
    id: 'food_cuisine', 
    name: 'Food', 
    icon: '🍽️'
  },
  { 
    id: 'history_culture', 
    name: 'Culture', 
    icon: '🏛️'
  },
  { 
    id: 'arts_music', 
    name: 'Arts', 
    icon: '🎨'
  },
  { 
    id: 'science_tech', 
    name: 'Science', 
    icon: '🔬'
  },
  { 
    id: 'news_current_events', 
    name: 'News', 
    icon: '📰'
  },
  { 
    id: 'social_media', 
    name: 'Social', 
    icon: '📱'
  },
  { 
    id: 'health_wellness', 
    name: 'Health', 
    icon: '🧘‍♂️'
  },
  { 
    id: 'education_learning', 
    name: 'Education', 
    icon: '🎓'
  }
];

export default function InterestsSelection() {
  // Track selected interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  
  // Accent color from design tokens
  const accentColor = '#E5903A';
  
  // Background color based on theme
  const backgroundColor = colorScheme === 'dark' ? '#151718' : '#FFFFFF';
  
  // Ensure correct progress when this screen appears
  useEffect(() => {
    setProgressByScreen('interests');
  }, []);
  
  // Calculate the height needed for the progress bar and safe area
  const progressBarHeight = 44;
  const topSpacing = insets.top + progressBarHeight + 12; // Adds some padding below progress bar
  
  // Toggle interest selection
  const toggleInterest = (interestId: string) => {
    // Add haptic feedback
    triggerSelection();
    
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };
  
  const navigateToNext = useCallback(() => {
    // Add haptic feedback
    triggerImpact();
    
    // Get the names of selected interests
    const selectedInterestNames = selectedInterests.map(id => {
      const interest = INTERESTS.find(item => item.id === id);
      return interest ? interest.name : '';
    }).filter(name => name !== '');
    
    // Save selected interests
    saveProfileData(INTERESTS_KEY, selectedInterestNames)
      .then(() => {
        console.log('Interests saved:', selectedInterestNames);
      })
      .catch(error => {
        console.error('Error saving interests:', error);
      });
    
    // Navigate to next screen
    router.push('/(onboarding)/challenges' as never);
  }, [selectedInterests]);

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <TransitionWrapper>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: topSpacing }]}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.contentContainer}>
            <ThemedText type="title" style={styles.title}>What topics interest you?</ThemedText>
            <ThemedText style={styles.subtitle}>Select all that apply</ThemedText>
            
            {/* Interests grid - 2 columns */}
            <View style={styles.interestsGrid}>
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <TouchableOpacity
                    key={interest.id}
                    style={[
                      styles.interestBox,
                      { 
                        backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                        borderWidth: 1,
                        borderColor: isSelected ? accentColor : colorScheme === 'dark' ? '#333333' : '#EBEBEB',
                      }
                    ]}
                    onPress={() => toggleInterest(interest.id)}
                  >
                    <View style={styles.interestBoxContent}>
                      <View style={[
                        styles.iconContainer, 
                        { 
                          backgroundColor: isSelected 
                          ? accentColor 
                            : colorScheme === 'dark' ? '#333333' : '#E8E8ED'
                        }
                      ]}>
                        <ThemedText style={styles.interestIcon}>{interest.icon}</ThemedText>
                      </View>
                      <View style={styles.textContainer}>
                        <ThemedText 
                          style={styles.interestName}
                          numberOfLines={1}
                        >
                          {interest.name}
                        </ThemedText>
                      </View>
                      {isSelected && (
                        <Ionicons 
                          name="checkmark-circle" 
                          size={22} 
                          color={accentColor}
                          style={styles.checkmark}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* Add bottom padding to ensure all content is visible */}
            <View style={{ height: 20 }} />
            </View>
          </ScrollView>
          
        {/* Fixed bottom section with button - respects safe areas */}
        <View style={[
          styles.bottomContainer,
          { 
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: backgroundColor
          }
        ]}>
          {/* Continue button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              { 
                backgroundColor: accentColor,
                opacity: selectedInterests.length > 0 ? 1 : 0.5 
              }
            ]}
            onPress={navigateToNext}
            disabled={selectedInterests.length === 0}
          >
            <ThemedText style={styles.continueButtonText}>
              Continue
            </ThemedText>
          </TouchableOpacity>
        </View>
      </TransitionWrapper>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Space for bottom container
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: '800',
    fontSize: 26,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  interestBox: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  interestBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 14,
    minHeight: 70,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
  },
  interestIcon: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 4,
    alignItems: 'flex-start',
  },
  interestName: {
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
  },
  checkmark: {
    position: 'absolute',
    right: 12,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
}); 