import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme, Dimensions, Animated } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import TransitionWrapper from '../../components/TransitionWrapper';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, LinearGradient, Stop, Defs, Text, Line } from 'react-native-svg';
import { triggerImpact } from '../../utils/haptics';

const { width } = Dimensions.get('window');

export default function GoalConfirmation() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { setProgressByScreen } = useOnboarding();
  
  // Animation values
  const pathAnimation = useRef(new Animated.Value(0)).current;
  const graphOpacity = useRef(new Animated.Value(0)).current;

  // Ensure correct progress when this screen appears
  useEffect(() => {
    setProgressByScreen('goal-confirmation');

    // Animate the graph elements
    Animated.sequence([
      // First fade in the whole graph 
      Animated.timing(graphOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      
      // Then animate the progress path
      Animated.timing(pathAnimation, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);
  
  const navigateToNext = () => {
    triggerImpact();
    router.push('/(onboarding)/reminder-time' as never);
  };
  
  // Secondary accent color from design tokens
  const accentColor = '#E5903A';
  
  // Text color based on theme
  const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const backgroundColorSecondary = colorScheme === 'dark' ? '#252525' : '#F5F5F7';
  const borderColor = colorScheme === 'dark' ? '#333333' : '#EBEBEB';
  
  // Calculate animated values
  const strokeDashoffsetValue = pathAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0], // Approximate path length
  });
  
  // Calculate responsive positions based on available width
  const svgWidth = width - 60;
  const margin = 25; // left margin
  const rightMargin = 40; // Increased right margin to ensure "60 Days" label doesn't get cut off
  const availableWidth = svgWidth - margin - rightMargin;
  
  // Calculate x-positions for points and labels
  const x1 = margin;  // Week 1
  const x2 = margin + availableWidth * 0.333; // Week 2
  const x3 = margin + availableWidth * 0.666; // Week 4
  const x4 = margin + availableWidth; // 60 Days
  
  return (
    <ThemedView style={[styles.container, { 
      paddingTop: Math.max(insets.top + 60, 80), 
      paddingBottom: insets.bottom + 20 
    }]}>
      <TransitionWrapper>
        <View style={styles.contentContainer}>
          {/* Success icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: backgroundColorSecondary }]}>
              <Ionicons name="checkmark" size={28} color={accentColor} />
            </View>
          </View>
          
          <ThemedText style={styles.commitmentText}>Daily commitment is set.</ThemedText>
          
          <ThemedText type="title" style={styles.title}>Perfect.</ThemedText>
          
          <ThemedText style={styles.description}>
            You're in good company—most learners who succeed with Saylo practice Arabic daily to build lasting fluency.
          </ThemedText>
          
          <ThemedText type="title" style={styles.goalText}>Your goal is set.</ThemedText>
          
          {/* Centered graph container positioned higher up */}
          <View style={styles.graphOuterContainer}>
            <Animated.View style={[styles.graphContainer, { opacity: graphOpacity }]}>
              <Svg height={250} width={svgWidth} style={styles.svgContainer}>
                <Defs>
                  <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={accentColor} stopOpacity="0.3" />
                    <Stop offset="1" stopColor={accentColor} stopOpacity="0.05" />
                  </LinearGradient>
                </Defs>
                
                {/* Background grid lines */}
                <Line 
                  x1={x1} y1="40" x2={x1} y2="180" 
                  stroke={borderColor} 
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <Line 
                  x1={x2} y1="40" x2={x2} y2="180" 
                  stroke={borderColor} 
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <Line 
                  x1={x3} y1="40" x2={x3} y2="180" 
                  stroke={borderColor} 
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <Line 
                  x1={x4} y1="40" x2={x4} y2="180" 
                  stroke={borderColor} 
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                
                <Line 
                  x1={x1} y1="50" x2={x4} y2="50" 
                  stroke={borderColor} 
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <Line 
                  x1={x1} y1="115" x2={x4} y2="115" 
                  stroke={borderColor} 
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <Line 
                  x1={x1} y1="180" x2={x4} y2="180" 
                  stroke={borderColor} 
                  strokeWidth="1"
                />
                
                {/* Area under the curve */}
                <Path
                  d={`M ${x1} 180 C ${x1 + 15} 168, ${x1 + 55} 155, ${x2} 150 S ${(x2 + x3)/2} 130, ${x3} 105 S ${(x3 + x4)/2} 60, ${x4} 45 L ${x4} 180 Z`}
                  fill="url(#areaGradient)"
                />
                
                {/* Animated progress curve - only animate this */}
                <AnimatedPath
                  d={`M ${x1} 180 C ${x1 + 15} 168, ${x1 + 55} 155, ${x2} 150 S ${(x2 + x3)/2} 130, ${x3} 105 S ${(x3 + x4)/2} 60, ${x4} 45`}
                  stroke={accentColor}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="420"
                  strokeDashoffset={strokeDashoffsetValue}
                />
                
                {/* Keep the original circles without animation scale to avoid glitching */}
                <Circle 
                  cx={x1} 
                  cy="180" 
                  r="7" 
                  fill="white" 
                  stroke={accentColor} 
                  strokeWidth="2" 
                />
                
                <Circle 
                  cx={x2} 
                  cy="150" 
                  r="7" 
                  fill="white" 
                  stroke={accentColor} 
                  strokeWidth="2" 
                />
                
                <Circle 
                  cx={x3} 
                  cy="105" 
                  r="7" 
                  fill="white" 
                  stroke={accentColor} 
                  strokeWidth="2" 
                />
                
                <Circle 
                  cx={x4} 
                  cy="45" 
                  r="9" 
                  fill={accentColor} 
                />
                
                {/* Award icon at the end */}
                <Circle 
                  cx={x4} 
                  cy="45" 
                  r="22" 
                  fill={accentColor} 
                  opacity={0.2} 
                />
                
                <Circle 
                  cx={x4} 
                  cy="45" 
                  r="18" 
                  fill={accentColor} 
                  opacity={0.3} 
                />
                
                {/* Timeline labels - move down to ensure visibility */}
                <Text
                  x={x1}
                  y="216"
                  fontSize="14"
                  fontWeight="500"
                  textAnchor="middle"
                  fill={textColor}
                >
                  Week 1
                </Text>
                
                <Text
                  x={x2}
                  y="216" 
                  fontSize="14"
                  fontWeight="500"
                  textAnchor="middle"
                  fill={textColor}
                >
                  Week 2
                </Text>
                
                <Text
                  x={x3}
                  y="216"
                  fontSize="14"
                  fontWeight="500"
                  textAnchor="middle"
                  fill={textColor}
                >
                  Week 4
                </Text>
                
                <Text
                  x={x4}
                  y="216"
                  fontSize="14"
                  fontWeight="500"
                  textAnchor="middle"
                  fill={textColor}
                >
                  60 Days
                </Text>
              </Svg>
            </Animated.View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: accentColor }]}
              onPress={navigateToNext}
            >
              <ThemedText style={styles.buttonText}>Continue</ThemedText>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color="#FFFFFF" 
                style={styles.buttonIcon} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </TransitionWrapper>
    </ThemedView>
  );
}

// Create animated version of SVG Path component
const AnimatedPath = Animated.createAnimatedComponent(Path);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commitmentText: {
    fontSize: 16,
    opacity: 0.8,
    marginVertical: 8,
    textAlign: 'center',
    color: '#66CA66',
    fontWeight: '600',
  },
  title: {
    fontWeight: '800',
    fontSize: 30,
    marginTop: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 18,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
    maxWidth: 500,
  },
  goalText: {
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 15,
    textAlign: 'center',
  },
  graphOuterContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  graphContainer: {
    marginVertical: 5,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    alignSelf: 'center',
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 20,
    width: '100%',
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 8,
  },
}); 