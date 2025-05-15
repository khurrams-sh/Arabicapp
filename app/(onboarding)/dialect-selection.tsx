import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerSelection, triggerImpact } from '../../utils/haptics';
import { DIALECT_KEY, saveProfileData } from '../../utils/profileStorage';

// Define dialect interface
interface Dialect {
  id: string;
  name: string;
  flag: string;
  description: string;
}

// Arabic dialects with appropriate flags/emoji
const DIALECTS: Dialect[] = [
  { 
    id: 'egyptian', 
    name: 'Egyptian Arabic', 
    flag: '🇪🇬',
    description: 'The most widely understood dialect due to Egypt\'s media influence'
  },
  { 
    id: 'gulf', 
    name: 'Gulf Arabic', 
    flag: '🇸🇦',
    description: 'Spoken in Saudi Arabia, UAE, Kuwait, and other Gulf countries'
  },
  { 
    id: 'levantine', 
    name: 'Levantine Arabic', 
    flag: '🇱🇧',
    description: 'Spoken in Jordan, Lebanon, Syria, and Palestine'
  },
  { 
    id: 'classical', 
    name: 'Classical Arabic', 
    flag: '🏛️',
    description: 'Formal Arabic used in literature, media, and formal settings'
  }
];

export default function DialectSelection() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  
  // Ensure correct progress when this screen appears
  useEffect(() => {
    setProgressByScreen('dialect-selection');
  }, []);
  
  // Accent color from design tokens
  const accentColor = '#E5903A';
  
  const handleDialectSelect = useCallback((dialectId: string) => {
    // Add haptic feedback
    triggerImpact();
    
    // Get the full dialect object
    const selectedDialect = DIALECTS.find(dialect => dialect.id === dialectId);
    
    // Save selected dialect
    if (selectedDialect) {
      saveProfileData(DIALECT_KEY, selectedDialect.name)
        .then(() => {
          console.log('Dialect saved:', selectedDialect.name);
        })
        .catch(error => {
          console.error('Error saving dialect:', error);
        });
    }
    
    // Navigate to learning source screen instead of arabic level
    router.push('/(onboarding)/arabic-learning-source');
  }, []);

  return (
    <ThemedView style={[styles.container, { paddingTop: 120, paddingBottom: insets.bottom }]}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>Which Arabic dialect interests you?</ThemedText>
          <ThemedText style={styles.subtitle}>Each dialect has unique vocabulary and pronunciation</ThemedText>
          
          {/* Dialect list */}
          <ScrollView style={styles.dialectList} showsVerticalScrollIndicator={false}>
            {DIALECTS.map((dialect) => (
              <TouchableOpacity
                key={dialect.id}
                style={[
                  styles.dialectBox,
                  { backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7' }
                ]}
                onPress={() => handleDialectSelect(dialect.id)}
                activeOpacity={0.7}
              >
                <View style={styles.dialectBoxContent}>
                  <View style={[
                    styles.flagContainer,
                    { backgroundColor: colorScheme === 'dark' ? '#333333' : '#E8E8ED' }
                  ]}>
                    <ThemedText style={styles.dialectFlag}>{dialect.flag}</ThemedText>
                  </View>
                  
                  <View style={styles.dialectTextContainer}>
                    <ThemedText style={styles.dialectName}>
                      {dialect.name}
                    </ThemedText>
                    <ThemedText style={styles.dialectDescription}>{dialect.description}</ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  dialectList: {
    flex: 1,
    marginBottom: 16,
  },
  dialectBox: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dialectBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  flagContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  dialectFlag: {
    fontSize: 38,
    lineHeight: 44,
  },
  dialectTextContainer: {
    flex: 1,
  },
  dialectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  dialectDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
}); 