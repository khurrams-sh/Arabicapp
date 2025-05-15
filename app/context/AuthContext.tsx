import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the shape of our authentication context
interface AuthContextType {
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  signIn: async () => false,
  signOut: async () => {},
});

// Create a provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check if user is already signed in
  useEffect(() => {
    // This would normally check an auth token or session
    const checkAuth = async () => {
      try {
        // Mock implementation
        setIsSignedIn(true);
      } catch (error) {
        console.error('Error checking authentication status:', error);
      }
    };

    checkAuth();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      // This would normally call an authentication API
      console.log(`Signing in with ${email}`);
      setIsSignedIn(true);
      return true;
    } catch (error) {
      console.error('Error signing in:', error);
      return false;
    }
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      // This would normally call an API to invalidate session
      console.log('Signing out');
      setIsSignedIn(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 