import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { Ionicons } from '@expo/vector-icons';
import { triggerImpact } from '../../utils/haptics';
import { BUSINESS_TOPICS_KEY, saveProfileData } from '../../utils/profileStorage';

// Define the business topics
interface BusinessTopic {
  id: string;
  name: string;
  icon: string;
}

// Business topics with appropriate emoji icons
const BUSINESS_TOPICS: BusinessTopic[] = [
  { id: 'interview', name: 'Interview', icon: '👥' },
  { id: 'presentations', name: 'Presentations', icon: '📊' },
  { id: 'foreign_partners', name: 'Foreign partners negotiations', icon: '🌐' },
  { id: 'meetings', name: 'Meetings', icon: '📝' },
  { id: 'conferences', name: 'Conferences', icon: '👥' },
  { id: 'networking', name: 'Effective networking', icon: '🔄' },
  { id: 'informal', name: 'Informal communication', icon: '🎭' },
];

// Accent color from design tokens
const ACCENT_COLOR = '#E5903A';

export default function BusinessTopicsSelection() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  
  // Ensure correct progress when this screen appears
  useEffect(() => {
    setProgressByScreen('business-topics-selection');
  }, []);
  
  const handleTopicToggle = useCallback((topicId: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  }, []);
  
  const handleContinue = useCallback(() => {
    // Add haptic feedback
    triggerImpact();
    
    // Get the names of selected topics
    const selectedTopicNames = selectedTopics.map(id => {
      const topic = BUSINESS_TOPICS.find(t => t.id === id);
      return topic ? topic.name : '';
    }).filter(name => name !== '');
    
    // Save selected business topics
    saveProfileData(BUSINESS_TOPICS_KEY, selectedTopicNames)
      .then(() => {
        console.log('Business topics saved:', selectedTopicNames);
      })
      .catch(error => {
        console.error('Error saving business topics:', error);
      });
    
    // Navigate to next screen (progress will be updated when it mounts)
    router.push('/(onboarding)/personal-info');
  }, [selectedTopics]);

  const isTopicSelected = (topicId: string) => {
    return selectedTopics.includes(topicId);
  };

  // Get the background and text colors based on color scheme
  const backgroundColor = colorScheme === 'dark' ? '#151718' : '#FFFFFF';
  const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  
  return (
    <ThemedView style={[styles.container, { paddingTop: 80, paddingBottom: insets.bottom }]}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>Which business topics interest you?</ThemedText>
          <ThemedText style={styles.subtitle}>Select the topics that are most relevant to your needs</ThemedText>
          
          {/* Business Topics list - styled like the reference image */}
          <ScrollView style={styles.topicsList} showsVerticalScrollIndicator={false}>
            {BUSINESS_TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicBox,
                  { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' },
                  isTopicSelected(topic.id) && { borderColor: ACCENT_COLOR, borderWidth: 2 }
                ]}
                onPress={() => handleTopicToggle(topic.id)}
                activeOpacity={0.7}
              >
                <View style={styles.topicContent}>
                  <View style={[
                    styles.iconContainer,
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#4A55EB' : '#E8EAFE'
                    }
                  ]}>
                    <ThemedText style={styles.topicIcon}>{topic.icon}</ThemedText>
                  </View>
                  
                  <ThemedText 
                    style={[
                      styles.topicName,
                      isTopicSelected(topic.id) && { color: ACCENT_COLOR, fontWeight: '700' }
                    ]}
                  >
                    {topic.name}
                  </ThemedText>
                  
                  {isTopicSelected(topic.id) && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24}
                      color={ACCENT_COLOR}
                      style={styles.selectedIcon}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: '#4A55EB' },
              selectedTopics.length === 0 && { opacity: 0.5 }
            ]}
            onPress={handleContinue}
            disabled={selectedTopics.length === 0}
          >
            <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
          </TouchableOpacity>
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
  topicsList: {
    flex: 1,
    marginBottom: 20,
  },
  topicBox: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  topicContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  topicIcon: {
    fontSize: 24,
  },
  topicName: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
  },
  selectedIcon: {
    marginLeft: 8,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 