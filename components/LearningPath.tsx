import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Dimensions, Platform, Modal, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { router, useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FontAwesome5 } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLearning, initialUnits } from '@/context/LearningContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VoiceChat from './VoiceChat';
import { Audio } from 'expo-av';

// Define types for our curriculum data
interface Lesson {
  id: number;
  title: string;
  completed: boolean;
  locked: boolean;
}

interface Unit {
  id: number;
  title: string;
  lessons: Lesson[];
  completed: boolean;
  unlocked: boolean;
}

// Get screen width for responsive sizing
const screenWidth = Dimensions.get('window').width;
const nodeSize = 65;
const smallNodeSize = 12;
const verticalSpacing = 85;

// Icons for different lesson types
const LESSON_ICONS: { [key: number]: string; default: string } = {
  1: "comment", // Pronunciation
  2: "book", // Grammar
  3: "pencil-alt", // Writing
  4: "hands-helping", // Greetings
  5: "comment-dots", // Conversation
  6: "user", // Self introduction
  7: "globe-americas", // Background
  8: "id-card", // Describing yourself
  9: "users", // Asking about others
  10: "comment-alt", // Small talk
  11: "clock", // Daily routine
  12: "home", // Rooms & house
  13: "users", // Family
  14: "gamepad", // Hobbies
  15: "thumbs-up", // Likes & dislikes
  16: "map-signs", // Directions
  17: "map-marker-alt", // Places
  18: "shopping-bag", // Errands
  19: "landmark", // Landmarks
  20: "taxi", // Taxi conversations
  21: "comments", // Starting conversations
  22: "user-friends", // Friends
  23: "calendar-alt", // Plans
  24: "award", // Compliments
  25: "handshake", // Agreeing/disagreeing
  26: "utensils", // Food ordering
  27: "shopping-cart", // Shopping
  28: "cookie-bite", // Taste
  29: "money-bill-wave", // Bargaining
  30: "hamburger", // Favorite foods
  31: "bus", // Transport
  32: "route", // Getting somewhere
  33: "traffic-light", // Traffic
  34: "ticket-alt", // Tickets
  35: "compass", // Getting lost
  36: "briefcase", // Work
  37: "business-time", // Work routines
  38: "calendar-check", // Appointments
  39: "wallet", // Money
  40: "chart-line", // Future plans
  41: "head-side-cough", // Feeling sick
  42: "prescription-bottle-alt", // Pharmacy
  43: "ambulance", // Emergencies
  44: "stethoscope", // Symptoms
  45: "hands-helping", // Asking for help
  46: "flag", // Traditions
  47: "birthday-cake", // Celebrations
  48: "smile", // Emotions
  49: "book-open", // Stories
  50: "quote-right", // Proverbs
  default: "graduation-cap" // Default icon
};

// Get appropriate icon for a lesson
const getLessonIcon = (lessonId: number) => {
  return LESSON_ICONS[lessonId] || LESSON_ICONS.default;
};

const LessonNode = ({ 
  lesson, 
  unitId, 
  isCurrent,
  onStartLesson
}: { 
  lesson: Lesson; 
  unitId: number;
  isCurrent: boolean;
  onStartLesson: (lessonId: number, unitId: number) => void;
}) => {
  const accentColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  
  const handlePress = () => {
    if (!lesson.locked) {
      // Start the lesson directly instead of navigating
      onStartLesson(lesson.id, unitId);
    }
  };

  // Determine the style based on the lesson state
  const bubbleStyle = {
    backgroundColor: lesson.completed ? accentColor : backgroundColor,
    borderColor: lesson.locked ? '#ccc' : accentColor,
    borderWidth: 3,
  };

  // Add a glow effect for the current unlocked node
  const shadowStyle = isCurrent ? {
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
    transform: [{ scale: 1.1 }]
  } : {};

  // Get icon for this lesson
  const iconName = getLessonIcon(lesson.id);
  const iconColor = lesson.completed ? "#fff" : (lesson.locked ? "#ccc" : accentColor);

  return (
    <Pressable 
      onPress={handlePress}
      style={({ pressed }) => [
        styles.lessonNode,
        bubbleStyle,
        shadowStyle,
        { opacity: pressed ? 0.8 : 1 }
      ]}
    >
      <FontAwesome5 name={iconName} size={22} color={iconColor} />
      
      {/* Small lock indicator for locked lessons */}
      {lesson.locked && (
        <View style={styles.lockIndicator}>
          <FontAwesome5 name="lock" size={12} color="#fff" />
        </View>
      )}
      
      {/* Small number indicator */}
      <View style={styles.numberIndicator}>
        <ThemedText style={styles.numberText}>{lesson.id}</ThemedText>
      </View>
    </Pressable>
  );
};

