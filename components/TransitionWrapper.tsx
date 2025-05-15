import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewProps, Dimensions } from 'react-native';
import { usePathname } from 'expo-router';

interface TransitionWrapperProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * TransitionWrapper adds smooth transitions to screens based on their type.
 * Different screens get different transition effects:
 * - Welcome to language-selection: slide transition
 * - Quiz questions: fade transition to see progress bar updates
 */
const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ children, style, ...props }) => {
  // Get current path to determine transition style
  const pathname = usePathname();
  
  // Animation values for opacity and position
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const horizontalSlideAnim = useRef(new Animated.Value(30)).current;

  // Determine if this is the welcome screen
  const isWelcomeScreen = pathname === '/(onboarding)/welcome';
  // Determine if we're transitioning from welcome to language selection
  const isLanguageSelectionScreen = pathname === '/(onboarding)/language-selection';

  // Run animations when component mounts
  useEffect(() => {
    // Different animations for welcome -> first quiz vs between quiz screens
    if (isWelcomeScreen) {
      // Simple fade for welcome screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        delay: 100,
      }).start();
    } else if (isLanguageSelectionScreen) {
      // Horizontal slide + fade for first quiz screen (from welcome)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          delay: 50,
        }),
        Animated.timing(horizontalSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          delay: 50,
        })
      ]).start();
    } else {
      // Vertical slide + fade for transitions between quiz screens
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
          delay: 30,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          delay: 30,
        })
      ]).start();
    }

    // Cleanup animation when component unmounts
    return () => {
      fadeAnim.setValue(0);
      slideAnim.setValue(15);
      horizontalSlideAnim.setValue(30);
    };
  }, []);

  // Different animation styles based on screen type
  const animationStyle = isWelcomeScreen 
    ? { opacity: fadeAnim }
    : isLanguageSelectionScreen
      ? { 
          opacity: fadeAnim,
          transform: [{ translateX: horizontalSlideAnim }]
        }
      : { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        };

  return (
    <Animated.View 
      style={[
        styles.container,
        animationStyle,
        style
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TransitionWrapper; 