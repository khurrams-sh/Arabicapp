import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { supabase, signUpUser } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { triggerImpact } from '@/utils/haptics';
import { AuthRoutes, RootRoutes } from '@/types/routes';
import { useAuth } from '@/context/AuthContext';
import { 
  USER_NAME_KEY, 
  NATIVE_LANGUAGE_KEY, 
  DIALECT_KEY,
  ARABIC_LEVEL_KEY,
  LEARNING_SOURCE_KEY,
  SKILLS_KEY,
  INTERESTS_KEY,
  CHALLENGES_KEY,
  BUSINESS_TOPICS_KEY,
  DAILY_GOAL_KEY,
  REMINDER_TIME_KEY,
  getProfileData
} from '@/utils/profileStorage';

export default function EmailSignUpScreen() {
  const colorScheme = useColorScheme();
  const accentColor = '#E5903A';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { setUser, setSession } = useAuth();

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

  // Validation
  const validateInputs = () => {
    let isValid = true;
    
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  // Helper function to transfer all onboarding data to the new user's profile
  const transferOnboardingData = async (userId: string) => {
    try {
      const keys = [
        USER_NAME_KEY,
        NATIVE_LANGUAGE_KEY,
        DIALECT_KEY,
        ARABIC_LEVEL_KEY,
        LEARNING_SOURCE_KEY,
        SKILLS_KEY,
        INTERESTS_KEY,
        CHALLENGES_KEY,
        BUSINESS_TOPICS_KEY,
        DAILY_GOAL_KEY,
        REMINDER_TIME_KEY
      ];
      
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      const profile: Record<string, any> = { user_id: userId };
      
      for (const key of keys) {
        try {
          const value = await getProfileData(key);
          if (value !== null) {
            const columnMap: Record<string, string> = {
              [USER_NAME_KEY]: 'name',
              [NATIVE_LANGUAGE_KEY]: 'native_language',
              [DIALECT_KEY]: 'dialect',
              [ARABIC_LEVEL_KEY]: 'arabic_level',
              [LEARNING_SOURCE_KEY]: 'learning_source',
              [SKILLS_KEY]: 'skills',
              [INTERESTS_KEY]: 'interests',
              [CHALLENGES_KEY]: 'challenges',
              [BUSINESS_TOPICS_KEY]: 'business_topics',
              [DAILY_GOAL_KEY]: 'daily_goal_minutes',
              [REMINDER_TIME_KEY]: 'reminder_time'
            };
            
            const column = columnMap[key];
            if (column) {
              profile[column] = value;
            }
          }
        } catch (err) {
          console.error(`Error getting ${key}:`, err);
        }
      }
      
      if (existingProfile) {
        await supabase
          .from('user_profiles')
          .update(profile)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_profiles')
          .insert([profile]);
      }
      
      console.log('Successfully transferred onboarding data to user profile');
      return true;
    } catch (error) {
      console.error('Error transferring onboarding data:', error);
      return false;
    }
  };

  const signUp = async () => {
    triggerImpact();
    
    if (!name.trim()) {
      Alert.alert('Error', 'No name found from onboarding. Please restart the app.');
      return;
    }
    
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await signUpUser(email.trim(), password, name);

      if (error) throw error;
      
      if (data.session) {
        if (data.user) {
          await transferOnboardingData(data.user.id);
          
          // Manually update auth context
          setSession(data.session);
          setUser(data.user);
          
          console.log("Successfully signed up:", data.user.email);
        }
        
        // Force navigation with delay to ensure context is updated
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
      } else {
        Alert.alert('Error', 'Failed to create session automatically.');
      }
    } catch (error: any) {
      Alert.alert('Error signing up', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignUp = () => {
    triggerImpact();
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBackToSignUp}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
          />
        </TouchableOpacity>
        
        <View style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>Create an Account</ThemedText>
          <ThemedText style={styles.subtitle}>Enter your email and create a password</ThemedText>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Email</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  emailError ? styles.inputError : null,
                  { 
                    color: Colors[colorScheme ?? 'light'].text,
                    backgroundColor: colorScheme === 'dark' ? '#2C2C2C' : '#F5F5F5',
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
              {emailError ? <ThemedText style={styles.errorText}>{emailError}</ThemedText> : null}
            </View>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Password</ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    passwordError ? styles.inputError : null,
                    { 
                      color: Colors[colorScheme ?? 'light'].text,
                      backgroundColor: colorScheme === 'dark' ? '#2C2C2C' : '#F5F5F5',
                    }
                  ]}
                  placeholder="Create a password"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={24}
                    color={Colors[colorScheme ?? 'light'].tabIconDefault}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <ThemedText style={styles.errorText}>{passwordError}</ThemedText> : null}
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, { backgroundColor: accentColor }]}
              onPress={signUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.signUpButtonText}>Create Account</ThemedText>
              )}
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
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    opacity: 0.7,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.7,
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  signUpButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 