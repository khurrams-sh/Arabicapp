import { StyleSheet, ScrollView, View, Pressable, TouchableOpacity, ActivityIndicator, Alert, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/context/AuthContext';
import { useDialect } from '@/context/DialectContext';
import { uploadAudioFile } from '@/utils/audioUpload';

const freeTalk = { 
  key: 'free-talk', 
  title: 'Free Talk', 
  description: 'Practice any topic you want!', 
  icon: '🗣️',
  context: 'This is a casual conversation between a native Arabic speaker and a language learner. Be conversational and natural, like talking to a friend. No lesson format, just chat naturally about whatever topics come up.'
};

const topics = [
  { key: 'cafe', title: 'At the café', icon: '☕', context: 'You are a server at a café speaking with a customer. Have a natural conversation about ordering, menu items, and recommendations. Be conversational, not educational.' },
  { key: 'meeting', title: 'Meeting someone new', icon: '🙋', context: 'You\'re meeting someone new at a social event. Have a natural conversation introducing yourselves and making small talk. Be conversational, not instructional.' },
  { key: 'directions', title: 'Asking for directions', icon: '🗺️', context: 'You\'re a local helping someone who is lost. Have a natural conversation about directions to popular places. Be conversational, not like a teacher.' },
  { key: 'phone', title: 'Phone call practice', icon: '📞', context: 'This is a phone conversation between friends or for a simple business call. Have a natural phone conversation. Be casual and authentic.' },
  { key: 'grocery', title: 'At the grocery store', icon: '🛒', context: 'You\'re a clerk at a grocery store speaking with a customer. Have a natural conversation about finding items, prices, or recommendations. Be conversational, not instructional.' },
  { key: 'airport', title: 'At the airport', icon: '✈️', context: 'You\'re an airport staff member speaking with a traveler. Have a natural conversation about flights, gates, or services. Be authentic, not like a lesson.' },
  { key: 'hobbies', title: 'Talking about hobbies', icon: '🎨', context: 'You\'re friends discussing your hobbies and interests. Have a casual, natural conversation sharing what you enjoy doing. Be conversational, not educational.' },
  { key: 'bad-news', title: 'React to bad news', icon: '😢', context: 'You\'re a friend responding to someone who got bad news. Have a natural, empathetic conversation. Be authentic and supportive, not instructional.' },
  { key: 'weekend', title: 'Making weekend plans', icon: '📅', context: 'You\'re friends discussing plans for the weekend. Have a casual conversation about activities, times, and preferences. Be conversational, not like a teacher.' },
  { key: 'pharmacy', title: 'At the pharmacy', icon: '💊', context: 'You\'re a pharmacist speaking with a customer. Have a natural conversation about finding medications or health products. Be authentic, not educational.' },
  { key: 'roommate', title: 'Arguing with a roommate', icon: '😠', context: 'You\'re roommates having a disagreement. Have a realistic, natural conversation resolving a household issue. Be authentic but respectful.' },
  { key: 'festival', title: 'Talking about a festival', icon: '🎉', context: 'You\'re friends discussing a local festival or celebration. Have a casual, natural conversation about events, food, or traditions. Be conversational, not instructional.' },
  { key: 'job-interview', title: 'Job interview simulation', icon: '💼', context: 'You\'re an interviewer speaking with a job applicant. Have a realistic job interview conversation with typical questions and responses. Be professional but natural.' },
  { key: 'storytelling', title: 'Storytelling', icon: '📖', context: 'You\'re friends sharing stories or experiences. Have a natural conversation where one person tells a story and the other responds. Be casual and authentic.' },
  { key: 'social-media', title: 'Social media debate', icon: '💬', context: 'You\'re friends discussing social media\'s impact. Have a casual debate with different viewpoints. Be conversational and authentic, not like a lesson.' },
  { key: 'hair-salon', title: 'At the hair salon', icon: '💇', context: 'You\'re a stylist speaking with a client. Have a natural conversation about hairstyle preferences or small talk during a haircut. Be conversational, not instructional.' },
  { key: 'food-delivery', title: 'Food delivery problem', icon: '🍔', context: 'You\'re a customer service rep speaking with someone about a delivery issue. Have a realistic conversation resolving a problem. Be authentic, not educational.' },
  { key: 'party', title: 'Meeting someone at a party', icon: '🥳', context: 'You\'re meeting a new person at a party. Have a casual, natural conversation making small talk and getting to know each other. Be conversational, not like a teacher.' },
  { key: 'street-food', title: 'Trying street food abroad', icon: '🌮', context: 'You\'re a street food vendor speaking with a tourist. Have a natural conversation about food options, flavors, or recommendations. Be authentic, not instructional.' },
  { key: 'hotel', title: 'Booking a hotel room', icon: '🏨', context: 'You\'re a hotel receptionist speaking with a guest. Have a natural conversation about room booking, amenities, or services. Be professional but conversational.' },
];

export default function SpeakingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { dialect } = useDialect();
  
  // Voice cloning states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceCloned, setVoiceCloned] = useState(false);
  const [audioMessage, setAudioMessage] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState("");
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isScreenActive = useRef(true);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Start recording function
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording", error);
      Alert.alert("Error", "Failed to start recording. Please check your microphone permissions.");
    }
  };

  // Stop recording function
  const stopRecording = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      
      if (uri && recordingDuration >= 10) {
        await processRecording(uri);
      } else if (recordingDuration < 10) {
        Alert.alert(
          "Recording too short", 
          "Please record at least 10 seconds of audio for voice cloning to work effectively."
        );
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
      setIsRecording(false);
    }
  };

  // Process the recording for voice cloning
  const processRecording = async (uri: string) => {
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to use this feature.");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Convert audio file to base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Upload to temporary storage to get URL
      const audioUrl = await uploadAudioFile(base64Audio, `voice-clone-${user.id}.wav`);
      
      // Call voice clone endpoint
      const cloneResponse = await fetch("https://sayloai.supabase.co/functions/v1/voice-clone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          user_id: user.id,
        }),
      });
      
      if (!cloneResponse.ok) {
        throw new Error("Failed to clone voice");
      }
      
      const { success, custom_voice_id } = await cloneResponse.json();
      
      if (success) {
        setVoiceCloned(true);
        Alert.alert("Success", "Your voice has been cloned successfully! Now you can generate Arabic speech with your voice.");
      }
    } catch (error) {
      console.error("Error processing recording:", error);
      Alert.alert("Error", "Failed to process your recording. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate speech with cloned voice
  const generateSpeech = async () => {
    if (!user?.id || !dialect) {
      Alert.alert("Error", "Missing user ID or dialect selection");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const sampleTexts = {
        egyptian: "أهلاً بيك في مصر! إزيك؟ أنا سعيد بمقابلتك.",
        levantine: "مرحبا! كيفك؟ أنا مبسوط كتير إني عم احكي معك.",
        gulf: "السلام عليكم! شخبارك؟ أنا مستانس وايد إني أتكلم معاك.",
        msa: "مرحباً! كيف حالك؟ أنا سعيد جداً بالتحدث معك."
      };
      
      const textToSpeak = sampleTexts[dialect.id as keyof typeof sampleTexts] || sampleTexts.msa;
      setAudioMessage(textToSpeak);
      
      const response = await fetch("https://sayloai.supabase.co/functions/v1/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: textToSpeak,
          user_id: user.id,
          dialect: dialect.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }
      
      const { success, audio_url } = await response.json();
      
      if (success && audio_url) {
        setGeneratedAudioUrl(audio_url);
      } else {
        throw new Error("No audio URL returned");
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      Alert.alert("Error", "Failed to generate speech. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Play generated audio
  const playGeneratedAudio = async () => {
    if (!generatedAudioUrl) return;
    if (!isScreenActive.current) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: generatedAudioUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlayingAudio(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    isScreenActive.current = true;
    return () => {
      isScreenActive.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const navigateToConversation = (topicKey: string, topicTitle: string, topicIcon: string, context?: string) => {
    router.push({
      pathname: '/conversation',
      params: { 
        topic: topicKey, 
        title: topicTitle, 
        icon: topicIcon,
        context: context || '',
        isSimulation: 'true'
      }
    });
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>  
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Page Title */}
        <ThemedText type="title" style={styles.pageTitle}>Speaking Practice</ThemedText>
        
        {/* Voice Clone Card */}
        <View style={[styles.featureCard, { backgroundColor: theme.tint }]}>
          <View style={styles.featureCardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: theme.background }]}>
              <FontAwesome5 name="user-alt" size={24} color={theme.tint} />
            </View>
            <ThemedText type="title" style={[styles.featureCardTitle, { color: theme.background }]}>
              Clone Your Voice
            </ThemedText>
          </View>
          
          <ThemedText style={[styles.featureCardDesc, { color: theme.background }]}>
            Record your voice and hear how you would sound speaking Arabic!
          </ThemedText>
          
          {!voiceCloned ? (
            <View style={styles.recordingSection}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  { backgroundColor: isRecording ? '#FF4545' : theme.background }
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <Ionicons name="stop" size={28} color="#FF4545" />
                ) : (
                  <Ionicons name="mic" size={28} color={theme.tint} />
                )}
              </TouchableOpacity>
              
              {isRecording ? (
                <ThemedText style={[styles.recordingTime, { color: theme.background }]}>
                  {formatTime(recordingDuration)}
                </ThemedText>
              ) : (
                <ThemedText style={[styles.recordingHint, { color: theme.background }]}>
                  Tap to record at least 10 seconds
                </ThemedText>
              )}
            </View>
          ) : (
            <View style={styles.generationSection}>
              {generatedAudioUrl ? (
                <React.Fragment>
                  <ThemedText style={[styles.arabicText, { color: theme.background }]}>
                    {audioMessage}
                  </ThemedText>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.background }]}
                    onPress={playGeneratedAudio}
                    disabled={isPlayingAudio || isProcessing}
                  >
                    {isPlayingAudio ? (
                      <ActivityIndicator color={theme.tint} />
                    ) : (
                      <React.Fragment>
                        <Ionicons name="play" size={20} color={theme.tint} style={styles.buttonIcon} />
                        <ThemedText style={styles.buttonText}>Play Audio</ThemedText>
                      </React.Fragment>
                    )}
                  </TouchableOpacity>
                </React.Fragment>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.background }]}
                  onPress={generateSpeech}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={theme.tint} />
                  ) : (
                    <React.Fragment>
                      <Ionicons name="language" size={20} color={theme.tint} style={styles.buttonIcon} />
                      <ThemedText style={styles.buttonText}>Generate Arabic Speech</ThemedText>
                    </React.Fragment>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Section header for conversation practice */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionHeaderIconCircle, { backgroundColor: theme.tint }]}>
            <MaterialCommunityIcons name="chat-processing" size={22} color={theme.background} />
          </View>
          <ThemedText type="subtitle" style={styles.sectionHeader}>Conversation Practice</ThemedText>
        </View>
        
        {/* Free Talk card */}
        <Pressable 
          style={({ pressed }) => [
            styles.freeTalkCard, 
            { backgroundColor: colorScheme === 'dark' ? '#23272F' : '#fff', opacity: pressed ? 0.9 : 1 }
          ]} 
          onPress={() => navigateToConversation(freeTalk.key, freeTalk.title, freeTalk.icon, freeTalk.context)}
        >
          <View style={[styles.freeTalkIconContainer, { backgroundColor: theme.tint }]}> 
            <Text style={styles.freeTalkIcon}>{freeTalk.icon}</Text>
          </View>
          <View style={styles.topicTextContainer}>
            <ThemedText type="defaultSemiBold" style={styles.freeTalkTitle}>{freeTalk.title}</ThemedText>
            <ThemedText style={styles.topicDescription}>{freeTalk.description}</ThemedText>
          </View>
        </Pressable>
        
        {/* Topics grid */}
        <View style={styles.topicsGrid}>
          {topics.map((item, index) => {
            // Create a consistent but varied color palette for topic icons
            const iconColors = [
              theme.tint,
              '#FF8A65', // Coral
              '#4DB6AC', // Teal
              '#7986CB', // Indigo
              '#9575CD', // Purple
              '#4FC3F7', // Light Blue
              '#FFA726', // Orange
              '#FF7043', // Deep Orange
            ];
            
            const colorIndex = index % iconColors.length;
            const iconColor = iconColors[colorIndex];
            
            return (
              <Pressable
                key={item.key}
                style={({ pressed }) => [
                  styles.topicCard,
                  { backgroundColor: colorScheme === 'dark' ? '#23272F' : '#fff', opacity: pressed ? 0.9 : 1 }
                ]}
                onPress={() => navigateToConversation(item.key, item.title, item.icon, item.context)}
              >
                <View style={[styles.topicIconCircle, { backgroundColor: iconColor }]}> 
                  <Text style={styles.topicIcon}>{item.icon}</Text>
                </View>
                <ThemedText type="defaultSemiBold" style={styles.topicTitle}>{item.title}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  pageTitle: {
    marginBottom: 24,
    fontWeight: '800',
    fontSize: 32,
    letterSpacing: -1,
  },
  featureCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureCardTitle: {
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  featureCardDesc: {
    fontSize: 16,
    opacity: 0.95,
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 22,
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  recordButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  recordingTime: {
    fontSize: 20,
    fontWeight: '600',
  },
  recordingHint: {
    fontSize: 15,
    opacity: 0.8,
  },
  generationSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  arabicText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 32,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  sectionHeaderIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionHeader: {
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.2,
  },
  freeTalkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  freeTalkIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    overflow: 'hidden',
  },
  freeTalkIcon: {
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    includeFontPadding: false,
    marginTop: 2,
  },
  freeTalkTitle: {
    fontSize: 18,
    marginBottom: 6,
    fontWeight: '700',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  topicCard: {
    width: '48%',
    borderRadius: 18,
    padding: 16,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  topicIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  topicIcon: {
    fontSize: 28,
    textAlign: 'center',
    color: '#fff',
    includeFontPadding: false,
    marginTop: 2,
  },
  topicTextContainer: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  topicDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
});
