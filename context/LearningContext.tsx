import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { getCompletedLessons, saveCompletedLesson, getUserStats, checkAndUpdateStreak } from '@/utils/userProgress';
import { supabase } from '@/lib/supabase';

// Define types for our learning data
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

interface LearningContextType {
  units: Unit[];
  streak: number;
  completedLessons: number;
  totalLessons: number;
  progress: number;
  completeLesson: (lessonId: number, unitId: number) => void;
  resetProgress: () => void;
  isLoading: boolean;
  syncWithSupabase: () => Promise<void>;
}

// Create the context
const LearningContext = createContext<LearningContextType | undefined>(undefined);

// Initial units data based on curriculum
export const initialUnits: Unit[] = [
  {
    id: 1,
    title: "Pronunciation & Foundations",
    completed: false,
    unlocked: true,
    lessons: [
      { id: 1, title: "Core Sounds & Pronunciation", completed: false, locked: false },
      { id: 2, title: "Present Tense Basics", completed: false, locked: true },
      { id: 3, title: "Sentence Structure & Pronouns", completed: false, locked: true },
      { id: 4, title: "Greetings & Farewells", completed: false, locked: true },
      { id: 5, title: "Fillers & Speech Flow", completed: false, locked: true },
    ]
  },
  {
    id: 2,
    title: "Introductions & Identity",
    completed: false,
    unlocked: false,
    lessons: [
      { id: 6, title: "Introducing Yourself", completed: false, locked: true },
      { id: 7, title: "Talking About Background", completed: false, locked: true },
      { id: 8, title: "Describing Yourself", completed: false, locked: true },
      { id: 9, title: "Asking About Others", completed: false, locked: true },
      { id: 10, title: "Polite Phrases & Small Talk", completed: false, locked: true },
    ]
  },
  {
    id: 3,
    title: "Home & Routine",
    completed: false,
    unlocked: false,
    lessons: [
      { id: 11, title: "Talking About Daily Routine", completed: false, locked: true },
      { id: 12, title: "Rooms & House Items", completed: false, locked: true },
      { id: 13, title: "Family Members & Living Situation", completed: false, locked: true },
      { id: 14, title: "Hobbies at Home", completed: false, locked: true },
      { id: 15, title: "Likes & Dislikes", completed: false, locked: true },
    ]
  },
  {
    id: 4,
    title: "Out in the City",
    completed: false,
    unlocked: false,
    lessons: [
      { id: 16, title: "Asking for Directions", completed: false, locked: true },
      { id: 17, title: "Describing Places", completed: false, locked: true },
      { id: 18, title: "Running Errands", completed: false, locked: true },
      { id: 19, title: "Visiting Landmarks or Popular Spots", completed: false, locked: true },
      { id: 20, title: "Taxi or Ride Conversations", completed: false, locked: true },
    ]
  },
  {
    id: 5,
    title: "Socializing & People",
    completed: false,
    unlocked: false,
    lessons: [
      { id: 21, title: "Starting a Conversation", completed: false, locked: true },
      { id: 22, title: "Talking About Friends & Hanging Out", completed: false, locked: true },
      { id: 23, title: "Making & Cancelling Plans", completed: false, locked: true },
      { id: 24, title: "Giving Compliments", completed: false, locked: true },
      { id: 25, title: "Agreeing & Disagreeing Politely", completed: false, locked: true },
    ]
  },
  {
    id: 6,
    title: "Food & Shopping",
    completed: false,
    unlocked: false,
    lessons: [
      { id: 26, title: "Ordering Food & Drink", completed: false, locked: true },
      { id: 27, title: "Grocery or Market Shopping", completed: false, locked: true },
      { id: 28, title: "Describing Taste", completed: false, locked: true },
      { id: 29, title: "Bargaining & Asking for Prices", completed: false, locked: true },
      { id: 30, title: "Talking About Favorite Foods", completed: false, locked: true },
    ]
  },
  {
    id: 7,
    title: "Transportation & Navigation",
    completed: false,
    unlocked: false,
    lessons: [
      { id: 31, title: "Using Transport", completed: false, locked: true },
      { id: 32, title: "Asking How to Get Somewhere", completed: false, locked: true },
      { id: 33, title: "Talking About Traffic or Delays", completed: false, locked: true },
      { id: 34, title: "Buying Tickets or Renting Vehicles", completed: false, locked: true },
      { id: 35, title: "Missed Rides or Getting Lost", completed: false, locked: true },
    ]
  },
  {
    id: 8,
    title: "Work & Daily Life",
    completed: false,
    unlocked: false,
    lessons: [
      { id: 36, title: "Talking About Work or School", completed: false, locked: true },
      { id: 37, title: "Daily Routines at Work", completed: false, locked: true },
      { id: 38, title: "Making Appointments or Changes", completed: false, locked: true },
      { id: 39, title: "Money, Prices & Budgeting", completed: false, locked: true },
      { id: 40, title: "Future Plans & Ambitions", completed: false, locked: true },
    ]
  },
  {
    id: 9,
    title: "Health, Emergencies & Help",
    completed: false,
    unlocked: false,
    lessons: [
      { id: 41, title: "Feeling Sick", completed: false, locked: true },
      { id: 42, title: "At the Pharmacy", completed: false, locked: true },
      { id: 43, title: "Medical Emergencies", completed: false, locked: true },
      { id: 44, title: "Explaining Symptoms", completed: false, locked: true },
      { id: 45, title: "Asking for Help", completed: false, locked: true },
    ]
  },
  {
    id: 10,
    title: "Deep Conversation & Culture",
    completed: false,
    unlocked: false,
    lessons: [
      { id: 46, title: "Traditions & Identity", completed: false, locked: true },
      { id: 47, title: "Cultural Celebrations & Holidays", completed: false, locked: true },
      { id: 48, title: "Expressing Emotions", completed: false, locked: true },
      { id: 49, title: "Telling Stories & Past Experiences", completed: false, locked: true },
      { id: 50, title: "Local Sayings & Proverbs", completed: false, locked: true },
    ]
  }
];

