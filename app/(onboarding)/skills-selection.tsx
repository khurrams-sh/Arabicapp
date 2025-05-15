import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerSelection, triggerImpact } from '../../utils/haptics';
import { SKILLS_KEY, saveProfileData } from '../../utils/profileStorage';

// Define learning reason interface
interface LearningReason {
  id: string;
  name: string;
  icon: string;
}

// Simplified list of reasons for learning Arabic - 7 options to fit on screen
const REASONS: LearningReason[] = [
  { 
    id: 'career', 
    name: 'Advance my career', 
    icon: '💼'
  },
  { 
    id: 'skills', 
    name: 'Learn new skills', 
    icon: '🧠'
  },
  { 
    id: 'education', 
    name: 'Support my education', 
    icon: '📚'
  },
  { 
    id: 'travel', 
    name: 'Prepare for travel', 
    icon: '✈️'
  },
  { 
    id: 'family', 
    name: 'Chat with friends and family', 
    icon: '👪'
  },
  { 
    id: 'religion', 
    name: 'Religious purposes', 
    icon: '🕌'
  },
  { 
    id: 'other', 
    name: 'Other', 
    icon: '···'
  }
];

export default function WhyLearnArabic() {
  // Track selected reasons
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  
  // Accent color from design tokens
  const accentColor = '#E5903A';
  
  // Background color based on theme
  const backgroundColor = colorScheme === 'dark' ? '#151718' : '#FFFFFF';
  
  // Ensure correct progress when this screen appears
  useEffect(() => {
    setProgressByScreen('skills-selection');
  }, []);
  
  // Toggle reason selection
  const toggleReason = (reasonId: string) => {
    // Add haptic feedback
    triggerSelection();
    
    setSelectedReasons(prev => {
      if (prev.includes(reasonId)) {
        return prev.filter(id => id !== reasonId);
      } else {
        return [...prev, reasonId];
      }
    });
  };
  
  const handleContinue = useCallback(() => {
    // Add haptic feedback
    triggerImpact();
    
    // Get names of selected reasons
    const selectedReasonNames = selectedReasons.map(id => {
      const reason = REASONS.find(r => r.id === id);
      return reason ? reason.name : '';
    }).filter(name => name !== '');
    
    // Save selected reasons
    saveProfileData(SKILLS_KEY, selectedReasonNames)
      .then(() => {
        console.log('Skills saved:', selectedReasonNames);
      })
      .catch(error => {
        console.error('Error saving skills:', error);
      });
    
    router.push('/(onboarding)/interests' as never);
  }, [selectedReasons]);
  
  // Calculate the height needed for the progress bar and safe area
  const progressBarHeight = 44;
  const topSpacing = insets.top + progressBarHeight + 12; // Adds some padding below progress bar

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <TransitionWrapper>
        {/* Main content with safe area spacing */}
        <View style={[styles.mainContainer, { paddingTop: topSpacing }]}>
        <View style={styles.contentContainer}>
            <ThemedText type="title" style={styles.title}>Why do you want to learn Arabic?</ThemedText>
            <ThemedText style={styles.subtitle}>Select all that apply</ThemedText>
          
            {/* Simple vertical list of reasons with fixed heights */}
            <View style={styles.reasonsContainer}>
              {REASONS.map((reason) => {
                const isSelected = selectedReasons.includes(reason.id);
              return (
                <TouchableOpacity
                    key={reason.id}
                  style={[
                      styles.reasonBox,
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                      borderWidth: 1,
                      borderColor: isSelected ? accentColor : colorScheme === 'dark' ? '#333333' : '#EBEBEB',
                    }
                  ]}
                    onPress={() => toggleReason(reason.id)}
                >
                    <View style={styles.reasonBoxContent}>
                    <View style={[
                      styles.iconContainer, 
                        { 
                          backgroundColor: isSelected 
                        ? accentColor 
                            : colorScheme === 'dark' ? '#333333' : '#E8E8ED',
                        }
                    ]}>
                        <ThemedText style={styles.reasonIcon}>{reason.icon}</ThemedText>
                      </View>
                      <ThemedText style={styles.reasonName}>{reason.name}</ThemedText>
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
          </View>
          </View>
          
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
                opacity: selectedReasons.length > 0 ? 1 : 0.5,
              }
            ]}
            onPress={handleContinue}
            disabled={selectedReasons.length === 0}
          >
            <ThemedText style={styles.continueButtonText}>
              {selectedReasons.length === 0 ? "Please select at least one reason" : "Continue"}
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
  mainContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: '800',
    fontSize: 26,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.7,
    marginBottom: 10,
  },
  reasonsContainer: {
    width: '100%',
  },
  reasonBox: {
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  reasonBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: '100%',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reasonIcon: {
    fontSize: 18,
  },
  reasonName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  checkmark: {
    marginLeft: 8,
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