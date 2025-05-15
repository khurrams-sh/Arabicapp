import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerSelection, triggerImpact } from '../../utils/haptics';
import { NATIVE_LANGUAGE_KEY, saveProfileData } from '../../utils/profileStorage';

// Define language interface
interface Language {
  code: string;
  name: string;
  flag: string;
}

// Common languages with their flags
const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'fa', name: 'Farsi', flag: '🇮🇷' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
];

export default function LanguageSelection() {
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  
  // Ensure correct progress when this screen appears
  useEffect(() => {
    // Set progress for this screen
    setProgressByScreen('language-selection');
  }, []);
  
  // Accent color from design tokens
  const accentColor = '#E5903A';
  
  // Filter languages based on search query
  const filteredLanguages = LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleLanguageSelect = useCallback((language: Language) => {
    // Add haptic feedback
    triggerImpact();
    
    // Save the selected language
    saveProfileData(NATIVE_LANGUAGE_KEY, language.name)
      .then(() => {
        console.log('Language saved:', language.name);
      })
      .catch(error => {
        console.error('Error saving language:', error);
      });
    
    // Navigate to next screen (progress will be updated when it mounts)
    router.push('/(onboarding)/dialect-selection');
  }, []);

  return (
    <ThemedView style={[styles.container, { paddingTop: 120, paddingBottom: insets.bottom }]}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>What's your native language?</ThemedText>
          <ThemedText style={styles.subtitle}>Select the language that you speak natively</ThemedText>
          
          {/* Search bar */}
          <View style={[
            styles.searchContainer,
            { backgroundColor: colorScheme === 'dark' ? '#333333' : '#F5F5F7' }
          ]}>
            <Ionicons 
              name="search" 
              size={20} 
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
              style={styles.searchIcon} 
            />
            <TextInput
              style={[
                styles.searchInput, 
                { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }
              ]}
              placeholder="Search for your language"
              placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#777777'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* Language list */}
          <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
            {filteredLanguages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageBox,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                    borderRadius: 12,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colorScheme === 'dark' ? '#333333' : '#EBEBEB'
                  }
                ]}
                onPress={() => handleLanguageSelect(language)}
              >
                <View style={styles.languageBoxContent}>
                  <View style={[
                    styles.flagContainer,
                    { backgroundColor: colorScheme === 'dark' ? '#333333' : '#E8E8ED' }
                  ]}>
                    <ThemedText style={styles.languageFlag}>{language.flag}</ThemedText>
                  </View>
                  <ThemedText style={styles.languageName}>{language.name}</ThemedText>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  languageList: {
    flex: 1,
  },
  languageBox: {
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  languageBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    width: '100%',
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
}); 