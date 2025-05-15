import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { triggerImpact } from '../../utils/haptics';
import { LEARNING_SOURCE_KEY, saveProfileData } from '../../utils/profileStorage';

// Define learning source interface
interface LearningSource {
  id: string;
  name: string;
  icon: React.ReactNode; // Component for the icon
}

export default function ArabicLearningSource() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  const screenHeight = Dimensions.get('window').height;
  
  // Update progress when component is mounted
  useEffect(() => {
    setProgressByScreen('arabic-learning-source');
  }, []);
  
  const handleSourceSelect = useCallback((sourceId: string) => {
    // Add haptic feedback
    triggerImpact();
    
    // Find the selected source
    const selectedSource = LEARNING_SOURCES.find(source => source.id === sourceId);
    
    // Save the selection
    if (selectedSource) {
      saveProfileData(LEARNING_SOURCE_KEY, selectedSource.name)
        .then(() => {
          console.log('Learning source saved:', selectedSource.name);
        })
        .catch(error => {
          console.error('Error saving learning source:', error);
        });
    }
    
    // Navigate to next screen (arabic level)
    router.push('/(onboarding)/arabic-level');
  }, []);

  // Accent color from design tokens
  const accentColor = '#E5903A';
  
  // Learning sources with appropriate icons
  const LEARNING_SOURCES: LearningSource[] = [
    { 
      id: 'school', 
      name: 'School', 
      icon: <Ionicons name="school" size={22} color={accentColor} />
    },
    { 
      id: 'language-school', 
      name: 'Language School', 
      icon: <MaterialCommunityIcons name="book-education" size={22} color={accentColor} />
    },
    { 
      id: 'university', 
      name: 'College/University', 
      icon: <Ionicons name="school-outline" size={22} color={accentColor} />
    },
    { 
      id: 'personal-tutor', 
      name: 'Personal Tutor', 
      icon: <Ionicons name="person" size={22} color={accentColor} />
    },
    { 
      id: 'religious', 
      name: 'Religious Institution', 
      icon: <FontAwesome5 name="mosque" size={20} color={accentColor} />
    },
    { 
      id: 'self-taught', 
      name: 'Self-taught', 
      icon: <MaterialCommunityIcons name="book-open-variant" size={22} color={accentColor} />
    },
    { 
      id: 'none', 
      name: 'No prior learning', 
      icon: <MaterialCommunityIcons name="book-open-page-variant" size={22} color={accentColor} />
    }
  ];

  // Calculate header height - this varies by platform
  const headerHeight = Platform.OS === 'ios' ? (insets.top + 70) : 70;
  const itemSpacing = 8;
  
  // Calculate the appropriate box height to fit all options
  const availableHeight = screenHeight - headerHeight - 140; // Account for title and bottom spacing
  const boxHeight = Math.min(Math.max((availableHeight / LEARNING_SOURCES.length) - itemSpacing, 45), 60);

  return (
    <ThemedView style={styles.container}>
      <TransitionWrapper>
        {/* Add a spacer to push content below the header */}
        <View style={{ height: headerHeight }} />
        
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>Have you learned Arabic before?</ThemedText>
          <ThemedText style={styles.subtitle}>Select where you've studied or learned</ThemedText>
          
          {/* Sources list */}
          <View style={styles.sourcesList}>
            {LEARNING_SOURCES.map((source) => (
              <TouchableOpacity
                key={source.id}
                style={[
                  styles.sourceBox,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colorScheme === 'dark' ? '#333333' : '#EBEBEB',
                    marginBottom: itemSpacing,
                    height: boxHeight,
                  }
                ]}
                onPress={() => handleSourceSelect(source.id)}
              >
                <View style={styles.sourceBoxContent}>
                  <View style={[
                    styles.iconContainer, 
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                      width: boxHeight * 0.7,
                      height: boxHeight * 0.7,
                    }
                  ]}>
                    {source.icon}
                  </View>
                  <View style={styles.sourceTextContainer}>
                    <ThemedText style={styles.sourceName}>{source.name}</ThemedText>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
  },
  sourcesList: {
    flex: 1,
  },
  sourceBox: {
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sourceBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceTextContainer: {
    flex: 1,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '600',
  },
}); 