// Component for the small connecting dots between nodes
const ConnectingDot = ({ top, left, completed }: { top: number; left: number; completed: boolean }) => {
  const accentColor = useThemeColor({}, 'tint');
  
  return (
    <View 
      style={[
        styles.connectingDot,
        { 
          top, 
          left,
          backgroundColor: completed ? accentColor : '#ccc',
          opacity: completed ? 0.8 : 0.4
        }
      ]}
    />
  );
};

const LearningPathSection = ({ 
  unit, 
  index, 
  animationDelay,
  onStartLesson
}: { 
  unit: Unit; 
  index: number;
  animationDelay: number;
  onStartLesson: (lessonId: number, unitId: number) => void;
}) => {
  // Calculate a staggered delay with both the animationDelay base and the index
  const delay = animationDelay + (index * 150);
  const centerX = screenWidth / 2 - nodeSize / 2;
  const accentColor = useThemeColor({}, 'tint');
  
  // Find the first unlocked but not completed lesson (current lesson)
  const currentLessonIndex = unit.lessons.findIndex(lesson => !lesson.locked && !lesson.completed);
  
  // Calculate lesson positions for a zigzag path
  const renderLessons = () => {
    return unit.lessons.map((lesson, i) => {
      // First lesson of each unit is centered
      if (i === 0) {
        return (
          <View 
            key={lesson.id} 
            style={[
              styles.lessonNodeWrapper,
              { 
                left: centerX,
                top: 0,
              }
            ]}
          >
            <LessonNode 
              lesson={lesson} 
              unitId={unit.id}
              isCurrent={i === currentLessonIndex} 
              onStartLesson={onStartLesson}
            />
          </View>
        );
      }
      
      // Determine position in a zigzag pattern
      const isEven = i % 2 === 0;
      
      // Calculate horizontal position - zigzag from center
      const offsetX = isEven ? -nodeSize - 30 : nodeSize + 30;
      const left = centerX + offsetX;
      
      // Calculate vertical position - each node is below the previous
      const top = i * verticalSpacing;
      
      return (
        <View 
          key={lesson.id} 
          style={[
            styles.lessonNodeWrapper,
            { 
              left,
              top,
            }
          ]}
        >
          <LessonNode 
            lesson={lesson} 
            unitId={unit.id} 
            isCurrent={i === currentLessonIndex}
            onStartLesson={onStartLesson}
          />
        </View>
      );
    });
  };
  
  // Render connecting dots between lessons
  const renderConnectingDots = () => {
    const dots = [];
    
    for (let i = 0; i < unit.lessons.length - 1; i++) {
      // Current and next lesson positions
      const isCurrentEven = i % 2 === 0;
      const isNextEven = (i + 1) % 2 === 0;
      
      let currentX, currentY, nextX, nextY;
      
      // First node is always centered
      if (i === 0) {
        currentX = centerX + nodeSize/2;
        currentY = nodeSize;
      } else {
        currentX = centerX + (isCurrentEven ? -nodeSize/2 - 30 : nodeSize + nodeSize/2 + 30);
        currentY = i * verticalSpacing + nodeSize/2;
      }
      
      // Next node position
      if (i + 1 === 0) {
        nextX = centerX + nodeSize/2;
        nextY = 0;
      } else {
        nextX = centerX + (isNextEven ? -nodeSize/2 - 30 : nodeSize + nodeSize/2 + 30);
        nextY = (i + 1) * verticalSpacing + nodeSize/2;
      }
      
      // Calculate positions for dots between nodes
      const distance = Math.sqrt(Math.pow(nextX - currentX, 2) + Math.pow(nextY - currentY, 2));
      const numDots = Math.floor(distance / 20); // One dot every 20px
      
      for (let j = 1; j <= numDots - 1; j++) {
        const ratio = j / numDots;
        const dotX = currentX + (nextX - currentX) * ratio - smallNodeSize/2;
        const dotY = currentY + (nextY - currentY) * ratio - smallNodeSize/2;
        
        dots.push(
          <ConnectingDot 
            key={`dot-${i}-${j}`} 
            top={dotY} 
            left={dotX}
            completed={unit.lessons[i].completed} 
          />
        );
      }
    }
    
    return dots;
  };
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).springify()} 
      style={styles.unitContainer}
    >
      <ThemedView style={styles.unitHeader}>
        <ThemedText type="subtitle" style={styles.unitTitle}>
          {unit.title}
        </ThemedText>
        {!unit.unlocked && (
          <View style={[styles.unitLockBadge, { backgroundColor: accentColor }]}>
            <FontAwesome5 name="lock" size={12} color="#fff" />
          </View>
        )}
      </ThemedView>
      
      <View style={[
        styles.pathContainer,
        { height: Math.max(unit.lessons.length * verticalSpacing, verticalSpacing) }
      ]}>
        {renderConnectingDots()}
        {renderLessons()}
      </View>
    </Animated.View>
  );
};

