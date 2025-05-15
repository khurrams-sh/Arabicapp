import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from './ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const LearningPathHeader = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top || 16 }]} />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
});

export default LearningPathHeader; 