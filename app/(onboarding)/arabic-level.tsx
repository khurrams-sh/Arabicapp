import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerImpact } from '../../utils/haptics';
import { ARABIC_LEVEL_KEY, saveProfileData } from '../../utils/profileStorage';

// Define level interface
interface Level {
  id: string;
  code: string;
  description: string;
}

// Arabic proficiency levels using CEFR standard
const LEVELS: Level[] = [
  { 
    id: 'a1', 
    code: 'A1',
    description: 'I\'m new to this language'
  },
  { 
    id: 'a2', 
    code: 'A2',
    description: 'I know a few sentences'
  },
  { 
    id: 'b1', 
    code: 'B1',
    description: 'I can manage simple conversations'
  },
  { 
    id: 'b2', 
    code: 'B2',
    description: 'I can communicate comfortably with native speakers'
  },
  { 
    id: 'c1', 
    code: 'C1',
    description: 'I\'m an expert'
  },
  { 
    id: 'c2', 
    code: 'C2',
    description: 'I\'m a native-level speaker'
  }
];

export default function ArabicLevel() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  const screenHeight = Dimensions.get('window').height;
  
  // Update progress when component is mounted
  useEffect(() => {
    setProgressByScreen('arabic-level');
  }, []);
  
  const handleLevelSelect = useCallback((level: Level) => {
    // Add haptic feedback
    triggerImpact();
    
    // Save the selected level
    saveProfileData(ARABIC_LEVEL_KEY, `${level.code} - ${level.description}`)
      .then(() => {
        console.log('Arabic level saved:', level.code);
      })
      .catch(error => {
        console.error('Error saving Arabic level:', error);
      });
    
    // Navigate to next screen (progress will be updated when it mounts)
    router.push('/(onboarding)/skills-selection');
  }, []);

  // Accent color from design tokens
  const accentColor = '#E5903A';
  
  // Calculate header height - this varies by platform
  const headerHeight = Platform.OS === 'ios' ? (insets.top + 70) : 70;
  const itemSpacing = 10;

  return (
    <ThemedView style={styles.container}>
      <TransitionWrapper>
        {/* Add a spacer to push content below the header */}
        <View style={{ height: headerHeight }} />
        
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>What's your Arabic level?</ThemedText>
          <ThemedText style={styles.subtitle}>This helps us personalize your lessons to match your current proficiency</ThemedText>
          
          {/* Level list - static view instead of ScrollView */}
          <View style={styles.levelList}>
            {LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelBox,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                    borderRadius: 12,
                    marginBottom: itemSpacing,
                    borderWidth: 1,
                    borderColor: colorScheme === 'dark' ? '#333333' : '#EBEBEB'
                  }
                ]}
                onPress={() => handleLevelSelect(level)}
              >
                <View style={styles.levelBoxContent}>
                  <View style={[
                    styles.levelCodeContainer,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#333333' : '#FFFFFF',
                    }
                  ]}>
                    <ThemedText style={[styles.levelCode, { color: accentColor }]}>
                      {level.code}
                    </ThemedText>
                  </View>
                  <View style={styles.levelTextContainer}>
                    <ThemedText style={styles.levelDescription}>
                      {level.description}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
    paddingBottom: 20,
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
  levelList: {
    flex: 1,
  },
  levelBox: {
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  levelBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  levelCodeContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelCode: {
    fontSize: 22,
    fontWeight: '700',
  },
  levelTextContainer: {
    flex: 1,
  },
  levelDescription: {
    fontSize: 16,
    fontWeight: '500',
  }
}); 