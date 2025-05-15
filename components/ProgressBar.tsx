import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, useColorScheme, ViewStyle } from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';
import { usePathname } from 'expo-router';

interface ProgressBarProps {
  style?: ViewStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ style }) => {
  const { progressValue } = useOnboarding();
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  
  // Accent color from design tokens
  const accentColor = '#E5903A';
  
  // Background colors from design tokens
  const backgroundColor = colorScheme === 'dark' ? '#151718' : '#FFFFFF';
  const progressTrackColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  // Track if we're on the welcome screen to hide progress
  const isWelcomeScreen = pathname === '/(onboarding)/welcome';
  
  // Different opacity based on current screen
  const opacityAnim = useRef(new Animated.Value(isWelcomeScreen ? 0 : 1)).current;
  
  // Update opacity based on current path
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isWelcomeScreen ? 0 : 1,
      duration: 400,
      useNativeDriver: true
    }).start();
  }, [pathname, isWelcomeScreen, opacityAnim]);
  
  // Calculate width as a percentage of the container
  const width = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp'
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          backgroundColor: progressTrackColor,
          opacity: opacityAnim 
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progressBar,
          {
            width,
            backgroundColor: accentColor,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    position: 'relative',
  }
});

export default ProgressBar; 