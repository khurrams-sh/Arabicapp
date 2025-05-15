import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Storage keys
export const USER_NAME_KEY = 'user_name';
export const NATIVE_LANGUAGE_KEY = 'native_language';
export const DIALECT_KEY = 'dialect';
export const ARABIC_LEVEL_KEY = 'arabic_level';
export const LEARNING_SOURCE_KEY = 'learning_source';
export const SKILLS_KEY = 'skills';
export const INTERESTS_KEY = 'interests';
export const CHALLENGES_KEY = 'challenges';
export const BUSINESS_TOPICS_KEY = 'business_topics';
export const DAILY_GOAL_KEY = 'daily_goal';
export const REMINDER_TIME_KEY = 'reminder_time';

// Define the profile data structure
export interface UserProfile {
  id?: string;
  user_id: string;
  name?: string;
  native_language?: string;
  dialect?: string;
  arabic_level?: string;
  learning_source?: string;
  skills?: string[];
  interests?: string[];
  challenges?: string[];
  business_topics?: string[];
  daily_goal_minutes?: number;
  reminder_time?: { hour: number; minute: number };
  created_at?: string;
  updated_at?: string;
}

// Simple function to save profile data both locally and to Supabase
export async function saveProfileData(key: string, value: any) {
  try {
    // First save locally for quick access
    await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    // Map storage key to database column
    const columnMap: Record<string, string> = {
      [USER_NAME_KEY]: 'name',
      [NATIVE_LANGUAGE_KEY]: 'native_language',
      [DIALECT_KEY]: 'dialect',
      [ARABIC_LEVEL_KEY]: 'arabic_level',
      [LEARNING_SOURCE_KEY]: 'learning_source',
      [SKILLS_KEY]: 'skills',
      [INTERESTS_KEY]: 'interests',
      [CHALLENGES_KEY]: 'challenges',
      [BUSINESS_TOPICS_KEY]: 'business_topics',
      [DAILY_GOAL_KEY]: 'daily_goal_minutes',
      [REMINDER_TIME_KEY]: 'reminder_time'
    };
    
    const column = columnMap[key];
    if (!column) return;
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (existingProfile) {
      // Update existing profile
      await supabase
        .from('user_profiles')
        .update({ [column]: value, updated_at: new Date() })
        .eq('user_id', user.id);
    } else {
      // Create new profile
      await supabase
        .from('user_profiles')
        .insert({ user_id: user.id, [column]: value });
    }
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

// Get profile data (prioritize local storage for speed, fall back to Supabase)
export async function getProfileData(key: string) {
  try {
    // First try to get from local storage
    const localValue = await AsyncStorage.getItem(key);
    
    if (localValue !== null) {
      // For arrays and objects, parse the JSON
      try {
        return JSON.parse(localValue);
      } catch {
        return localValue;
      }
    }
    
    // If not in local storage, try to get from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Map storage key to database column
    const columnMap: Record<string, string> = {
      [USER_NAME_KEY]: 'name',
      [NATIVE_LANGUAGE_KEY]: 'native_language',
      [DIALECT_KEY]: 'dialect',
      [ARABIC_LEVEL_KEY]: 'arabic_level',
      [LEARNING_SOURCE_KEY]: 'learning_source',
      [SKILLS_KEY]: 'skills',
      [INTERESTS_KEY]: 'interests',
      [CHALLENGES_KEY]: 'challenges',
      [BUSINESS_TOPICS_KEY]: 'business_topics',
      [DAILY_GOAL_KEY]: 'daily_goal_minutes',
      [REMINDER_TIME_KEY]: 'reminder_time'
    };
    
    const column = columnMap[key];
    if (!column) return null;
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(column)
      .eq('user_id', user.id)
      .single();
    
    if (profile) {
      // Save to local storage for future speed
      const value = profile[column as keyof typeof profile];
      if (value !== null) {
        await AsyncStorage.setItem(
          key, 
          typeof value === 'string' ? value : JSON.stringify(value)
        );
        return value;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return null;
  }
}

// Load all profile data at once (useful for profile screen)
export async function getAllProfileData(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    return profile;
  } catch (error) {
    console.error('Error getting profile data:', error);
    return null;
  }
} 