import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { triggerImpact } from '@/utils/haptics';
import { USER_NAME_KEY } from '@/utils/profileStorage';
import { AuthRoutes, OnboardingRoutes } from '@/types/routes';

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const accentColor = '#E5903A';
  const [name, setName] = useState('');

  // Load the name from AsyncStorage on component mount
  useEffect(() => {
    const loadName = async () => {
      try {
        const savedName = await AsyncStorage.getItem(USER_NAME_KEY);
        if (savedName) {
          setName(savedName);
        }
      } catch (error) {
        console.error('Error loading user name:', error);
      }
    };

    loadName();
  }, []);

  const signUpWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        // Apple sign-up logic remains the same
        // ...
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      // Error handling remains the same
      // ...
    }
  };

  const handleBackToWelcome = () => {
    triggerImpact();
    router.replace('/(onboarding)/welcome' as OnboardingRoutes);
  };

  const handleEmailSignUp = () => {
    triggerImpact();
    router.push('/(auth)/email-sign-up' as AuthRoutes);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBackToWelcome}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
          />
        </TouchableOpacity>
        
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
          <ThemedText style={styles.subtitle}>Join Saylo to start your language journey</ThemedText>
          
          <View style={styles.buttonContainer}>
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                buttonStyle={colorScheme === 'dark' ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={signUpWithApple}
              />
            )}

            <TouchableOpacity
              style={[
                styles.emailButton,
                { backgroundColor: colorScheme === 'dark' ? '#2C2C2C' : '#F5F5F5' }
              ]}
              onPress={handleEmailSignUp}
            >
              <Ionicons 
                name="mail-outline" 
                size={24} 
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
                style={styles.emailIcon}
              />
              <ThemedText style={styles.emailButtonText}>Continue with Email</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  appleButton: {
    height: 56,
    width: '100%',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    width: '100%',
  },
  emailIcon: {
    marginRight: 12,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 