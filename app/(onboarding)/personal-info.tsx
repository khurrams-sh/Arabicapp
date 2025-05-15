import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Keyboard, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';

export default function PersonalInfo() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { setProgressByScreen } = useOnboarding();
  const colorScheme = useColorScheme();
  
  // Set progress to 100% (final step)
  useEffect(() => {
    setProgressByScreen('personal-info');
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleContinue = () => {
    // Validate inputs if needed
    if (name.trim().length > 0) {
      // Navigate to the main app
      router.push('/(tabs)' as any);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={[styles.container, { paddingTop: 120, paddingBottom: insets.bottom }]}>
        <TransitionWrapper>
          <View style={styles.contentContainer}>
            <ThemedText type="title" style={styles.title}>Tell us about yourself</ThemedText>
            <ThemedText style={styles.subtitle}>
              This information helps us personalize your learning experience
            </ThemedText>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>What should we call you?</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F5',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' 
                  }
                ]}
                placeholder="Your name"
                placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#777777'}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>How old are you? (optional)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#252525' : '#F5F5F5',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' 
                  }
                ]}
                placeholder="Your age"
                placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#777777'}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </View>
          </View>
          
          {!keyboardVisible && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  { opacity: name.trim().length === 0 ? 0.5 : 1 }
                ]}
                onPress={handleContinue}
                disabled={name.trim().length === 0}
              >
                <ThemedText style={styles.continueButtonText}>
                  Continue
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
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
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  buttonContainer: {
    paddingVertical: 16,
  },
  continueButton: {
    backgroundColor: '#E5903A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 