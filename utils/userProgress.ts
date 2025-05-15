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
      console.error('No authenticated user found');
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
      console.log(`Lesson ${lessonId} in unit ${unitId} already completed`);
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
      console.error('Error saving lesson progress:', error);
      return false;
    }
    
    // Update user stats
    await updateUserStats(user.id);
    
    return true;
  } catch (error) {
    console.error('Error in saveCompletedLesson:', error);
    return false;
  }
};

// Get all completed lessons for current user
export const getCompletedLessons = async (): Promise<UserProgress[]> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return [];
    }
    
    // Get all completed lessons
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching completed lessons:', error);
      return [];
    }
    
    return data as UserProgress[];
  } catch (error) {
    console.error('Error in getCompletedLessons:', error);
    return [];
  }
};

// Get user stats
export const getUserStats = async (): Promise<UserStats | null> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
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
      
      console.error('Error fetching user stats:', error);
      return null;
    }
    
    return data as UserStats;
  } catch (error) {
    console.error('Error in getUserStats:', error);
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
      console.log('User stats already exist, returning existing stats');
      return existingStats as UserStats;
    }
    
    const initialStats = {
      user_id: userId,
      streak_days: 0, // Start with 0 day streak (was 1)
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
      console.error('Error creating initial user stats:', error);
      
      // If it's a duplicate key error, the user already has stats
      // Try to fetch existing stats instead
      if (error.code === '23505') {
        console.log('User stats already exist, fetching them instead');
        const { data: existingStats, error: fetchError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (fetchError) {
          console.error('Error fetching existing user stats:', fetchError);
          return null;
        }
        
        return existingStats as UserStats;
      }
      
      return null;
    }
    
    return data as UserStats;
  } catch (error) {
    console.error('Error in createInitialUserStats:', error);
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
            console.error('Final error fetching user stats after creation attempt:', retryError);
            return false;
          }
          
          // If we got stats, proceed with the update below using retryStats instead
          currentStats = retryStats;
        }
      } else {
        console.error('Error fetching current user stats:', fetchError);
        return false;
      }
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Parse the last active date
    const lastActiveDate = new Date(currentStats.last_active_date);
    // Set to midnight to ensure proper day comparison
    lastActiveDate.setHours(0, 0, 0, 0);
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Calculate days difference between last active and today
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const daysDifference = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`Last active: ${currentStats.last_active_date}, Today: ${today}, Days difference: ${daysDifference}`);
    
    // Calculate streak
    let newStreak = currentStats.streak_days;
    
    if (daysDifference === 0) {
      // Same day, maintain streak
      console.log(`Same day activity, maintaining streak at ${newStreak}`);
      // No change to streak
    } else if (daysDifference === 1) {
      // Consecutive day, increment streak
      newStreak += 1;
      console.log(`Consecutive day, incrementing streak to ${newStreak}`);
    } else {
      // More than one day passed, reset streak to 1
      newStreak = 1;
      console.log(`Streak broken (${daysDifference} days gap), resetting to ${newStreak}`);
    }
    
    // Update stats
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
      console.error('Error updating user stats:', updateError);
      return false;
    }
    
    console.log(`User stats updated: streak=${newStreak}, last_active=${today}`);
    return true;
  } catch (error) {
    console.error('Error in updateUserStats:', error);
    return false;
  }
};

// Add practice minutes to user stats
export const addPracticeMinutes = async (minutes: number): Promise<boolean> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
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
      
      console.error('Error fetching current user stats:', fetchError);
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
      console.error('Error updating practice minutes:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in addPracticeMinutes:', error);
    return false;
  }
};

// Check and update user streak status
export const checkAndUpdateStreak = async (): Promise<number> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
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
      
      console.error('Error fetching user stats:', fetchError);
      return 0;
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // If already logged in today, no need to update
    if (today === currentStats.last_active_date) {
      console.log('User already logged in today, streak maintained');
      return currentStats.streak_days;
    }
    
    // Parse the last active date
    const lastActiveDate = new Date(currentStats.last_active_date);
    lastActiveDate.setHours(0, 0, 0, 0);
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const daysDifference = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`Days since last activity: ${daysDifference}`);
    
    // If more than 1 day has passed, reset streak
    if (daysDifference > 1) {
      console.log(`Streak broken (${daysDifference} days gap), resetting to 1`);
      
      // Update stats with reset streak
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({
          streak_days: 1,
          last_active_date: today
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating streak:', updateError);
        return currentStats.streak_days; // Return old value if update fails
      }
      
      return 1; // Return new streak value
    }
    
    // User opened the app on a consecutive day, update last_active_date but don't increment streak yet
    // (streak will increment when they complete a lesson)
    const { error: updateError } = await supabase
      .from('user_stats')
      .update({
        last_active_date: today
      })
      .eq('user_id', user.id);
    
    if (updateError) {
      console.error('Error updating last active date:', updateError);
    }
    
    // Return current streak
    return currentStats.streak_days;
  } catch (error) {
    console.error('Error in checkAndUpdateStreak:', error);
    return 0;
  }
}; 