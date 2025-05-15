import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { Ionicons } from '@expo/vector-icons';

// Define the topics
interface Topic {
  id: string;
  name: string;
  icon: string;
}

const TOPICS: Topic[] = [
  { id: 'greetings', name: 'Greetings', icon: '👋' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'food', name: 'Food', icon: '🍽️' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'culture', name: 'Culture', icon: '🏮' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'news', name: 'News', icon: '📰' },
  { id: 'health', name: 'Health', icon: '🏥' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'technology', name: 'Technology', icon: '💻' },
];

// Accent color from design tokens
const ACCENT_COLOR = '#E5903A';

export default function TopicSelection() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();

  // Ensure correct progress when this screen appears
  useEffect(() => {
    setProgressByScreen('topic-selection');
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
    // Navigate to next screen (progress will be updated when it mounts)
    router.push('/(onboarding)/personal-info');
  }, []);

  const isTopicSelected = (topicId: string) => {
    return selectedTopics.includes(topicId);
  };

  const renderTopicItem = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.topicBox,
        { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' },
        isTopicSelected(item.id) && { borderColor: ACCENT_COLOR, borderWidth: 2 }
      ]}
      onPress={() => handleTopicToggle(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.topicContent}>
        <View style={[
          styles.iconContainer,
          { 
            backgroundColor: colorScheme === 'dark' ? '#333333' : '#E8E8ED',
            ...(isTopicSelected(item.id) && { backgroundColor: ACCENT_COLOR })
          }
        ]}>
          <ThemedText style={styles.topicIcon}>{item.icon}</ThemedText>
        </View>
        
        <ThemedText 
          style={[
            styles.topicName,
            isTopicSelected(item.id) && { color: ACCENT_COLOR, fontWeight: '600' }
          ]}
          numberOfLines={1}
        >
          {item.name}
        </ThemedText>
        
        {isTopicSelected(item.id) && (
          <Ionicons 
            name="checkmark-circle" 
            size={22}
            color={ACCENT_COLOR}
            style={styles.selectedIcon}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: 80, paddingBottom: insets.bottom }]}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>What topics interest you most?</ThemedText>
          <ThemedText style={styles.subtitle}>Select topics to personalize your learning experience</ThemedText>

          {/* Topics Grid */}
          <FlatList
            data={TOPICS}
            renderItem={renderTopicItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            style={styles.topicsGrid}
          />

          {/* Continue Button */}
          <View style={styles.bottomContainer}>
            <ThemedText style={styles.selectedCount}>
              {selectedTopics.length} {selectedTopics.length === 1 ? 'topic' : 'topics'} selected
            </ThemedText>
            
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: ACCENT_COLOR },
                selectedTopics.length === 0 && { opacity: 0.5 }
              ]}
              onPress={handleContinue}
              disabled={selectedTopics.length === 0}
            >
              <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
            </TouchableOpacity>
            
            {selectedTopics.length === 0 && (
              <ThemedText style={styles.helperText}>
                Please select at least one topic to continue
              </ThemedText>
            )}
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
  topicsGrid: {
    flex: 1,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topicBox: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  topicContent: {
    padding: 14,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  topicIcon: {
    fontSize: 24,
  },
  topicName: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 6,
    flexShrink: 1,
  },
  selectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  selectedCount: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  continueButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 20,
  },
}); 