// Count total lessons
const countTotalLessons = (units: Unit[]) => {
  return units.reduce((total, unit) => total + unit.lessons.length, 0);
};

// Count completed lessons
const countCompletedLessons = (units: Unit[]) => {
  return units.reduce((total, unit) => {
    return total + unit.lessons.filter(lesson => lesson.completed).length;
  }, 0);
};

// Provider component
export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [streak, setStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const totalLessons = countTotalLessons(units);
  const completedLessons = countCompletedLessons(units);
  const progress = totalLessons > 0 ? completedLessons / totalLessons : 0;

  // Check streak on mount
  useEffect(() => {
    const checkStreak = async () => {
      try {
        const currentStreak = await checkAndUpdateStreak();
        setStreak(currentStreak);
        console.log(`Initial streak check: ${currentStreak} days`);
      } catch (error) {
        console.error('Error checking streak on mount:', error);
      }
    };
    
    checkStreak();
  }, []);

  // Sync progress with Supabase
  const syncWithSupabase = async () => {
    try {
      console.log("syncWithSupabase - starting sync");
      setIsLoading(true);
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("syncWithSupabase - no active session, using default data");
        // No active session, use initial data
        setUnits(initialUnits);
        setIsLoading(false);
        return;
      }
      
      // Get completed lessons from Supabase
      const completedLessons = await getCompletedLessons();
      console.log(`syncWithSupabase - fetched ${completedLessons.length} completed lessons`);
      
      // Get user stats for streak
      const stats = await getUserStats();
      
      if (stats) {
        console.log(`syncWithSupabase - user has a streak of ${stats.streak_days} days`);
        setStreak(stats.streak_days);
      }
      
      if (completedLessons.length === 0) {
        // No completed lessons in the database yet
        console.log("syncWithSupabase - no completed lessons found, using default progress");
        setUnits(initialUnits); // Ensure we set units even if no progress
        setIsLoading(false);
        return;
      }
      
      // Create a new units array with completed lessons marked
      const updatedUnits = JSON.parse(JSON.stringify(initialUnits)) as Unit[];
      
      // First, mark all completed lessons
      completedLessons.forEach(progress => {
        const unitIndex = updatedUnits.findIndex(u => u.id === progress.unit_id);
        if (unitIndex >= 0) {
          const lessonIndex = updatedUnits[unitIndex].lessons.findIndex(l => l.id === progress.lesson_id);
          if (lessonIndex >= 0) {
            updatedUnits[unitIndex].lessons[lessonIndex].completed = true;
          }
        }
      });
      
      // Next, unlock appropriate lessons and units
      updatedUnits.forEach((unit, unitIndex) => {
        // Check if all lessons in the unit are completed
        const allLessonsCompleted = unit.lessons.every(lesson => lesson.completed);
        unit.completed = allLessonsCompleted;
        
        // Unlock the next unit if this unit is completed
        if (allLessonsCompleted && unitIndex < updatedUnits.length - 1) {
          updatedUnits[unitIndex + 1].unlocked = true;
          // Unlock the first lesson of the next unit
          if (updatedUnits[unitIndex + 1].lessons.length > 0) {
            updatedUnits[unitIndex + 1].lessons[0].locked = false;
          }
        }
        
        // Unlock the next lesson if the previous one is completed
        unit.lessons.forEach((lesson, lessonIndex) => {
          if (lessonIndex > 0 && unit.lessons[lessonIndex - 1].completed) {
            lesson.locked = false;
          }
        });
      });
      
      console.log("syncWithSupabase - updating unit data with progress");
      setUnits(updatedUnits);
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      // In case of error, just use the initial units to avoid showing a loading screen forever
      console.log("syncWithSupabase - error occurred, falling back to default data");
      setUnits(initialUnits);
    } finally {
      console.log("syncWithSupabase - finished, setting isLoading to false");
      setIsLoading(false);
    }
  };

  // Complete a lesson and update progress
  const completeLesson = useCallback(async (lessonId: number, unitId: number) => {
    console.log(`Completing lesson: ${lessonId} in unit: ${unitId}`);
    
    // First save to Supabase
    const saved = await saveCompletedLesson(unitId, lessonId);
    if (!saved) {
      console.warn('Failed to save progress to Supabase, updating local state only');
    }
    
    // Update local state
    const updatedUnits = units.map(unit => {
      if (unit.id === unitId) {
        const updatedLessons = unit.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return { ...lesson, completed: true };
          }
          
          // Unlock the next lesson if this one is completed
          if (lesson.id === lessonId + 1) {
            return { ...lesson, locked: false };
          }
          
          return lesson;
        });
        
        // Check if all lessons in the unit are completed
        const allCompleted = updatedLessons.every(lesson => lesson.completed);
        
        // If all lessons are completed, unlock the next unit
        if (allCompleted) {
          const nextUnitIndex = units.findIndex(u => u.id === unit.id) + 1;
          if (nextUnitIndex < units.length) {
            const nextUnit = units[nextUnitIndex];
            if (!nextUnit.unlocked) {
              units[nextUnitIndex] = {
                ...nextUnit,
                unlocked: true,
                lessons: nextUnit.lessons.map((lesson, index) => {
                  if (index === 0) {
                    return { ...lesson, locked: false };
                  }
                  return lesson;
                }),
              };
            }
          }
        }
        
        return {
          ...unit,
          completed: allCompleted,
          lessons: updatedLessons,
        };
      }
      return unit;
    });
    
    setUnits(updatedUnits);
    
    // Get updated stats for streak
    const stats = await getUserStats();
    if (stats) {
      setStreak(stats.streak_days);
    }
  }, [units]);

  // Reset all progress
  const resetProgress = useCallback(async () => {
    setUnits(initialUnits);
    setStreak(0);
    
    // TODO: Add Supabase reset functionality if needed
    // This would require deleting all user_progress entries
  }, []);

  return (
    <LearningContext.Provider
      value={{
        units,
        streak,
        completedLessons,
        totalLessons,
        progress,
        completeLesson,
        resetProgress,
        isLoading,
        syncWithSupabase,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
};

// Custom hook to use the learning context
export const useLearning = () => {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};

export default LearningContext; 