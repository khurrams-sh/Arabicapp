import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://flsmjkklnarcsupkdglc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc21qa2tsbmFyY3N1cGtkZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2ODI5NzQsImV4cCI6MjA2MDI1ODk3NH0.KbiVnKY354TS8gtoPOZH0_F9rDTAJNWnGLhPQTgZjSs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom sign up function that doesn't require email verification
export const signUpUser = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: undefined,
    },
  });
  
  if (error) throw error;
  
  // If the sign-up was successful but the user is not fully authenticated yet
  // (because email verification is still enabled on Supabase's end),
  // we'll manually sign them in right away
  if (data.user && !data.session) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }
  
  return { data, error: null };
}; 