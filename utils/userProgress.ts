import { supabase } from '@/lib/supabase';

// Types for user progress
interface UserProgress {
  user_id: string;
  unit_id: number;
  lesson_id: number;
  completed_at: string;
}

interface UserStats {
  user_id: string;
  streak_days: number;
  last_active_date: string;
  total_lessons_completed: number;
  total_practice_minutes: number;
}

// Save completed lesson
export const saveCompletedLesson = async (
  unitId: number,
  lessonId: number
): Promise<boolean> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Check if this lesson is already completed
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select()
      .eq('user_id', user.id)
      .eq('unit_id', unitId)
      .eq('lesson_id', lessonId)
      .single();
    
    if (existingProgress) {
      // Lesson already completed
      return true;
    }
    
    // Insert new progress record
    const { error } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        unit_id: unitId,
        lesson_id: lessonId,
      });
    
    if (error) {
      return false;
    }
    
    // Update user stats
    await updateUserStats(user.id);
    
    return true;
  } catch (error) {
    return false;
  }
};

// Get all completed lessons for current user
export const getCompletedLessons = async (): Promise<UserProgress[]> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }
    
    // Get all completed lessons
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      return [];
    }
    
    return data as UserProgress[];
  } catch (error) {
    return [];
  }
};

// Get user stats
export const getUserStats = async (): Promise<UserStats | null> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // Get user stats
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      // If no stats exist yet, create them
      if (error.code === 'PGRST116') {
        return await createInitialUserStats(user.id);
      }
      
      return null;
    }
    
    return data as UserStats;
  } catch (error) {
    return null;
  }
};

// Create initial user stats
const createInitialUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    // First check if stats already exist
    const { data: existingStats, error: checkError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (!checkError && existingStats) {
      return existingStats as UserStats;
    }
    
    const initialStats = {
      user_id: userId,
      streak_days: 0, // Start with 0 day streak
      last_active_date: new Date().toISOString().split('T')[0], // Current date
      total_lessons_completed: 0,
      total_practice_minutes: 0
    };
    
    const { data, error } = await supabase
      .from('user_stats')
      .insert(initialStats)
      .select()
      .single();
    
    if (error) {
      // If it's a duplicate key error, the user already has stats
      // Try to fetch existing stats instead
      if (error.code === '23505') {
        const { data: existingStats, error: fetchError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (fetchError) {
          return null;
        }
        
        return existingStats as UserStats;
      }
      
      return null;
    }
    
    return data as UserStats;
  } catch (error) {
    return null;
  }
};

// Update user stats after completing a lesson
const updateUserStats = async (userId: string): Promise<boolean> => {
  try {
    // Get current stats
    let { data: currentStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      // If no stats exist yet, create them
      if (fetchError.code === 'PGRST116') {
        try {
          await createInitialUserStats(userId);
          return true;
        } catch (createError) {
          // If there's an error creating stats (like duplicate key),
          // try fetching them one more time in case they were created by another process
          const { data: retryStats, error: retryError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (retryError) {
            return false;
          }
          
          // If we got stats, proceed with the update below using retryStats instead
          currentStats = retryStats;
        }
      } else {
        return false;
      }
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Parse the last active date
    const lastActiveDate = new Date(currentStats.last_active_date);
    // Set to midnight to ensure proper day comparison
    lastActiveDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference between last active and today
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const daysDifference = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate streak
    let newStreak = currentStats.streak_days;
    
    if (daysDifference === 0) {
      // Same day, maintain streak
      // No change to streak
    } else if (daysDifference === 1) {
      // Consecutive day, increment streak
      newStreak += 1;
    } else {
      // More than one day passed, reset streak to 1
      // We set to 1 (not 0) because completing a lesson today counts as 1 day streak
      newStreak = 1;
    }
    
    // Update stats with new streak value and last active date (today)
    const { error: updateError } = await supabase
      .from('user_stats')
      .update({
        streak_days: newStreak,
        last_active_date: today,
        total_lessons_completed: currentStats.total_lessons_completed + 1,
        total_practice_minutes: currentStats.total_practice_minutes + 5
      })
      .eq('user_id', userId);
    
    if (updateError) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Add practice minutes to user stats
export const addPracticeMinutes = async (minutes: number): Promise<boolean> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Get current stats
    const { data: currentStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) {
      // If no stats exist yet, create them
      if (fetchError.code === 'PGRST116') {
        await createInitialUserStats(user.id);
        return true;
      }
      
      return false;
    }
    
    // Update practice minutes
    const { error: updateError } = await supabase
      .from('user_stats')
      .update({
        total_practice_minutes: currentStats.total_practice_minutes + minutes
      })
      .eq('user_id', user.id);
    
    if (updateError) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Check and update user streak status
export const checkAndUpdateStreak = async (): Promise<number> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return 0;
    }
    
    // Get current stats
    const { data: currentStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) {
      // If no stats exist yet, create them
      if (fetchError.code === 'PGRST116') {
        const newStats = await createInitialUserStats(user.id);
        return newStats?.streak_days || 0;
      }
      
      return 0;
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // If already logged in today, no need to check for streak reset
    if (today === currentStats.last_active_date) {
      return currentStats.streak_days;
    }
    
    // Parse the last active date
    const lastActiveDate = new Date(currentStats.last_active_date);
    lastActiveDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const daysDifference = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If more than 1 day has passed without completing a lesson, reset streak to 0
    // The streak will be set to 1 when they complete their first lesson
    if (daysDifference > 1) {
      // Reset streak to 0 since user hasn't completed a lesson in more than a day
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({
          streak_days: 0,
          last_active_date: today
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        return currentStats.streak_days; // Return old value if update fails
      }
      
      return 0; // Return new reset streak value
    }
    
    // Just update the last_active_date
    // Note: we are NOT incrementing streak here - that only happens on lesson completion
    const { error: updateError } = await supabase
      .from('user_stats')
      .update({
        last_active_date: today
      })
      .eq('user_id', user.id);
    
    // Return current streak
    return currentStats.streak_days;
  } catch (error) {
    return 0;
  }
}; 