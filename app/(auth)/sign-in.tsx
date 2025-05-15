import React from 'react';
import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';

import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { triggerImpact } from '@/utils/haptics';
import { AuthRoutes, OnboardingRoutes } from '@/types/routes';
import { useAuth } from '@/context/AuthContext';

// Fix the Link href type error
const FORGOT_PASSWORD_ROUTE = '/(auth)/forgot-password' as const;

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const accentColor = '#E5903A';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { setUser, setSession } = useAuth();

  // Validation
  const validateInputs = () => {
    let isValid = true;
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  const signIn = async () => {
    triggerImpact();
    
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      if (data.session) {
        // Manually update auth context
        setSession(data.session);
        setUser(data.user);

        // Force navigation to tabs
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        Alert.alert('Error', 'Failed to create session.');
      }
    } catch (error: any) {
      Alert.alert('Error signing in', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error, data } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) throw error;
        
        if (data.session) {
          // Manually update auth context
          setSession(data.session);
          setUser(data.user);

          // Force navigation to tabs
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 100);
        }
      } else {
        throw new Error('No identityToken.');
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow
        return;
      }
      Alert.alert('Error signing in with Apple', e.message);
    }
  };

  const handleBackToWelcome = () => {
    triggerImpact();
    router.replace('/(onboarding)/welcome' as OnboardingRoutes);
  };

  const handleEmailSignIn = () => {
    triggerImpact();
    router.push('/(auth)/email-sign-in' as AuthRoutes);
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
          <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
          <ThemedText style={styles.subtitle}>Sign in to continue your language journey</ThemedText>
          
          <View style={styles.buttonContainer}>
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={colorScheme === 'dark' ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={signInWithApple}
              />
            )}

            <TouchableOpacity
              style={[
                styles.emailButton,
                { backgroundColor: colorScheme === 'dark' ? '#2C2C2C' : '#F5F5F5' }
              ]}
              onPress={handleEmailSignIn}
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

          {showEmailForm && (
            <View style={styles.formContainer}>
              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault }]} />
                <ThemedText style={styles.dividerText}>Sign in with email</ThemedText>
                <View style={[styles.divider, { backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault }]} />
              </View>
              
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
                    placeholder="Enter your password"
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
                style={[styles.signInButton, { backgroundColor: accentColor }]}
                onPress={signIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
                )}
              </TouchableOpacity>

              <Link href={FORGOT_PASSWORD_ROUTE} asChild>
                <TouchableOpacity>
                  <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
          )}
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  buttonContainer: {
    gap: 16,
  },
  appleButton: {
    height: 56,
    width: '100%',
    marginBottom: 24,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
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
  formContainer: {
    marginTop: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    opacity: 0.2,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.6,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#E53935',
    borderWidth: 1,
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    marginTop: 4,
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  signInButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signInButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    opacity: 0.7,
  },
}); 