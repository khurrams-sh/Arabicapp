import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Set initial user state to null instead of using a mock user
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading state true

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    
    // Redirect to welcome screen
    router.replace('/(onboarding)/welcome');
  };

  useEffect(() => {
    // Load the session on mount
    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setIsLoading(false);
          return;
        }
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        } else {
          // Do not create a fake user for production
          setIsLoading(false);
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, setSession, setUser }}>
      {children}
    </AuthContext.Provider>
  );
} 