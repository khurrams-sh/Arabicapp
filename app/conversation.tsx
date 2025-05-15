import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import VoiceChat from '@/components/VoiceChat';
import { Ionicons } from '@expo/vector-icons';

// Conversation screen with voice chat functionality
export default function ConversationScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const params = useLocalSearchParams();
  
  // Get lesson parameters from the URL
  const lessonId = params.lessonId ? Number(params.lessonId) : undefined;
  const unitId = params.unitId ? Number(params.unitId) : undefined;
  const title = params.title as string || 'Conversation';
  const context = params.context as string || '';
  const isSimulation = params.isSimulation === 'true';

  console.log("Rendering conversation screen with params:", { lessonId, unitId, title, isSimulation, context });

  return (
    <>
      <Stack.Screen
        options={{
          title: title,
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ThemedView style={styles.container}>
        <VoiceChat 
          lessonId={lessonId} 
          unitId={unitId} 
          customContext={context} 
          isSimulation={isSimulation} 
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 