import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, useColorScheme, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { triggerImpact } from '../../utils/haptics';
import { USER_NAME_KEY, saveProfileData } from '../../utils/profileStorage';

export default function YourName() {
  const [name, setName] = useState('');
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#151718' : '#FFFFFF';
  const { setProgressByScreen } = useOnboarding();
  
  // Accent color from design tokens
  const accentColor = '#E5903A';
  
  // Update progress when this screen appears
  useEffect(() => {
    setProgressByScreen('your-name');
  }, []);
  
  const handleContinue = useCallback(async () => {
    // Add haptic feedback
    triggerImpact();
    
    // Store the name using our profileStorage utility
    try {
      await saveProfileData(USER_NAME_KEY, name.trim());
    } catch (error) {
      console.error('Error saving user name:', error);
    }
    
    // Navigate to rating screen
    router.push('/(onboarding)/rate-experience' as never);
  }, [name]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <ThemedView style={[styles.container, { paddingTop: 120, paddingBottom: insets.bottom }]}>
        <TransitionWrapper>
          <View style={styles.contentContainer}>
            <ThemedText type="title" style={styles.title}>What's your name?</ThemedText>
            <ThemedText style={styles.subtitle}>We'll use this to personalize your experience</ThemedText>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.nameInput,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F7',
                    borderColor: colorScheme === 'dark' ? '#333333' : '#EBEBEB',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
                  }
                ]}
                placeholder="Your name"
                placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#777777'}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (name.trim().length > 0) {
                    handleContinue();
                  }
                }}
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.continueButton,
                { 
                  backgroundColor: accentColor,
                  opacity: name.trim().length > 0 ? 1 : 0.5,
                }
              ]}
              onPress={handleContinue}
              disabled={name.trim().length === 0}
            >
              <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
            </TouchableOpacity>
          </View>
        </TransitionWrapper>
      </ThemedView>
    </KeyboardAvoidingView>
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
  inputContainer: {
    marginBottom: 30,
  },
  nameInput: {
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontWeight: '500',
    height: 56,
  },
  continueButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 