export const LearningPath = () => {
  const insets = useSafeAreaInsets();
  const { units, isLoading } = useLearning();
  const router = useRouter();
  const accentColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  
  // State for animations
  const [refreshKey, setRefreshKey] = useState(0);
  const [animationDelay, setAnimationDelay] = useState(100);
  // Add local loading state with a timeout
  const [showLoading, setShowLoading] = useState(true);
  
  // Use initialUnits as fallback if units array is empty
  const displayUnits = units.length > 0 ? units : initialUnits;
  
  // State for modal conversation
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<number | undefined>();
  const [currentUnitId, setCurrentUnitId] = useState<number | undefined>();
  const [currentLessonTitle, setCurrentLessonTitle] = useState<string>('Lesson');
  
  // Ref for voice chat component
  const voiceChatRef = useRef<{ stopAllAudio: () => Promise<boolean> }>(null);
  
  // Debug logging
  useEffect(() => {
    console.log("LearningPath component - isLoading:", isLoading);
    console.log("LearningPath component - units count:", displayUnits.length);
  }, [isLoading, displayUnits]);
  
  // Set a timeout to stop showing loading state after 2 seconds
  useEffect(() => {
    if (showLoading) {
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showLoading]);
  
  // Function to start a lesson directly
  const startLesson = (lessonId: number, unitId: number) => {
    // Find the lesson title
    const unit = units.find(u => u.id === unitId);
    const lesson = unit?.lessons.find(l => l.id === lessonId);
    const title = lesson?.title || "Lesson";
    
    console.log(`Starting lesson ${lessonId} in unit ${unitId} with title: ${title}`);
    
    // Set the current lesson info
    setCurrentLessonId(lessonId);
    setCurrentUnitId(unitId);
    setCurrentLessonTitle(title);
    
    // Show the conversation modal
    setShowConversationModal(true);
  };
  
  // Function to close the conversation modal
  const closeConversation = () => {
    // Kill all audio immediately in the most aggressive way possible
    console.log("Forcefully disabling audio system before closing modal");
    
    // First disable the entire audio system
    Audio.setIsEnabledAsync(false);
    
    // Force stop any playing audio via the ref
    if (voiceChatRef.current) {
      voiceChatRef.current.stopAllAudio();
    }
    
    // Close the modal immediately - don't wait for audio to finish cleanup
    setShowConversationModal(false);
    
    // Re-enable audio system after a longer delay to ensure everything is cleaned up
    setTimeout(() => {
      Audio.setIsEnabledAsync(true);
    }, 1000);
  };
  
  // Function to handle lesson completion
  const handleLessonCompleted = () => {
    console.log("Lesson completed in modal, showing completion message");
    // User will close the modal manually when they're ready
    // Don't automatically close the modal
  };
  
  // Force re-render on screen focus to trigger animations
  useFocusEffect(
    React.useCallback(() => {
      // Update the key to force re-render and trigger animations
      setRefreshKey(prev => prev + 1);
      // Reset animation delay to start animations from beginning
      setAnimationDelay(100);
      // Reset loading state
      setShowLoading(true);
      return () => {};
    }, [])
  );
  
  // Show loading state only for the first 2 seconds or if explicitly loading
  if ((isLoading && showLoading) || (showLoading && displayUnits.length === 0)) {
    console.log("LearningPath is in loading state");
    return (
      <View style={[styles.loadingContainer, { paddingBottom: insets.bottom }]}>
        <FontAwesome5 name="book-reader" size={40} color={accentColor} style={{ marginBottom: 20 }} />
        <ThemedText style={styles.loadingText}>Loading your learning path...</ThemedText>
      </View>
    );
  }
  
  if (!displayUnits || displayUnits.length === 0) {
    console.log("LearningPath has no units");
    return (
      <View style={[styles.loadingContainer, { paddingBottom: insets.bottom }]}>
        <FontAwesome5 name="exclamation-circle" size={40} color={accentColor} style={{ marginBottom: 20 }} />
        <ThemedText style={styles.loadingText}>No lessons available. Please try again later.</ThemedText>
      </View>
    );
  }
  
  console.log("LearningPath rendering with units:", displayUnits.length);
  
  return (
    <>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { 
            paddingBottom: insets.bottom + 40,
            paddingLeft: Math.max(insets.left + 16, 16),
            paddingRight: Math.max(insets.right + 16, 16)
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {displayUnits.map((unit, index) => (
          <LearningPathSection 
            key={`unit-${unit.id}-${refreshKey}`}
            unit={unit} 
            index={index}
            animationDelay={animationDelay}
            onStartLesson={startLesson}
          />
        ))}
        <View style={styles.footer} />
      </ScrollView>
      
      {/* Conversation Modal */}
      <Modal
        visible={showConversationModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ThemedView style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { paddingTop: insets.top || 16 }]}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeConversation}
            >
              <FontAwesome5 name="times" size={20} color={textColor} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>
          <VoiceChat 
            ref={voiceChatRef}
            lessonId={currentLessonId} 
            unitId={currentUnitId} 
            inModal={true}
            modalVisible={showConversationModal}
            onLessonCompleted={handleLessonCompleted}
          />
        </ThemedView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
  },
  unitContainer: {
    marginBottom: 24,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  unitTitle: {
    textAlign: 'center',
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  unitLockBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  pathContainer: {
    position: 'relative',
    width: '100%',
  },
  lessonNodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    width: nodeSize,
    height: nodeSize,
    zIndex: 2,
  },
  lessonNode: {
    width: nodeSize,
    height: nodeSize,
    borderRadius: nodeSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  lockIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  numberIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  numberText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  connectingDot: {
    position: 'absolute',
    width: smallNodeSize,
    height: smallNodeSize,
    borderRadius: smallNodeSize / 2,
    zIndex: 1,
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
  },
  footer: {
    height: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LearningPath; 