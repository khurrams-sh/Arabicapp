import React, { useState, useRef, useEffect, forwardRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
  Platform,
  Alert,
  Animated,
  Easing,
  SafeAreaView,
  KeyboardAvoidingView,
  Dimensions,
  Keyboard,
  PanResponder,
  Modal,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useDialect } from '@/context/DialectContext';
import { useLearning } from '@/context/LearningContext';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { addPracticeMinutes } from '@/utils/userProgress';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

const API_URL = 'https://w64z7ms51i.execute-api.us-east-1.amazonaws.com/voice';
const TTS_API_URL = 'https://kzbszaiq6l.execute-api.us-east-1.amazonaws.com/tts';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  audio?: string | null;
  role?: string; // 'user' or 'assistant'
  content?: string; // For API format
}

interface VoiceChatProps {
  lessonId?: number;
  unitId?: number;
  inModal?: boolean;
  onLessonCompleted?: () => void;
  modalVisible?: boolean;
  customContext?: string;
  isSimulation?: boolean;
}

const VoiceChat = forwardRef<{ stopAllAudio: () => Promise<boolean> }, VoiceChatProps>(({ lessonId, unitId, inModal = false, onLessonCompleted, modalVisible = true, customContext = '', isSimulation = false }, ref) => {
  /* ─────────────── state & refs ─────────────── */
  console.log(`VoiceChat mounted with:`, { lessonId, unitId, inModal, modalVisible, customContext, isSimulation });
  
  // Initialize audioEnabled based on modalVisible if in modal mode
  const initialAudioEnabled = inModal ? modalVisible : true;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [duration, setDuration] = useState(0);
  const [slideUI, setSlideUI] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [practiceStartTime, setPracticeStartTime] = useState<Date | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(initialAudioEnabled);
  const [streakIncreased, setStreakIncreased] = useState(false);

  const { completeLesson, streak } = useLearning();
  const { dialect } = useDialect();
  
  // Use the actual props instead of defaults
  const currentLessonId = lessonId ?? 1; 
  const currentUnitId = unitId ?? 1;

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);
  const minDxRef = useRef(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const insets = useSafeAreaInsets();
  const windowWidth = Dimensions.get('window').width;
  const pad = Math.max(10, windowWidth * 0.05); // Dynamic padding based on screen width

  /* ─────────────── animations ─────────────── */
  const slideAnim = useRef(new Animated.Value(0)).current;
  const waveAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;

  /* ─────────────── theme colors ───────────── */
  // Pre-compute all theme colors here to avoid conditional hook calls
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const tintColor = theme.tint;
  const textColor = theme.text;
  const backgroundColor = theme.background;
  const inputBackground = colorScheme === 'dark' ? '#2C2C2E' : '#E5E5EA';
  const cardBackground = colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7';
  const subtleText = '#8E8E93';
  const borderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  /* ─────────── pan‑to‑cancel handler ───────── */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,  // ★ capture first
      onMoveShouldSetPanResponderCapture: () => true,   // ★
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        minDxRef.current = 0;
        cancelledRef.current = false;
      },

      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          slideAnim.setValue(g.dx);
          minDxRef.current = Math.min(minDxRef.current, g.dx);

          if (minDxRef.current < -40 && !cancelledRef.current) {
            cancelledRef.current = true;
            setSlideUI(true);
          } else if (minDxRef.current >= -40 && cancelledRef.current) {
            cancelledRef.current = false;
            setSlideUI(false);
          }
        }
      },

      onPanResponderRelease: () => {
        slideAnim.setValue(0);
        setSlideUI(false);
        stopRecording();                    // always stop here
      },
    }),
  ).current;

  /* ───────── keyboard show/hide ───────── */
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  /* ─────── auto‑scroll on new message ───── */
  useEffect(() => {
    if (messages.length > 0) {
      // Add a small delay to ensure layout is complete
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);

  /* ───────── request initial message on mount ───────── */
  useEffect(() => {
    // Only request initial message if we don't have messages yet
    // AND the component is visible (not in a modal OR modal is visible)
    if (messages.length === 0 && (!inModal || modalVisible)) {
      console.log('Requesting initial message - visibility check passed:', 
        { inModal, modalVisible, messagesCount: messages.length });
      
      // Small delay to ensure dialect is loaded
      const timer = setTimeout(() => {
        requestInitialMessage();
      }, 300);
      return () => clearTimeout(timer);
    } else if (messages.length === 0) {
      console.log('Not requesting initial message - component not visible:', 
        { inModal, modalVisible });
    }
  }, [dialect?.id, inModal, modalVisible, messages.length]);

  /* ───────── auto-continue lessons when completing one ───────── */
  useEffect(() => {
    // Removing auto-continuation to stop automatic user messages
    // When a new lesson is started, we'll just show the initial message
  }, [messages]);

  /* ───────── watch for lesson completion ───────── */
  useEffect(() => {
    if (lessonComplete && !showCompletionModal) {
      // Get lesson and unit IDs from props
      const lessonIdToComplete = currentLessonId;
      const unitIdToComplete = currentUnitId;
      
      console.log(`Completing lesson ${lessonIdToComplete} in unit ${unitIdToComplete}`);
      
      // Store current streak value before completion
      const checkStreakIncrease = async () => {
        const beforeStreak = streak;
        
        // Complete the lesson
        await completeLesson(lessonIdToComplete, unitIdToComplete);
        
        // Check if streak increased
        if (streak > beforeStreak) {
          console.log(`Streak increased from ${beforeStreak} to ${streak}!`);
          setStreakIncreased(true);
        }
      };
      
      checkStreakIncrease();
      
      // If shown in modal, notify parent component instead of showing modal
      if (inModal) {
        // Notify parent that lesson is completed
        onLessonCompleted && onLessonCompleted();
        // Don't automatically close - user will close manually
        return;
      }
      
      // Add a completion message to the conversation instead of showing modal immediately
      const completionMessage = {
        id: genId(),
        text: "🎉 Lesson complete! You've successfully finished this lesson. Tap the button below to continue to the next lesson.",
        isUser: false,
        role: 'system',
        content: "lesson_complete"
      };
      
      // Add the completion message to the conversation
      setMessages(prev => [...prev, completionMessage]);
      
      // Show the completion modal - no delay needed
      setShowCompletionModal(true);
    }
  }, [lessonComplete, completeLesson, currentLessonId, currentUnitId, inModal, onLessonCompleted, streak]);

  /* ───────── record practice time ───────── */
  useEffect(() => {
    // Record when the practice session started
    setPracticeStartTime(new Date());
    
    // When component unmounts, record the practice time
    return () => {
      if (practiceStartTime) {
        const endTime = new Date();
        const practiceMinutes = Math.ceil((endTime.getTime() - practiceStartTime.getTime()) / (1000 * 60));
        
        // Only record if practice was at least 1 minute
        if (practiceMinutes >= 1) {
          console.log(`Recording ${practiceMinutes} minutes of practice`);
          addPracticeMinutes(practiceMinutes).catch(err => {
            console.error('Failed to record practice minutes:', err);
          });
        }
      }
    };
  }, []);

  /* ───────── cleanup audio on unmount ───────── */
  useEffect(() => {
    // Setup audio mode immediately on component mount
    const setupAudio = async () => {
      try {
        console.log('Setting up audio system...');
        
        // First ensure audio is enabled
        await Audio.setIsEnabledAsync(true);
        
        // Then configure audio mode for both playback and recording
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          interruptionModeIOS: 1, // Default interrupt mode (do not mix)
          interruptionModeAndroid: 1, // Default interrupt mode (do not mix)
          allowsRecordingIOS: false, // Will be set to true when recording
          playThroughEarpieceAndroid: false
        });
        
        setAudioEnabled(true);
        console.log('Audio system initialized successfully');
      } catch (error) {
        console.error('Failed to set up audio system:', error);
      }
    };
    
    // Initialize audio system immediately
    setupAudio();
    
    // Return cleanup function to stop all audio when component unmounts
    return () => {
      console.log('VoiceChat unmounting - stopping all audio');
      killAllAudio();
    };
  }, []);
  
  /* ─────── global state for audio blocking ─────── */
  // Global flag for audio blocking was moved to the top of the component
  
  /* ───────── watch for visibility changes aggressively ───────── */
  useEffect(() => {
    // This effect controls audio playback based on component visibility
    // When in a modal, visibility is controlled by the modalVisible prop
    if (inModal) {
      console.log('Modal visibility changed:', modalVisible);
      
      // Update audio enabled state based on modal visibility
      setAudioEnabled(modalVisible);
      
      if (!modalVisible) {
        console.log('Modal not visible - killing all audio and disabling audio system');
        // Kill audio immediately when component becomes invisible
        killAllAudio();
      } else {
        // Modal is now visible - ensure audio system is properly initialized
        console.log('Modal is now visible - ensuring audio system is ready');
        Audio.setIsEnabledAsync(true);
      }
    } else {
      // When not in a modal, the component is always visible
      setAudioEnabled(true);
    }
  }, [modalVisible, inModal]);
  
  /* ─────── expose imperative handle for parent components ─────── */
  useEffect(() => {
    // Type guard to ensure we're working with a MutableRefObject
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = {
        stopAllAudio: async () => {
          console.log('stopAllAudio called through ref');
          return await stopAllAudio();
        }
      };
    }
  }, []);
  
  /* ─────── animation for recording pulse ─────── */
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  /* ─────── animation for typing indicator dots ─────── */
  useEffect(() => {
    let animations: Animated.CompositeAnimation[] = [];
    
    if (isLoading) {
      const animateDot = (dot: Animated.Value, delay: number) => {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              delay,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
        
        animation.start();
        animations.push(animation);
        return animation;
      };

      animateDot(typingDot1, 0);
      animateDot(typingDot2, 200);
      animateDot(typingDot3, 400);

      // Return cleanup function
      return () => {
        animations.forEach(anim => anim.stop());
        typingDot1.setValue(0);
        typingDot2.setValue(0);
        typingDot3.setValue(0);
      };
    } else {
      // Reset all animations
      typingDot1.setValue(0);
      typingDot2.setValue(0);
      typingDot3.setValue(0);
    }
  }, [isLoading]);
  
  /* ─────── global audio kill function ─────── */
  const killAllAudio = () => {
    // Synchronous function that kills all audio immediately
    console.log("Emergency audio kill activated");
    
    // Disable all audio
    Audio.setIsEnabledAsync(false);
    
    // Force clear the sound reference
    if (soundRef.current) {
      try {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
      } catch (e) {}
      soundRef.current = null;
      setIsPlaying(null);
    }
    
    // Re-enable audio system after a delay
    setTimeout(() => {
      Audio.setIsEnabledAsync(true);
    }, 300);
    
    return true;
  };

  /* ─────── stop all audio playback ─────── */
  const stopAllAudio = async () => {
    console.log('Stopping all audio playback');
    
    // Start with hard kill
    killAllAudio();
    
    try {
      // Also try proper cleanup
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (error: any) {
          console.log('Error stopping sound:', error);
        } finally {
          soundRef.current = null;
          setIsPlaying(null);
        }
      }
      
      return true;
    } catch (error: any) {
      console.log('Error in stopAllAudio:', error);
      return false;
    }
  };

  /* ─────── audio playback function ─────── */
  const playAudio = async (b64: string, messageId?: string) => {
    // Validate audio data first
    if (!b64 || typeof b64 !== 'string' || b64.length < 100) {
      console.error('Invalid audio data - skipping playback, length:', b64 ? b64.length : 0);
      return;
    }
    
    // Only play if audio is enabled and the component is visible
    // For modal mode, explicitly check that modalVisible is true
    if (!audioEnabled || (inModal && !modalVisible)) {
      console.log('Audio blocked - audioEnabled:', audioEnabled, 'inModal:', inModal, 'modalVisible:', modalVisible);
      return;
    }
    
    try {
      // First ensure audio is enabled
      await Audio.setIsEnabledAsync(true);
      
      // Stop any current playback
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
        setIsPlaying(null);
      }
      
      // Create and play the audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${b64}` },
        { shouldPlay: true, volume: 1.0 }
      );
      
      soundRef.current = sound;
      setIsPlaying(messageId || 'unknown');
      
      // Set up completion listener
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(null);
        }
      });
      
      // Safety timeout - if audio doesn't fire completion event
      setTimeout(() => {
        if (soundRef.current && messageId === isPlaying) {
          setIsPlaying(null);
        }
      }, 30000); // 30 second max
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(null);
    }
  };

  /* ───────── helpers ───────── */
  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // helper to generate unique IDs for messages
  const genId = () => `${Date.now().toString()}-${Math.random().toString(36).substring(2, 6)}`;

  // Function to find and navigate to the next lesson
  const proceedToNextLesson = () => {
    // Get current units data
    const { units } = useLearning();
    
    // Ensure we have valid values
    const lessonId = currentLessonId ?? 1;
    const unitId = currentUnitId ?? 1;
    
    // Find current unit
    const currentUnit = units.find(u => u.id === unitId);
    if (!currentUnit) return;
    
    // Find next lesson in current unit
    let nextLesson = currentUnit.lessons.find(l => l.id === lessonId + 1 && !l.locked);
    let nextUnitId = unitId;

    // If no next lesson in current unit, look in next unit
    if (!nextLesson) {
      const nextUnitIndex = units.findIndex(u => u.id === unitId) + 1;
      if (nextUnitIndex < units.length) {
        const nextUnit = units[nextUnitIndex];
        if (nextUnit && nextUnit.unlocked) {
          // Find first unlocked lesson in next unit
          nextLesson = nextUnit.lessons.find(l => !l.locked);
          nextUnitId = nextUnit.id;
        }
      }
    }
    
    // Navigate to next lesson if found
    if (nextLesson) {
      router.push({
        pathname: '/conversation',
        params: {
          lessonId: nextLesson.id,
          unitId: nextUnitId,
          title: nextLesson.title,
          autoStart: 'true' // Add flag to indicate this is auto-navigation
        }
      });
    } else {
      // If no next lesson found, go back to home
      router.push({
        pathname: '/(tabs)',
        params: { 
          lessonCompleted: 'true',
          timestamp: Date.now().toString() // Force screen refresh with timestamp
        }
      });
    }
  };

  // Function to handle lesson completion
  const finishLesson = () => {
    // Get lesson and unit IDs with fallbacks
    const lessonId = currentLessonId ?? 1;
    const unitId = currentUnitId ?? 1;
    
    // Ensure the lesson is marked as complete in context
    if (!lessonComplete) {
      completeLesson(lessonId, unitId);
    }
    
    // Hide the modal
    setShowCompletionModal(false);
    
    // Navigate to the next lesson
    proceedToNextLesson();
  };

  // Handle API request for both text and audio
  const makeApiRequest = async (requestBody: any): Promise<void> => {
    try {
      // Get simple context message for the current lesson or use customContext if provided
      const contextMessage = customContext || (currentLessonId && currentUnitId 
        ? getLessonContext(currentLessonId, currentUnitId) 
        : "");

      // Prepare API request with simplified parameters
      const finalRequestBody = {
        ...requestBody,
        context: contextMessage,
        isSimulation: isSimulation
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalRequestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const rawData = await response.json();
      const { message } = parseApiResponse(rawData);
      
      // Detect lesson completion in the frontend only if not a simulation
      if (!isSimulation && (
          message.toLowerCase().includes('lesson complete') || 
          message.toLowerCase().includes('completed this lesson') ||
          message.toLowerCase().includes('you have completed this lesson')
        )) {
        setLessonComplete(true);
      }
      
      await addAssistantMessage(message);
    } catch (error) {
      console.error('API request error:', error);
      await addAssistantMessage('Sorry, I had trouble connecting. Please try again.', false);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse API responses with Lambda proxy unwrapping
  const parseApiResponse = (rawResponse: any): { message: string } => {
    let data = rawResponse;
    
    // Unwrap one or more nested Lambda proxy envelopes
    try {
      while (data.body && typeof data.body === 'string') {
        try {
          data = JSON.parse(data.body);
        } catch {
          break;
        }
      }
      
      if (!data.message) {
        return { message: 'Sorry, I encountered an issue. Let\'s continue our lesson.' };
      }
      
      return { 
        message: data.message
      };
    } catch {
      return { message: 'Sorry, I encountered an issue. Let\'s continue our lesson.' };
    }
  };
  
  // Helper to create and add an assistant message
  const addAssistantMessage = async (message: string, checkCompletion = true, autoPlay = true) => {
    // Check if the response indicates lesson completion
    if (checkCompletion && (
      message.toLowerCase().includes('lesson complete') || 
      message.toLowerCase().includes('completed this lesson') ||
      message.toLowerCase().includes('you have completed this lesson')
    )) {
      setLessonComplete(true);
    }
    
    // Create the message object
    const assistantMessage: Message = {
      id: genId(),
      text: message,
      isUser: false,
      role: 'assistant',
      content: message,
      audio: null // Initialize with no audio
    };
    
    // Get audio if enabled AND component is visible
    // For modal mode, explicitly check that modalVisible is true
    if (audioEnabled && (!inModal || modalVisible)) {
      try {
        console.log('Fetching TTS audio for assistant message');
        const audioB64 = await fetchTTSAudio(message);
        
        // Update the message with audio
        if (audioB64) {
          assistantMessage.audio = audioB64;
          
          // Play audio if requested AND component is still visible
          // Double-check visibility in case it changed during the async operation
          if (autoPlay && (!inModal || modalVisible)) {
            playAudio(audioB64, assistantMessage.id);
          }
        }
      } catch (err) {
        console.error('TTS error, continuing without audio');
      }
    } else {
      console.log('Skipping audio for assistant message - component not visible or audio disabled');
    }
    
    // Add the message to the conversation
    setMessages(prev => [...prev, assistantMessage]);
    
    return assistantMessage;
  };

  /* Hint content based on lesson */
  const getHintForLesson = (lessonId: number) => {
    const hints: Record<number, string> = {
      1: "Practice core Arabic sounds and basic pronunciation",
      2: "Try using present tense verbs in your conversation",
      3: "Focus on basic Arabic sentence structure patterns",
      4: "Use different greetings and farewells in your practice",
      5: "Work on using filler words to sound more natural",
      6: "Practice introducing yourself in different ways",
      7: "Share information about your background",
      8: "Describe yourself using different adjectives",
      9: "Ask questions about others to practice conversation",
      10: "Use small talk phrases in your conversation"
    };
    return hints[lessonId] || "Speak naturally or type to practice this lesson's Arabic phrases";
  };

  /* Get the appropriate context for the lesson based on the curriculum */
  const getLessonContext = (lessonId: number, unitId: number) => {
    // Curriculum mapping based on lessons.txt
    const curriculum: Record<number, Record<number, string>> = {
      1: {
        1: "Focus on core Arabic sounds and basic pronunciation. Help the student practice the most important phonetic elements.",
        2: "Focus on present tense basics. Guide the student through using common verbs in present tense forms.",
        3: "Focus on sentence structure and pronouns. Help the student with word order and simple sentence construction.",
        4: "Focus on greetings and farewells. Help the student practice various greeting expressions for different situations.",
        5: "Focus on fillers and speech flow. Teach the student how to sound more conversational with natural fillers."
      },
      2: {
        6: "Focus on introducing yourself. Help the student practice different self-introduction phrases.",
        7: "Focus on talking about background. Help the student describe where they're from, their studies, or work.",
        8: "Focus on describing yourself. Help the student describe personal qualities and characteristics.",
        9: "Focus on asking about others. Teach the student how to inquire about someone else's life, work, or interests.",
        10: "Focus on polite phrases and small talk. Guide the student through casual conversation topics."
      },
      3: {
        11: "Focus on talking about daily routine. Help the student describe their typical day activities.",
        12: "Focus on rooms and house items. Teach vocabulary related to the home environment.",
        13: "Focus on family members and living situation. Help the student talk about their family.",
        14: "Focus on hobbies at home. Guide the student in discussing leisure activities they enjoy at home.",
        15: "Focus on likes and dislikes. Help the student express preferences and opinions."
      },
      4: {
        16: "Focus on asking for directions. Teach the student how to navigate in an Arabic-speaking environment.",
        17: "Focus on describing places. Help the student talk about locations and their characteristics.",
        18: "Focus on running errands. Guide the student through common tasks like shopping and appointments.",
        19: "Focus on visiting landmarks or popular spots. Teach vocabulary for discussing tourist attractions.",
        20: "Focus on taxi or ride conversations. Help the student communicate effectively with drivers."
      },
      5: {
        21: "Focus on starting a conversation. Teach ice-breakers and conversation starters in Arabic.",
        22: "Focus on talking about friends and hanging out. Help discuss social relationships and activities.",
        23: "Focus on making and cancelling plans. Guide the student through scheduling interactions.",
        24: "Focus on giving compliments. Teach culturally appropriate ways to compliment others.",
        25: "Focus on agreeing and disagreeing politely. Help express opinions respectfully."
      },
      6: {
        26: "Focus on ordering food and drink. Teach restaurant and café vocabulary and phrases.",
        27: "Focus on grocery or market shopping. Help with vocabulary for food items and quantities.",
        28: "Focus on describing taste. Teach expressions for food preferences and flavors.",
        29: "Focus on bargaining and asking for prices. Guide through market negotiations.",
        30: "Focus on talking about favorite foods. Help discuss culinary preferences and dishes."
      },
      7: {
        31: "Focus on using transport. Teach vocabulary for different transportation modes.",
        32: "Focus on asking how to get somewhere. Help with directions and transportation questions.",
        33: "Focus on talking about traffic or delays. Teach expressions for transportation issues.",
        34: "Focus on buying tickets or renting vehicles. Guide through transportation transactions.",
        35: "Focus on missed rides or getting lost. Help with problem-solving in travel situations."
      },
      8: {
        36: "Focus on talking about work or school. Teach vocabulary for professional and academic settings.",
        37: "Focus on daily routines at work. Help discuss typical workplace activities.",
        38: "Focus on making appointments or changes. Guide through scheduling conversations.",
        39: "Focus on money, prices and budgeting. Teach financial vocabulary and expressions.",
        40: "Focus on future plans and ambitions. Help discuss goals and aspirations."
      },
      9: {
        41: "Focus on feeling sick. Teach vocabulary for describing illness and discomfort.",
        42: "Focus on at the pharmacy. Help with medicine-related vocabulary and requests.",
        43: "Focus on medical emergencies. Teach essential emergency phrases.",
        44: "Focus on explaining symptoms. Guide through health-related descriptions.",
        45: "Focus on asking for help. Teach phrases for requesting assistance in various situations."
      },
      10: {
        46: "Focus on traditions and identity. Help discuss cultural practices and personal identity.",
        47: "Focus on cultural celebrations and holidays. Teach vocabulary for festivities and customs.",
        48: "Focus on expressing emotions. Guide through conveying feelings in Arabic.",
        49: "Focus on telling stories and past experiences. Help with narrative expressions and past tense.",
        50: "Focus on local sayings and proverbs. Teach common expressions and their cultural significance."
      }
    };

    // Fallback for lessons not yet mapped
    if (!curriculum[unitId] || !curriculum[unitId][lessonId]) {
      return `Focus on lesson ${lessonId} content. Guide the student through practicing relevant Arabic expressions.`;
    }

    return curriculum[unitId][lessonId];
  };

  // Toggle between text and voice input modes
  const toggleMode = () => {
    setIsTextMode((b) => !b);
    !isTextMode && setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Simplified TTS function
  const fetchTTSAudio = async (text: string): Promise<string | null> => {
    try {
      console.log('Requesting TTS for:', text.substring(0, 30) + '...');
      
      const requestBody = { 
        text: text,
        voice: 'nova'
      };
      
      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        console.error('TTS API error:', response.status);
        return null;
      }
      
      const rawText = await response.text();
      
      try {
        const data = JSON.parse(rawText);
        if (data.audio && typeof data.audio === 'string' && data.audio.length > 100) {
          console.log('TTS audio received, length:', data.audio.length);
          return data.audio;
        } else {
          console.error('Invalid TTS audio data');
          return null;
        }
      } catch (err) {
        console.error('Error parsing TTS response:', err);
        return null;
      }
    } catch (err) {
      console.error('TTS fetch error:', err);
      return null;
    }
  };

  // Simplified initial message request
  const requestInitialMessage = async () => {
    try {
      setIsLoading(true);
      
      // Add initial loading message
      const initialAssistantMessage = {
        id: genId(),
        text: isSimulation ? 'Let me think about how to start our conversation...' : 'Let me think about how to start our lesson...',
        isUser: false,
        role: 'assistant',
        content: 'thinking'
      };
      
      setMessages([initialAssistantMessage]);
      
      // Get simple context for the current lesson or use customContext if provided
      const contextMessage = customContext || (currentLessonId && currentUnitId 
        ? getLessonContext(currentLessonId, currentUnitId) 
        : "");
      
      // Prepare a simple context message - make it more direct
      const initialContext = customContext 
        ? isSimulation ? 'Let\'s start our conversation practice.' : 'Let\'s start our free conversation practice.'
        : lessonId 
          ? `Start teaching lesson ${currentLessonId} right away with energy and enthusiasm. Jump straight into a key phrase or concept.` 
          : 'Let\'s practice Arabic conversation with short, engaging exchanges.';
        
      // Make the API request directly rather than through makeApiRequest
      try {
        console.log('Making initial API request...');
        
        // Simplified API request parameters
        const finalRequestBody = {
          text: initialContext,
          tts: true, // Request TTS explicitly
          messages: [],
          dialect: dialect?.id || 'egyptian',
          isInitial: true,
          context: contextMessage,
          isSimulation: isSimulation
        };
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalRequestBody)
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const rawData = await response.json();
        console.log('Initial API response received');
        
        const { message } = parseApiResponse(rawData);
        
        // Detect lesson completion in the frontend only if not simulation
        if (!isSimulation && (
            message.toLowerCase().includes('lesson complete') || 
            message.toLowerCase().includes('completed this lesson') ||
            message.toLowerCase().includes('you have completed this lesson')
          )) {
          setLessonComplete(true);
        }
        
        // Create the final message object
        const botMessage: Message = {
          id: genId(),
          text: message,
          isUser: false,
          role: 'assistant',
          content: message,
          audio: null // Initialize with no audio
        };
        
        // First update the UI with the message
        setMessages([botMessage]);
        
        // THEN get and play audio separately to ensure UI doesn't block
        if (audioEnabled && (!inModal || modalVisible)) {
          try {
            console.log('Requesting TTS audio for initial message...');
            // Small delay to ensure message is displayed first
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const audioB64 = await fetchTTSAudio(message);
            
            if (audioB64 && typeof audioB64 === 'string' && audioB64.length > 100) {
              console.log('Setting audio for initial message, length:', audioB64.length);
              
              // Update the message with audio in state
              setMessages(prev => [{
                ...prev[0],
                audio: audioB64
              }]);
              
              // Play audio with a small delay to ensure state update completes
              // Double-check visibility in case it changed during the async operation
              setTimeout(() => {
                // Only play if component is still visible
                if (audioEnabled && (!inModal || modalVisible)) {
                  console.log('Playing initial message audio...');
                  playAudio(audioB64, botMessage.id);
                } else {
                  console.log('Skipping audio playback - component no longer visible');
                }
              }, 500);
            } else {
              console.error('Failed to get valid audio for initial message');
            }
          } catch (err) {
            console.error('TTS failed for initial message:', err);
          }
        } else {
          console.log('Audio disabled for initial message');
        }
      } catch (error) {
        console.error('API request error:', error);
        
        // Fallback message
        const fallbackMessage = {
          id: genId(),
          text: 'Hello! I\'m your Arabic tutor. How can I help you practice today?',
          isUser: false,
          role: 'assistant',
          content: 'Hello! I\'m your Arabic tutor. How can I help you practice today?'
        };
        
        setMessages([fallbackMessage]);
      }
    } catch (error) {
      console.error('Initial message error:', error);
      
      // Fallback message if API fails
      setMessages([{
        id: genId(),
        text: 'Hello! I\'m your Arabic tutor. How can I help you practice today?',
        isUser: false,
        role: 'assistant',
        content: 'Hello! I\'m your Arabic tutor. How can I help you practice today?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified audio sending
  const sendAudio = async (uri: string) => {
    try {
      // Check if component is visible
      if (inModal && !modalVisible) {
        return;
      }
      
      // Update audio state
      if (inModal) {
        setAudioEnabled(modalVisible);
      }
      
      setIsLoading(true);
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      
      // Format conversation history for the API
      const historyMsgs = messages.map(m => ({ 
        role: m.isUser ? 'user' : 'assistant', 
        content: m.text 
      }));
      
      // Make API request
      await makeApiRequest({
        audio: base64,
        format: 'm4a',
        tts: false,
        messages: historyMsgs,
        dialect: dialect?.id || 'egyptian'
      });
    } catch (error) {
      console.error('Send audio error:', error);
      Alert.alert('Error', 'Failed to communicate with the server');
      setIsLoading(false);
    }
  };

  // Simplified text sending
  const sendText = async () => {
    // Don't allow sending if lesson is complete
    if (lessonComplete) return;

    try {
      // Check if component is visible
      if (inModal && !modalVisible) {
        return;
      }
      
      // Update audio state
      if (inModal) {
        setAudioEnabled(modalVisible);
      }
      
      // Don't send empty messages
      if (!inputText.trim()) return;
      
      const text = inputText.trim();
      setInputText('');

      const userMessage = {
        id: genId(),
        text: text,
        isUser: true,
        role: 'user',
        content: text
      };
      
      // Add user message to the conversation
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      
      // Format conversation history for the API
      const historyMsgs = [...messages, userMessage].map(m => ({ 
        role: m.isUser ? 'user' : 'assistant', 
        content: m.text 
      }));
      
      // Make API request
      await makeApiRequest({
        text: text,
        tts: false,
        messages: historyMsgs,
        dialect: dialect?.id || 'egyptian'
      });
    } catch (error) {
      console.error('Send text error:', error);
      Alert.alert('Error', 'Failed to communicate with the server');
      setIsLoading(false);
    }
  };

  /* ─── start / stop recording ─── */
  const startRecording = async () => {
    // Don't allow recording if lesson is complete
    if (lessonComplete) return;

    try {
      // stop playback when starting a recording
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        web: { mimeType: 'audio/mp4', bitsPerSecond: 128000 },
      });

      recordingRef.current = recording;
      setDuration(0);
      intervalRef.current && clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => setDuration((t) => t + 1), 1000);
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      Alert.alert('Recording Error', 'Could not start. Check permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    intervalRef.current && clearInterval(intervalRef.current);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
        playThroughEarpieceAndroid: false,
      });

      if (uri && !cancelledRef.current) {
        await sendAudio(uri);
      }
    } catch (e) {
      console.error('stopRecording', e);
    } finally {
      cancelledRef.current = false;
    }
  };

  /* ───────────── UI ───────────── */
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={[styles.container]}>
          
          {/* messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent, 
              { 
                paddingHorizontal: pad, 
                paddingBottom: 15 + insets.bottom
              }
            ]}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tintColor} />
                <ThemedText style={styles.loadingText}>
                  {inModal && !modalVisible 
                    ? "Ready when you are" 
                    : isLoading 
                      ? "Connecting to your tutor..." 
                      : "Ready to start your lesson"}
                </ThemedText>
              </View>
            ) : (
              messages.map((m) => (
                <View key={m.id} style={[
                  styles.messageWrapper,
                  m.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper
                ]}>
                  <View
                    style={[
                      styles.bubble,
                      m.isUser
                        ? [styles.userBubble, { backgroundColor: tintColor }]
                        : [styles.aiBubble, { backgroundColor: inputBackground }],
                    ]}
                  >
                    <Text style={[styles.messageText, { color: m.isUser ? '#fff' : textColor }]}>{m.text}</Text>
                    {!m.isUser && m.audio && typeof m.audio === 'string' && m.audio.length > 100 && (
                      <TouchableOpacity
                        style={[styles.playBtn, { backgroundColor: isPlaying === m.id ? '#ff3b30' : tintColor }]}
                        onPress={() => playAudio(m.audio!, m.id)}
                      >
                        <FontAwesome name={isPlaying === m.id ? "stop" : "play"} size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
            {isLoading && (
              <View style={[styles.loadingMessage, { backgroundColor: inputBackground }]}>
                <View style={styles.typingIndicator}>
                  <Animated.View 
                    style={[
                      styles.typingDot, 
                      { 
                        backgroundColor: tintColor,
                        opacity: typingDot1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1]
                        }),
                        transform: [{
                          translateY: typingDot1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -3]
                          })
                        }]
                      }
                    ]} 
                  />
                  <Animated.View 
                    style={[
                      styles.typingDot, 
                      { 
                        backgroundColor: tintColor,
                        opacity: typingDot2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1]
                        }),
                        transform: [{
                          translateY: typingDot2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -3]
                          })
                        }]
                      }
                    ]} 
                  />
                  <Animated.View 
                    style={[
                      styles.typingDot, 
                      { 
                        backgroundColor: tintColor,
                        opacity: typingDot3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1]
                        }),
                        transform: [{
                          translateY: typingDot3.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -3]
                          })
                        }]
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* input / mic row */}
          <View style={[
            styles.inputContainer, 
            { 
              paddingHorizontal: pad,
              paddingBottom: Math.max(insets.bottom, 10),
              borderTopColor: Platform.OS === 'ios' ? 
                (backgroundColor === '#000000' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') 
                : borderColor 
            }
          ]}>
            {lessonComplete ? (
              <TouchableOpacity 
                style={[styles.completionButton, { backgroundColor: tintColor }]}
                onPress={() => setShowCompletionModal(true)}
              >
                <ThemedText style={styles.buttonText}>Continue to Next Lesson 🎉</ThemedText>
              </TouchableOpacity>
            ) : isTextMode || inputText ? (
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: inputBackground },
                ]}
              >
                <TouchableOpacity style={styles.modeToggle} onPress={toggleMode}>
                  <Ionicons name="mic-outline" size={22} color={subtleText} />
                </TouchableOpacity>
                <TextInput
                  ref={inputRef}
                  style={[styles.textInput, { color: textColor }]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type your message..."
                  placeholderTextColor="#888"
                  returnKeyType="send"
                  onSubmitEditing={sendText}
                  multiline
                />
                {inputText ? (
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: tintColor }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      sendText();
                    }}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Ionicons name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.placeholder} />
                )}
              </View>
            ) : (
              <View style={styles.micRow}>
                {isRecording && (
                  <Animated.View style={[styles.slideBanner, { transform: [{ translateX: slideAnim }] }]}>
                    <FontAwesome name="arrow-left" size={20} color="#ff3b30" />
                    <Text style={styles.slideText}>{slideUI ? 'Release to cancel' : 'Slide left to cancel'}</Text>
                  </Animated.View>
                )}

                <TouchableOpacity style={[styles.keyBtn, { backgroundColor: inputBackground }]} onPress={toggleMode}>
                  <FontAwesome name="keyboard-o" size={22} color={textColor} />
                </TouchableOpacity>

                <View style={styles.micWrap} {...(isRecording ? panResponder.panHandlers : {})}>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.wave,
                      {
                        opacity: isRecording ? 0.5 : 0,
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  />
                  <TouchableOpacity
                    style={[styles.micBtn, { backgroundColor: slideUI ? '#ff3b30' : tintColor }]}
                    onPressIn={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      startRecording();
                    }}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <FontAwesome name="microphone" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.spacer} />

                {isRecording && (
                  <View style={styles.timerWrap}>
                    <Text style={styles.timer}>{fmt(duration)}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ThemedView>
      </SafeAreaView>
      
      {/* Lesson completion modal */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.completionModal}>
            <ThemedText style={styles.completionTitle}>Congratulations!</ThemedText>
            <ThemedText style={styles.lessonInfo}>
              You completed Lesson {currentLessonId ?? 1}: {
                (() => {
                  // Find the lesson title based on lesson ID
                  const lessonId = currentLessonId ?? 1;
                  const lessonTitles: Record<number, string> = {
                    1: "Core Sounds & Pronunciation",
                    2: "Present Tense Basics",
                    3: "Sentence Structure & Pronouns",
                    4: "Greetings & Farewells",
                    5: "Fillers & Speech Flow",
                    6: "Introducing Yourself",
                    7: "Talking About Background",
                    8: "Describing Yourself",
                    9: "Asking About Others",
                    10: "Polite Phrases & Small Talk",
                    11: "Talking About Daily Routine",
                    12: "Rooms & House Items",
                    13: "Family Members",
                    14: "Hobbies at Home",
                    15: "Likes & Dislikes",
                    16: "Asking for Directions",
                    17: "Describing Places",
                    18: "Running Errands",
                    19: "Visiting Landmarks",
                    20: "Taxi Conversations"
                  };
                  return lessonTitles[lessonId] || "Unknown Lesson";
                })()
              }
            </ThemedText>
            <ThemedText style={styles.completionText}>
              You've successfully practiced this lesson in {dialect?.name || 'Arabic'}.
              Great job with your pronunciation and vocabulary!
            </ThemedText>
            <View style={styles.statContainer}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{messages.filter(m => m.isUser).length}</ThemedText>
                <ThemedText style={styles.statLabel}>Phrases Practiced</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{dialect?.flag || '🇦🇪'}</ThemedText>
                <ThemedText style={styles.statLabel}>Dialect</ThemedText>
              </View>
              <View style={[styles.statItem, streakIncreased ? styles.streakIncreased : {}]}>
                <ThemedText style={styles.statValue}>
                  {streak} 🔥 {streakIncreased && '⬆️'}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.completionButton, { backgroundColor: tintColor }]}
              onPress={finishLesson}
            >
              <ThemedText style={styles.buttonText}>Continue</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
});

