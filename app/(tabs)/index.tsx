import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { DialectSelector } from '@/components/DialectSelector';
import LearningPath from '@/components/LearningPath';
import { useLearning } from '@/context/LearningContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

function HomeContent() {
  const { syncWithSupabase, isLoading } = useLearning();
  const router = useRouter();
  const params = useLocalSearchParams();
  const accentColor = useThemeColor({}, 'tint');
  const [hasSynced, setHasSynced] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log("HomeContent - isLoading:", isLoading);
    console.log("HomeContent - hasSynced:", hasSynced);
  }, [isLoading, hasSynced]);
  
  // Sync with Supabase on initial load AND when lessonCompleted parameter is true
  useEffect(() => {
    const performSync = async () => {
      try {
        console.log("Syncing with Supabase...");
        await syncWithSupabase();
        setHasSynced(true);
        console.log("Sync successful");
      } catch (error) {
        console.error("Error during sync:", error);
      } finally {
        // Clear the parameter to prevent multiple syncs if it exists
        if (params.lessonCompleted === 'true') {
          router.setParams({});
        }
      }
    };
    
    // Sync if we haven't synced yet OR if lessonCompleted parameter is true
    if (!hasSynced || params.lessonCompleted === 'true') {
      performSync();
    }
  }, [params.lessonCompleted, syncWithSupabase, router, hasSynced]);
  
  if (isLoading && !hasSynced) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={accentColor} />
        <ThemedText style={styles.loadingText}>Loading your lessons...</ThemedText>
      </View>
    );
  }
  
  return (
    <>
      {/* Header with dialect selector */}
      <DialectSelector />
      
      {/* Main content */}
      <View style={styles.contentContainer}>
        <LearningPath />
      </View>
    </>
  );
}

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Don't wrap with LearningProvider here since it's already provided in _layout.tsx */}
      <HomeContent />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  }
});
