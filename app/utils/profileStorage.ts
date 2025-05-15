import { supabase } from '@/lib/supabase';

// Storage keys
export const USER_NAME_KEY = 'user_name';
export const NATIVE_LANGUAGE_KEY = 'native_language';
export const DIALECT_KEY = 'dialect';
export const ARABIC_LEVEL_KEY = 'arabic_level';
export const LEARNING_SOURCE_KEY = 'learning_source';
export const DAILY_GOAL_KEY = 'daily_goal_minutes';

// User profile type
export interface UserProfile {
  name?: string;
  native_language?: string;
  dialect?: string;
  arabic_level?: string;
  learning_source?: string;
  daily_goal_minutes?: number;
  interests?: string[];
  skills?: string[];
}

/**
 * Save profile data to Supabase database
 */
export const saveProfileData = async (key: string, value: any): Promise<void> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('User not authenticated');
    }
    
    // Map storage key to database column
    const columnMap: Record<string, string> = {
      [USER_NAME_KEY]: 'name',
      [NATIVE_LANGUAGE_KEY]: 'native_language',
      [DIALECT_KEY]: 'dialect',
      [ARABIC_LEVEL_KEY]: 'arabic_level',
      [LEARNING_SOURCE_KEY]: 'learning_source',
      [DAILY_GOAL_KEY]: 'daily_goal_minutes'
    };
    
    const column = columnMap[key];
    if (!column) {
      console.error(`No column mapping found for key: ${key}`);
      throw new Error(`Invalid profile field: ${key}`);
    }
    
    // Check if user already has a profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (existingProfile) {
      // Update the existing profile
      const { error } = await supabase
        .from('user_profiles')
        .update({ [column]: value })
        .eq('user_id', user.id);
      
      if (error) throw error;
    } else {
      // Create a new profile
      const { error } = await supabase
        .from('user_profiles')
        .insert([{ 
          user_id: user.id, 
          [column]: value 
        }]);
      
      if (error) throw error;
    }
    
    console.log(`Successfully saved ${key} (${column}): ${value}`);
  } catch (error) {
    console.error('Error saving profile data', error);
    throw error;
  }
};

/**
 * Get all profile data from Supabase for the current user
 */
export const getAllProfileData = async (): Promise<UserProfile> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return {};
    }
    
    // Fetch the user's profile from the database
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return {};
    }
    
    if (!data) {
      console.log('No profile data found for user');
      return {};
    }
    
    // Map the database fields to our UserProfile interface
    return {
      name: data.name,
      native_language: data.native_language,
      dialect: data.dialect,
      arabic_level: data.arabic_level,
      learning_source: data.learning_source,
      daily_goal_minutes: data.daily_goal_minutes,
      interests: data.interests,
      skills: data.skills
    };
  } catch (error) {
    console.error('Error getting profile data', error);
    return {};
  }
};

export default {
  USER_NAME_KEY,
  NATIVE_LANGUAGE_KEY,
  DIALECT_KEY,
  ARABIC_LEVEL_KEY,
  LEARNING_SOURCE_KEY,
  DAILY_GOAL_KEY,
  saveProfileData,
  getAllProfileData
}; 