/* ─────────────── styles ───────────── */
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 0,
  },
  messagesContainer: { 
    flex: 1,
  },
  messagesContent: { 
    paddingTop: 15, 
    paddingBottom: 15,
    flexGrow: 1,
  },
  messageWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignItems: 'flex-start',
  },
  bubble: { 
    maxWidth: '80%', 
    padding: 14, 
    borderRadius: 20, 
    marginBottom: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: { 
    borderBottomRightRadius: 6,
  },
  aiBubble: { 
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  avatarContainer: {
    width: 34,
    height: 34,
    marginHorizontal: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  avatarText: {
    fontSize: 18,
  },
  inputContainer: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 8, 
    borderRadius: 25, 
    marginVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeToggle: {
    padding: 8,
  },
  textInput: { 
    flex: 1, 
    minHeight: 40, 
    maxHeight: 100, 
    paddingHorizontal: 10,
    fontSize: 16,
    lineHeight: 22,
  },
  placeholder: {
    width: 34,
  },
  sendBtn: { 
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modeBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  micRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginVertical: 10,
  },
  keyBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  micWrap: { 
    position: 'relative', 
    width: 80, 
    height: 80, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  micBtn: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  spacer: { 
    width: 44, 
    height: 44 
  },
  timerWrap: { 
    position: 'absolute', 
    bottom: -30, 
    alignSelf: 'center' 
  },
  timer: { 
    color: '#ff3b30', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  wave: { 
    position: 'absolute', 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(255,59,48,0.3)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  slideBanner: { 
    position: 'absolute', 
    top: -40, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  slideText: { 
    marginLeft: 6, 
    color: '#ff3b30', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  loadingMessage: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  typingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: 2,
    opacity: 0.7,
  },
  typingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 40,
    paddingHorizontal: 20
  },
  loadingText: { 
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    color: '#888' 
  },
  dialectBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  dialectFlag: { 
    fontSize: 16,
    marginRight: 8 
  },
  dialectText: { 
    fontSize: 15,
    fontWeight: '600' 
  },
  lessonIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  lessonText: {
    fontSize: 15,
    fontWeight: '600'
  },
  playBtn: { 
    marginTop: 8, 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  hintContainer: {
    marginBottom: 16,
  },
  hintBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  hintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  hintText: {
    marginLeft: 10,
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  completionModal: {
    width: '90%',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center'
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15
  },
  lessonInfo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  completionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 15,
    paddingHorizontal: 10
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5
  },
  statLabel: {
    fontSize: 14,
    color: '#888'
  },
  completionButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#888', 
    marginTop: 40 
  },
  streakIncreased: {
    backgroundColor: 'rgba(255,193,7,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.5)',
  },
  backButtonContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

// Debug function to test audio system
const troubleshootAudioSystem = async () => {
  try {
    console.log('Audio troubleshooting started');
    
    // 1. Check audio permissions
    const { status } = await Audio.requestPermissionsAsync();
    console.log('Audio permissions status:', status);
    
    // 2. Test audio system enablement
    const isEnabled = await Audio.setIsEnabledAsync(true);
    console.log('Audio system enabled:', isEnabled);
    
    // 3. Configure audio mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      interruptionModeIOS: 1,
      interruptionModeAndroid: 1,
      playThroughEarpieceAndroid: false
    });
    console.log('Audio mode configured');
    
    // 4. Test small sound
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/click.mp3'),
        { shouldPlay: true, volume: 1.0 }
      );
      console.log('Test sound playing');
      
      // Wait for completion
      await new Promise(resolve => {
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) {
            resolve(null);
          }
        });
        
        // Safety timeout
        setTimeout(resolve, 2000);
      });
      
      await sound.unloadAsync();
      console.log('Test sound completed');
      
      return true;
    } catch (e) {
      console.error('Test sound failed:', e);
      return false;
    }
  } catch (e) {
    console.error('Audio troubleshooting failed:', e);
    return false;
  }
};

export default VoiceChat;
